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

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    // 确保 transporter 已就绪
    await this.ready;
    if (!this.transporter) {
      throw new Error('邮件服务未就绪');
    }

    const info = await this.transporter.sendMail({
      from: `"Career Copilot" <${this.configService.get<string>('SMTP_FROM', 'noreply@career-copilot.com')}>`,
      to,
      subject: '密码重置验证码 - Career Copilot',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <h2 style="color:#4F46E5;">Career Copilot</h2>
          <p>您收到了密码重置的请求。请使用以下验证码重置密码：</p>
          <div style="text-align:center;margin:24px 0;padding:16px;background:#F3F4F6;border-radius:8px;letter-spacing:8px;font-size:32px;font-weight:bold;color:#4F46E5;">
            ${code}
          </div>
          <p style="color:#6B7280;font-size:14px;">此验证码有效期为 10 分钟。如果您没有请求重置密码，请忽略此邮件。</p>
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

    this.logger.log(`密码重置验证码已发送至 ${to}`);
    this.logger.log(`🔑 验证码: ${code}`);
  }
}
