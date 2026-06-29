import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private ready: Promise<void>;

  constructor(private configService: ConfigService) {
    const smtpEnabled = configService.get<string>('SMTP_ENABLED') === 'true';
    if (smtpEnabled) {
      this.transporter = nodemailer.createTransport({
        host: configService.get<string>('SMTP_HOST', 'smtp.example.com'),
        port: configService.get<number>('SMTP_PORT', 587),
        secure: configService.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: {
          user: configService.get<string>('SMTP_USER'),
          pass: configService.get<string>('SMTP_PASS'),
        },
      });
      this.ready = Promise.resolve();
    } else {
      // 开发环境：使用 ethereal 伪造邮件（异步创建）
      this.ready = nodemailer.createTestAccount().then((account) => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });
        this.logger.log(
          `📧 Ethereal 邮件账户已创建：${account.user}`,
        );
      });
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    // 确保 transporter 已就绪
    await this.ready;
    if (!this.transporter) {
      throw new Error('邮件服务未就绪');
    }
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3002')}/reset-password.html?token=${token}`;

    const info = await this.transporter.sendMail({
      from: `"Career Copilot" <${this.configService.get<string>('SMTP_FROM', 'noreply@career-copilot.com')}>`,
      to,
      subject: '重置您的密码 - Career Copilot',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <h2 style="color:#4F46E5;">Career Copilot</h2>
          <p>您收到了重置密码的请求。请点击下方链接重置密码：</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
            重置密码
          </a>
          <p style="color:#6B7280;font-size:14px;">此链接有效期为 30 分钟。如果您没有请求重置密码，请忽略此邮件。</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;" />
          <p style="color:#6B7280;font-size:12px;">
            ⚠️ 如果上方按钮无法点击（QQ邮箱可能拦截外部链接），请复制下方链接并在浏览器中打开：<br />
            <span style="color:#4F46E5;word-break:break-all;">${resetUrl}</span>
          </p>
        </div>
      `,
    });

    // 开发环境（Ethereal）下输出预览 URL
    if (this.configService.get<string>('SMTP_ENABLED') !== 'true') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 预览邮件内容: ${previewUrl}`);
      }
    }

    this.logger.log(`密码重置邮件已发送至 ${to}`);
    this.logger.log(`🔗 重置链接: ${resetUrl}`);
  }
}
