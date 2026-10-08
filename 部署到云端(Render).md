# 部署到 Render（免费 · 固定地址 · 朋友随时进）

目标：把「网页聊天版」跑在 Render 免费云上，得到一个**永久固定**的公网地址（如 `https://mini-web-chat-xxx.onrender.com`），不再像 pinggy 临时隧道那样 60 分钟一换。

> 前提：需要一个 GitHub 账号（没有就去 https://github.com 注册，免费）。
> 聊天服务本身在云端，**不经任何第三方中继、不依赖你本机开机**。

---

## 一、把代码推到 GitHub

1. 在 GitHub 新建一个仓库（公开或私有均可），比如叫 `mini-web-chat`。
2. 把 `网页聊天版` 文件夹里的这些文件上传到仓库根目录：
   - `server.js`
   - `package.json`
   - `public/`（整个文件夹）
   - `render.yaml`
   - `.gitignore`
3. 提交（commit）。

> 不会用 Git 命令行也没关系：GitHub 网页上直接「Add file → Upload files」把文件拖上去也行。

## 二、在 Render 部署

1. 打开 https://dashboard.render.com ，用 **GitHub 登录**授权。
2. 点 **New + → Web Service**，选择你刚建的仓库。
3. 配置保持默认即可（Render 会读 `render.yaml`）：
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: **Free**
4. 展开 **Advanced → Environment → Add Environment Variable**，建议加一项：
   - `ROOM_KEY` = 一串你自己定的随机密码（如 `k7x2pQ9m`）。设了之后，只有带 `?key=k7x2pQ9m` 的链接能进群，挡住外人瞎蹭。
   - （不想设密码就跳过，直接开放。）
5. 点 **Create Web Service**。约 1–2 分钟部署完成。

## 三、拿到固定地址，拉人进群

- 部署完成后，Render 给你一个固定地址，形如：
  `https://mini-web-chat-xxx.onrender.com`
- 把这个地址发到微信里给朋友（微信只当传话工具，敏感内容到群里聊）。
- 朋友打开 → 填昵称 → 进群实时聊。想开专属群：访问 `/home` 输群名生成邀请链接，或聊天页点「邀请」。
- 设了 `ROOM_KEY` 就分享带 key 的链接：`https://mini-web-chat-xxx.onrender.com/?room=财经交流&key=k7x2pQ9m`

## 四、免费版要注意的几点

- **15 分钟无访问会休眠**，下次访问冷启动约 20–30 秒（首次打开稍慢，正常）。
- **消息已做文件持久化**：休眠/重启后历史还在；但重新部署（改代码）会清空服务端磁盘、历史清空，属正常。
- **地址永久固定**，不用再一遍遍换链接——这正是它比临时隧道强的地方。
- 想彻底不休眠可升级付费（$7/月），但对小群没必要。

## 五、本地临时测试（可选）

本地想先试：
```bash
cd 网页聊天版
node server.js          # 打开 http://localhost:3000
```
本地验证用，正式给朋友用就走上面云端地址。
