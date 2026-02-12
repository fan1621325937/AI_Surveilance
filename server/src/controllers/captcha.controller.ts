import { type Request, type Response } from "express";
import svgCaptcha from "svg-captcha";
import { v4 as uuidv4 } from "uuid";
import { CaptchaUtils } from "../utils/captcha-cache.js";

/**
 * 验证码控制器
 */
export class CaptchaController {
  /**
   * 生成图片验证码 (普通字符)
   */
  static async getCaptcha(req: Request, res: Response) {
    try {
      const captcha = svgCaptcha.create({
        size: 4,
        ignoreChars: "0o1i",
        noise: 2,
        color: true,
        background: "#f0f0f0",
      });

      if (!captcha || !captcha.text) {
        throw new Error("Captcha generation failure");
      }

      const captchaId = uuidv4();
      await CaptchaUtils.set(captchaId, captcha.text);

      res.json({
        code: 200,
        captchaId,
        img: captcha.data,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: "获取验证码失败",
      });
    }
  }

  /**
   * 生成数学算式验证码
   */
  static async getMathCaptcha(req: Request, res: Response) {
    try {
      const captcha = svgCaptcha.createMathExpr({
        mathMin: 1,
        mathMax: 9,
        mathOperator: "+",
        noise: 1,
        color: true,
      });

      if (!captcha || !captcha.text) {
        throw new Error("Math captcha generation failure");
      }

      const captchaId = uuidv4();
      await CaptchaUtils.set(captchaId, captcha.text);

      res.json({
        code: 200,
        captchaId,
        img: captcha.data,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: "Failed to generate math captcha",
      });
    }
  }
}
