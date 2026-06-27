import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // 开发环境下使用 ethereal（伪造邮件），生产环境用真实 SMTP
    if (configService.get<string>('NODE_ENV') === 'production') {
      this.transporter = nodemailer.createTransport({
        host: configService.get<string>('SMTP_HOST', 'smtp.example.com'),
        port: configService.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: configService.get<string>('SMTP_USER'),
          pass: configService.get<string>('SMTP_PASS'),
        },
      });
    } else {
      // 开发环境：使用 ethereal 伪造邮件（日志输出链接即可查看内容）
      nodemailer.createTestAccount().then((account) => {
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
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token=${token}`;

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
        </div>
      `,
    });

    // 开发环境下输出预览 URL
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 预览邮件内容: ${previewUrl}`);
      }
    }

    this.logger.log(`密码重置邮件已发送至 ${to}`);
  }
}
