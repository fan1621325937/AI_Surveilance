# Ai Surveillance (企业级全场景智能监控系统)

![CI/CD](https://github.com/fan1621325937/AI_Surveilance/actions/workflows/ci.yml/badge.svg)

本项目是一个全栈式 AI 视频监控管理平台，集成了实时视频流处理、智能算法分析、多端管理展示等核心功能。

---

## 🏗️ 项目架构

系统采用前后端分离架构，核心模块定义如下：

- **[Server (Node.js)](file:///e:/项目示例/Ai_Surveillance/server/README.md)**:
  - 核心业务 API，基于 Express 5 + Prisma。
  - **安全性**: RSA-OAEP 非对称解密 + HttpOnly JWT 认证。
  - **缓存层**: Redis 分布式验证码与 Session 管理。
- **[Web (React 19)](file:///e:/项目示例/Ai_Surveillance/web/README.md)**:
  - 现代化监控后台，基于 React 19 + Vite 7。
  - **视觉提升**: Tailwind CSS v4 + shadcn/ui。
  - **交互**: 适配多端响应式，具备科技感 UI 动效。
- **[UniApp (Mobile)](file:///e:/项目示例/Ai_Surveillance/uniapp)**:
  - 移动端监控 App (待进一步集成)。

---

## 🛠️ 快速启动 (全栈模式)

### 1. 启动基础设施

确保本地已安装并启动 **MySQL** (v8+) 和 **Redis** (v7+)。

### 2. 启动后端服务

```bash
cd server
npm install
npm run prisma:generate
npm run dev
```

### 3. 启动前端平台

```bash
cd web
npm install
npm run dev
```

---

## 🛡️ 安全标准

- **传输层**: 强制开启公钥握手，敏感信息不落明文。
- **持久层**: 各模块独立配置密钥，符合业界标准的安全填充准则。
- **审计层**: 全量业务日志记录，支持 Pino 结构化滚动切分。

---

## 📜 维护说明

- **文档同步**: 每次架构变更后，请务必同步更新各个模块的 `README.md` 与根目录总览。
- **规范检查**: 提交前执行 `npm run lint` 和 `tsc --noEmit`。
