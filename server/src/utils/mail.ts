import nodemailer from "nodemailer";
import config from "../config/index.js";
import logger from "./logger.js";

/**
 * 邮件服务工具类
 * 封装了基于 SMTP 的邮件发送功能，支持 HTML 和附件
 */
export class MailUtils {
  private static transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });

  /**
   * 发送简单 HTML 邮件
   * @param to 收件人地址
   * @param subject 邮件主题
   * @param html HTML 内容
   */
  static async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${config.mail.fromName}" <${config.mail.user}>`,
        to,
        subject,
        html,
      });

      logger.info(`📧 Email sent successfully to [${to}]: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(error, `❌ Failed to send email to [${to}]`);
      throw { status: 500, message: "邮件发送失败，请检查系统配置" };
    }
  }

  /**
   * 发送验证码邮件 (预设模板)
   * @param to 收件人地址
   * @param code 验证码
   */
  static async sendVerificationCode(to: string, code: string) {
    const subject = "数字验证码 - AI监控系统鉴权";
    const html = `
      <div style="padding: 20px; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
          <div style="padding: 20px; background: linear-gradient(135deg, #1890ff 0%, #001529 100%); color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">身份认证</h1>
          </div>
          <div style="padding: 40px; text-align: center;">
            <p style="font-size: 16px; color: #666;">您正在进行登录或敏感操作，验证码如下：</p>
            <div style="margin: 30px 0; padding: 15px; background-color: #f0f5ff; border: 1px dashed #1890ff; border-radius: 4px;">
              <span style="font-size: 36px; font-weight: bold; color: #1890ff; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #999;">验证码有效期为 5 分钟，请勿泄露给他人。</p>
          </div>
          <div style="padding: 20px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #999;">
            此邮件由系统自动发送，请勿直接回复。
          </div>
        </div>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }
}

// nodemailer常用api
// nodemailer.createTransport(options) //创建传输对象
// transporter.sendMail(mailOptions) //发送邮件
// transporter.verify() //验证连接配置
