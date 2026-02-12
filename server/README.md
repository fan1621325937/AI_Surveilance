# AI 视频监控系统 - 服务端 (Node.js)

本项目是 AI 视频监控系统的核心后端服务，基于 **Node.js + Express + Prisma + TypeScript** 构建，旨在提供高性能、类型安全且易于扩展的基础设施。

---

## 📂 目录结构说明

服务端采用分层式架构，确保业务逻辑与底层实现解耦：

```text
server/
├── prisma/                # [Prisma ORM 层]
│   └── schema.prisma      # 数据库模型定义文件（核心）
├── src/                   # [源代码目录]
│   ├── app.ts             # 应用主入口，配置中间件与路由入口
│   ├── controllers/       # 控制层：处理具体业务逻辑 (如登录、验证码)
│   ├── services/          # 服务层：核心业务 (如 AuthService 实现)
│   ├── routes/            # 路由定义：包含路由入口 index.ts
│   ├── middlewares/       # 中间件：包含全局错误处理 error.middleware.ts
│   ├── utils/             # 工具类：Logger, Crypto, JWT, 验证码缓存
│   └── ...
├── .env                   # 环境变量：数据库 URL、机密密钥
├── config.yaml            # 业务配置：系统基础设置
├── prisma/                # 数据库 Schema：采用类若依权限架构
├── logs/                  # 日志目录：自动生成并按天滚动
└── README.md              # 本文档
```

---

## 🔐 权限与个性化系统 (类若依)

本项目正在逐步落地一套类若依 (RuoYi) 的企业级权限体系：

- **组织管理**: 支持多维度的用户、角色、权限关系映射。
- **个性化布局**: 用户支持自定义主页布局 (LayoutConfig) 和显示偏好 (Preferences)。
- **资产绑定**: 支持摄像头设备与特定用户/角色的权限绑定。

🛡️ 全链路安全传输 (RSA-OAEP + HttpOnly Cookie)

为了达到金融级的安全标准，本项目实现了以下增强：

1. **非对称加密 (RSA-OAEP)**:
   - 采用 **RSA-OAEP (SHA-256)** 填充标准，彻底解决旧版 Node 运行时的解密兼容性问题。
   - 登录前通过 `GET /auth/public-key` 获取 PEM 格式公钥。
   - 客户端使用浏览器原生的 **Web Crypto API** 进行异步加密。
   - 服务端使用私钥解密，防止传输层凭据泄漏。
2. **安全会话 (HttpOnly)**:
   - 登录成功后的鉴权令牌 (JWT) 不再暴露在 Body 中。
   - 自动通过 `Set-Cookie` 写入 `Admin-Token`。
   - 开启 `HttpOnly` (防脚本读取) 和 `SameSite: Strict` (防 CSRF)。
3. **注入防御 (Injection Defense)**:
   - 全接口引入 **Zod** 进行严格类型与格式校验。
   - 对敏感字段（如用户名、评论等）使用 **Validator.js** 进行 HTML 转义与清洗。
   - 即使绕过前端拦截，后端逻辑层也能彻底杜绝 XSS 与代码注入风险。
4. **接口限流阀 (Rate Limiting)**:
   - 基于 **Redis Store** 实现分布式限流。
   - 针对登录接口设定 15 分钟/10 次尝试的阈值，有效抵御自动化暴力破解。
5. **可扩展登录架构 (Strategy Pattern)**:
   - 登录识别逻辑采用 **策略模式** 实现，核心业务与查询逻辑解耦。
   - 支持通过注册新的 `LoginStrategy` 快速扩展登录模式（如手机验证码、LDAP 等），无需修改主流程代码。
6. **核心邮件推送 (Mail Service)**:
   - 集成基于 **Nodemailer** 的 SMTP 推送能力，支持 QQ 邮箱授权码登录。
   - 具备内置 HTML 模板渲染能力，支持验证码推送与系统安全告警。

## 🛡️ 防爬虫验证 (验证码系统)

为了防止恶意暴力破解，登录接口集成了基于 `svg-captcha` 的图形验证码：

1. **获取验证码**: `GET /auth/captcha`
   - 返回 `captchaId` (唯一标识) 和 `img` (SVG 源码)。
2. **分布式存储 (Redis)**:
   - 验证码答案存储于 **Redis** 中，Key 前缀为 `captcha:`。
   - 设置过期时间为 5 分钟，支持水平扩展与负载均衡。
   - 校验通过后立即原子化删除，防止重放攻击。
3. **登录校验**: `POST /auth/login`
   - 提交 `captchaId` 和 `captchaCode` 进行异步 Redis 校验。

---

## 🛠️ 关键依赖项解析

| 依赖项                 | 作用说明                         |
| :--------------------- | :------------------------------- |
| **Express (v5)**       | 负责核心 API 服务。              |
| **Prisma**             | 新一代 ORM，提供极佳的类型提示。 |
| **Argon2**             | 顶级密码哈希算法。               |
| **Pino**               | 高性能结构化日志系统。           |
| **svg-captcha**        | 图形验证码插件。                 |
| **ioredis**            | 高性能 Redis 客户端。            |
| **express-rate-limit** | 分布式接口限流核心。             |
| **rate-limit-redis**   | Redis 限流存储后端。             |
| **zod**                | 声明式模式校验库。               |
| **validator**          | 字符串清洗与验证工具。           |
| **Cookie-Parser**      | 解析与操作浏览器 Cookie。        |
| **JsonWebToken**       | 标准的身份认证令牌方案。         |
| **Nodemailer**         | 通用邮件推送客户端。             |
| **Crypto (Native)**    | 用于 RSA-OAEP 加解密。           |
| **TypeScript**         | 静态类型检查。                   |

---

## 🗄️ 数据库安装与配置指南

### 1. 配置环境变量与 YAML

本项目采用混合配置模式：

- **.env**: 存放数据库连接字符串（MySQL）和端口。
- **config.yaml**: 存放系统通用业务逻辑配置。

修改连接字符串：

```env
DATABASE_URL="mysql://root:password@localhost:3306/ai_video"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_DB=0

# 邮件配置
SMTP_USER="592416554@qq.com"
SMTP_PASS="你的授权码"
```

### 2. 数据模型同步

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

---

## 🚀 常用开发命令

- **启动开发服务**: `npm run dev` (支持彩色美化日志)
- **生产环境编译**: `npm run build`
- **运行生产服务**: `npm run start` (输出结构化 JSON 日志)
- **打开 Prisma Studio**: `npm run prisma:studio`

---

## 💡 技术笔记

- **安全第一**: 严禁在生产环境明文存储密码，请务必使用项目内置的 `CryptoUtils`。
- **日志规范**: 系统日志会同时输出到控制台（Stdout）并持久化到 `server/logs/` 目录。使用 `pino-roll` 实现按天滚动切分。
- **模块规范**: 遵循 ECMAScript Modules (ESM) 规范。
