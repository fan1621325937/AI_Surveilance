import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import * as dotenv from "dotenv"; // dotenv用于加载环境变量
import { fileURLToPath } from "url";

// 兼容 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 加载 .env 环境变量
dotenv.config({ path: path.join(__dirname, "../../.env") });

// 2. 定义基础配置接口类型
interface Config {
  system: {
    log_level: string; //日志级别
    max_retries: number; //最大重试次数
    health_check_interval: number; //健康检查间隔
    cors_whitelist: string[]; //跨域白名单
  };
  redis: {
    host: string; //redis地址
    port: number; //redis端口
    password?: string; //redis密码
    db: number; //redis数据库
  };
  auth: {
    captcha_enabled: boolean; //验证码是否开启
    login_methods: {
      account: boolean; //账号登录
      email: boolean; //邮箱登录
    };
    rate_limit: {
      window_ms: number; //限流窗口 (毫秒)
      max_attempts: number; //窗口内最大尝试次数
    };
  };
  env: {
    PORT: number; //端口
    DATABASE_URL: string; //数据库连接
    JWT_SECRET: string; //jwt密钥
    JWT_EXPIRES_IN: string; //jwt过期时间
  };
  mail: {
    host: string; //SMTP服务器地址
    port: number; //SMTP端口
    secure: boolean; //是否安全连接
    user: string; //发件人账号
    pass: string; //发件人授权码
    fromName: string; //默认发件人名称
  };
}

// 3. 加载 YAML 配置文件
const yamlPath = path.join(__dirname, "../../config.yaml");
let yamlConfig: any = {};

try {
  const fileContents = fs.readFileSync(yamlPath, "utf8");
  yamlConfig = yaml.load(fileContents);
} catch (e) {
  console.error("❌ Failed to load config.yaml:", e);
}

// 4. 处理环境变量中的复杂配置 (如 JSON)
const parseJsonEnv = (key: string, fallback: any) => {
  const value = process.env[key];
  if (!value) return fallback;
  try {
    const cleanValue = value.split("//")[0]?.trim();
    return cleanValue ? JSON.parse(cleanValue) : fallback;
  } catch {
    return fallback;
  }
};

// 5. 整合配置并导出
export const config: Config = {
  ...yamlConfig,
  auth: {
    captcha_enabled: process.env.SHOW_CAPTCHA
      ? process.env.SHOW_CAPTCHA.split("//")[0]?.trim() === "true"
      : (yamlConfig.auth?.captcha_enabled ?? true), //判断是否开启验证码
    login_methods: parseJsonEnv(
      "LOGIN_WAY",
      yamlConfig.auth?.login_methods || { account: true, email: true },
    ), //判断登录方式
    rate_limit: {
      window_ms: parseInt(
        process.env.LOGIN_RATE_LIMIT_WINDOW ||
          yamlConfig.auth?.rate_limit?.window_ms ||
          "900000",
        10,
      ), // 默认 15 分钟
      max_attempts: parseInt(
        process.env.LOGIN_RATE_LIMIT_MAX ||
          yamlConfig.auth?.rate_limit?.max_attempts ||
          "10",
        10,
      ), // 默认 10 次
    },
  },
  env: {
    PORT: parseInt(process.env.PORT || "3000", 10), //端口
    DATABASE_URL: process.env.DATABASE_URL || "", //数据库连接
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_key", //jwt密钥
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h", //jwt过期时间
  },
  mail: {
    host: process.env.SMTP_HOST || yamlConfig.mail?.host || "smtp.qq.com",
    port: parseInt(process.env.SMTP_PORT || yamlConfig.mail?.port || "465", 10),
    secure:
      (process.env.SMTP_SECURE || yamlConfig.mail?.secure || "true") === "true",
    user: process.env.SMTP_USER || yamlConfig.mail?.user || "",
    pass: process.env.SMTP_PASS || yamlConfig.mail?.pass || "",
    fromName:
      process.env.SMTP_FROM_NAME || yamlConfig.mail?.fromName || "AI监控系统",
  },
  redis: {
    host: process.env.REDIS_HOST || yamlConfig.redis?.host || "127.0.0.1", //redis地址
    port: parseInt(
      process.env.REDIS_PORT || yamlConfig.redis?.port || "6379",
      10,
    ), //redis端口
    password:
      process.env.REDIS_PASSWORD || yamlConfig.redis?.password || undefined, //redis密码
    db: parseInt(process.env.REDIS_DB || yamlConfig.redis?.db || "0", 10), //redis数据库
  },
};

export default config;
