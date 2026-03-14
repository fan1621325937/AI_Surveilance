import { type Request, type Response } from "express";
import svgCaptcha from "svg-captcha";
import { v4 as uuidv4 } from "uuid";
import { CaptchaUtils } from "../utils/captcha-cache.js";
import { R } from "../utils/response.js";
import logger from "../utils/logger.js";

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

      if (!captcha?.text) {
        throw new Error("Captcha generation failure");
      }

      const captchaId = uuidv4();
      await CaptchaUtils.set(captchaId, captcha.text);

      R.ok(res, { captchaId, img: captcha.data });
    } catch (error) {
      logger.error(error, "Failed to generate captcha");
      R.fail(res, 500, "获取验证码失败");
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

      if (!captcha?.text) {
        throw new Error("Math captcha generation failure");
      }

      const captchaId = uuidv4();
      await CaptchaUtils.set(captchaId, captcha.text);

      R.ok(res, { captchaId, img: captcha.data });
    } catch (error) {
      logger.error(error, "Failed to generate math captcha");
      R.fail(res, 500, "获取数学验证码失败");
    }
  }
}
