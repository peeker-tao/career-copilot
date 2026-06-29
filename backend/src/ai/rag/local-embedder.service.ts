import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';

/**
 * 本地 Embedding 服务 —— 管理 Python 子进程
 *
 * 通过 child_process + stdin/stdout JSON 行协议与 embed_worker.py 通信。
 * 模型常驻 Python 进程内存，避免每次调用重新加载。
 */
@Injectable()
export class LocalEmbedderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocalEmbedderService.name);

  /** Python 子进程 */
  private proc: ChildProcess | null = null;

  /** readline 接口（逐行读取 stdout） */
  private rl: readline.Interface | null = null;

  /** 等待中的请求队列 */
  private pending = new Map<
    string,
    { resolve: (v: number[]) => void; reject: (e: Error) => void }
  >();

  /** 请求 ID 自增 */
  private requestId = 0;

  /** 进程是否已就绪 */
  private ready = false;

  /** 待进程就绪的等待者 */
  private readyQueue: Array<() => void> = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.startWorker();
  }

  async onModuleDestroy() {
    this.killWorker();
  }

  // ═══════════════════════════════════════════════════════════════
  //  公开方法
  // ═══════════════════════════════════════════════════════════════

  /**
   * 生成文本的向量嵌入
   */
  async embed(text: string): Promise<number[]> {
    // 等待进程就绪
    if (!this.ready) {
      await new Promise<void>((resolve) => this.readyQueue.push(resolve));
    }

    return new Promise<number[]>((resolve, reject) => {
      const id = String(++this.requestId);
      this.pending.set(id, { resolve, reject });

      const request = JSON.stringify({ text, id }) + '\n';
      this.proc?.stdin?.write(request, 'utf-8');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  进程管理
  // ═══════════════════════════════════════════════════════════════

  private async startWorker() {
    // 查找 Python 可执行路径
    const pythonPath = await this.resolvePython();

    // scripts/embed_worker.py 位于项目根目录下，相对于工作目录（backend/）
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'embed_worker.py');

    this.logger.log(`🐍 启动 Embedding Worker: ${pythonPath} ${scriptPath}`);

    this.proc = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // 国内 HuggingFace 镜像（加速模型下载）
        HF_ENDPOINT: process.env.HF_ENDPOINT || 'https://hf-mirror.com',
        HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
      },
    });

    this.proc.on('exit', (code, signal) => {
      this.logger.warn(
        `❗ Embedding Worker 已退出 (code=${code}, signal=${signal})`,
      );
      this.ready = false;
      this.rejectAll(new Error(`Worker 退出 (${code})`));
    });

    this.proc.on('error', (err) => {
      this.logger.error(`❌ Embedding Worker 错误: ${err.message}`);
      this.ready = false;
      this.rejectAll(err);
    });

    // stderr 转发到日志
    this.proc.stderr?.on('data', (data: Buffer) => {
      this.logger.warn(`[Worker stderr] ${data.toString().trim()}`);
    });

    // stdout 按行解析
    this.rl = readline.createInterface({ input: this.proc.stdout! });
    this.rl.on('line', (line: string) => this.handleResponse(line));
  }

  /**
   * 处理 Python 进程的响应
   */
  private handleResponse(line: string) {
    try {
      const msg = JSON.parse(line.trim());

      // 就绪消息
      if (msg.ready) {
        this.logger.log(`✅ Embedding Worker 就绪 (model: ${msg.model})`);
        this.ready = true;
        // 唤醒所有等待者
        for (const resolve of this.readyQueue) resolve();
        this.readyQueue = [];
        return;
      }

      // 错误响应
      if (!msg.ok) {
        const id = msg.id;
        this.logger.warn(`⚠️  Embedding 失败: ${msg.error}`);
        if (id && this.pending.has(id)) {
          this.pending.get(id)!.reject(new Error(msg.error));
          this.pending.delete(id);
        }
        return;
      }

      // 成功响应
      const id = msg.id;
      if (id && this.pending.has(id)) {
        this.pending.get(id)!.resolve(msg.embedding);
        this.pending.delete(id);
      }
    } catch (e) {
      this.logger.warn(`⚠️  无法解析 Worker 响应: ${line}`);
    }
  }

  private killWorker() {
    if (this.proc) {
      this.proc.kill('SIGTERM');
      // 等 2 秒强制杀
      setTimeout(() => {
        if (this.proc) this.proc.kill('SIGKILL');
      }, 2000).unref();
    }
    this.rl?.close();
    this.proc = null;
    this.rl = null;
    this.ready = false;
  }

  private rejectAll(error: Error) {
    for (const [id, { reject }] of this.pending) {
      reject(error);
    }
    this.pending.clear();
    for (const resolve of this.readyQueue) resolve();
    this.readyQueue = [];
  }

  /**
   * 查找 Python 可执行文件路径
   * 优先使用配置的路径，否则在 PATH 中查找
   */
  private async resolvePython(): Promise<string> {
    const configured =
      this.configService.get<string>('EMBEDDING_PYTHON_PATH') || '';
    if (configured) return configured;

    // 检查 venv 路径
    const candidates = [
      // 项目 .venv
      path.resolve(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe'),
      // 当前进程的 python（如果 Node.js 是在 venv 中运行的）
      process.env.PYTHON_PATH || '',
      // PATH 中的 python
      'python',
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const { execSync } = require('child_process');
        const ver = execSync(
          `"${candidate}" -c "from fastembed import TextEmbedding; print('ok')"`,
          { encoding: 'utf-8', timeout: 5000 },
        );
        if (ver.trim() === 'ok') return candidate;
      } catch {
        continue;
      }
    }

    // 兜底
    return 'python';
  }
}
