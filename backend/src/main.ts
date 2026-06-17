import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { urlencoded } from 'express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 禁用内置 bodyParser，由下方自定义中间件接管 JSON 解析
    bodyParser: false,
  });

  // 跨域配置
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // ======== 自定义 JSON body 解析器（处理 Swagger UI 中未转义的控制字符）========
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return next();
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) {
        req.body = {};
        return next();
      }

      // 尝试提取纯净的 JSON 字符串
      const extractJson = (s: string): string => {
        s = s.replace(/^\uFEFF/, '').trim();
        if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return s.slice(start, end + 1);
        }
        return s;
      };

      // 转义字符串值内部的未转义控制字符（\n, \r, \t），但保留 JSON 结构中的合法空白
      const escapeCtrlInStrings = (s: string): string => {
        let result = '';
        let inString = false;
        let escapeNext = false;
        for (const ch of s) {
          if (escapeNext) {
            result += ch;
            escapeNext = false;
            continue;
          }
          if (ch === '\\' && inString) {
            result += ch;
            escapeNext = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            result += ch;
            continue;
          }
          if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
            if (ch === '\n') result += '\\n';
            else if (ch === '\r') result += '\\r';
            else if (ch === '\t') result += '\\t';
            continue;
          }
          result += ch;
        }
        return result;
      };

      try {
        req.body = JSON.parse(raw);
        next();
      } catch {
        // 先提取纯净 JSON，再转义字符串内部的未转义控制字符
        let sanitized = extractJson(raw);
        sanitized = escapeCtrlInStrings(sanitized);
        try {
          req.body = JSON.parse(sanitized);
          console.warn(`⚠️ 已清理请求体中的未转义控制字符`);
          next();
        } catch (e) {
          const err = e as Error;
          const posMatch = err.message.match(/position\s+(\d+)/);
          const errPos = posMatch ? parseInt(posMatch[1], 10) : -1;
          const errStart = Math.max(0, errPos - 10);
          const errEnd = Math.min(sanitized.length, errPos + 30);
          console.error('❌ JSON 解析失败，报错位置周围字符:');
          console.error('  错误位置:', errPos);
          console.error(
            '  周围文本:',
            JSON.stringify(sanitized.slice(errStart, errEnd)),
          );
          return res.status(400).json({
            code: 400,
            message: `JSON 格式错误: ${err.message}`,
          });
        }
      }
    });
    req.on('error', next);
  });

  // urlencoded 解析（用于表单提交）
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 全局路由前缀
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // ======== Swagger 文档配置 ========
  const config = new DocumentBuilder()
    .setTitle('Career-Copilot API')
    .setDescription('AI模拟面试官与智能职业规划平台 - 后端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: '输入您的 JWT token（格式: Bearer <token>）',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 刷新页面保持 token
      tryItOutEnabled: true, // 默认展开 Try it out
      displayRequestDuration: true, // 显示请求耗时
    },
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📖 API 文档: http://localhost:${port}/api-docs`);
}
bootstrap();
