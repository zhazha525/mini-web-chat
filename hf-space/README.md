---
title: 内部聊天室
emoji: 💬
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---

# 内部聊天室（Hugging Face Spaces 部署版）

零依赖 Node.js 网页聊天服务，实时靠 SSE，电脑/手机浏览器通用。

## 环境变量（在 Space 的 Settings → Variables 里设置）
- `ROOM_KEY`：进群口令（不设则 anyone 可进）
- `ADMIN_PASS`：管理后台密码（不设则关闭 /admin）

启动命令已在 Dockerfile 中写为 `node server.js`。
