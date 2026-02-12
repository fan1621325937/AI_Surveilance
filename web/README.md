# Ai Surveillance Web (企业级智能监控前端)

本项目是 AI 视频监控系统的 Web 客户端，基于 **React 19 + Vite 7 + shadcn/ui** 构建，具备高性能、现代化视觉体验与金融级安全保障。

---

## ✨ 核心特性

- **现代视觉系统**: 基于 **Tailwind CSS v4** 的 CSS-first 架构，集成 **shadcn/ui** 深度定制的高质感组件。
- **全链路安全防护**:
  - **RSA-OAEP (SHA-256)**: 密码提交前通过浏览器原生的 **Web Crypto API** 进行非对称加密。
  - **HttpOnly Cookie**: JWT 透明传输，原生防御 XSS。
- **高性能数据管理**: 使用 **TanStack Query (v5)** 实现数据的智能缓存、预取与自动同步。
- **企业级工程化**: 严格的 TypeScript 校验（Strict Mode）、自动化 Lint、以及数据路由模式。

---

## 🛠️ 技术栈

- **Core**: React 19 (Experimental features ready)
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **UI Framework**: shadcn/ui + Radix UI
- **Routing**: React Router v7+
- **State**: Zustand (Store-based architecture)
- **Networking**: Axios + TanStack Query v5

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 为 `.env` 并设置 API 基础路径：

```env
VITE_API_BASE_URL=/api
```

### 3. 本地开发

```bash
npm run dev
```

---

## 🏗️ 目录结构

```text
src/
├── api/            # 服务层定义与 Axios 拦截器
├── components/     # UI 组件与业务原子组件
├── layouts/        # 响应式布局 (MainLayout, AuthLayout)
├── pages/          # 业务逻辑页面 (Dashboard, Login)
├── store/          # Zustand 状态仓库
├── utils/          # Web Crypto (RSA-OAEP), 格式化工具
└── router/         # 权限守卫与路由表
```
