# 免 GitHub 部署方案（2026 年实测）

## 先说结论
Render 官方部署 **必须** 连一个 Git 仓库（GitHub 或 GitLab），它不支持"纯网页上传文件夹"。
所以"完全不上传 GitHub"在 Render 上做不到——但可以换平台。

你的 `package.json` 里已有 `"start": "node server.js"`，下面两个免 GitHub 平台都能**零配置直接跑**，
不需要改任何代码，只换部署方式。

---

## 三个免 GitHub 选项对比

| 平台 | 免 GitHub？ | 永久免费？ | 适合度 | 关键限制 |
|---|---|---|---|---|
| **Railway** | ✅ 本地 `railway up` 直传目录 | ❌ 仅 $5 一次性试用（约 30 天），之后 $1/月起 | ⭐⭐⭐ 体验最好 | 试用后付费；需装 CLI、注册账号 |
| **Glitch** | ✅ 浏览器内操作 | ✅ 永久免费 | ⭐⭐ 够用 | 代码默认**公开**；512MB、会休眠、限流；仅适合小群/临时 |
| **Render + 私有 GitLab** | 用 GitLab 不用 GitHub | ✅ 免费 | ⭐⭐⭐ 最稳 | 仍是 Git，只是避开 github.com 这个网站；仓库可设私有 |

> 另外 Fly.io / Koyeb 在 2026 年新账户已**无免费计算额度**，排除。

---

## 方案 A：Railway（免 GitHub，最省事、体验最好）

本地目录一键上传，不需要任何 Git 仓库。

1. 注册 https://railway.app （邮箱即可，无需 GitHub）
2. 装 CLI（用你已有的 Node）：
   ```bash
   npm install -g @railway/cli
   ```
3. 登录（会弹浏览器授权）：
   ```bash
   railway login
   ```
4. 进入项目目录：
   ```bash
   cd 网页聊天版
   ```
5. 初始化并部署（Railway 用 Nixpacks 自动识别 Node，`npm install` + `npm start`）：
   ```bash
   railway init
   railway up
   ```
6. 设置环境变量（建议）：
   ```bash
   railway variables set ROOM_KEY=你的房门密码 ADMIN_PASS=后台密码
   ```
7. 拿公网地址：
   ```bash
   railway domain
   ```
   或到 dashboard 的 Settings → Domains 查看。

- 聊天：`https://你的地址.up.railway.app`
- 后台：`https://你的地址.up.railway.app/admin`

⚠️ **费用提醒**：Railway 现在不是永久免费，新账户给 $5 一次性试用额度（约 30 天）；
用完按量计费，最低约 $1/月（Developer 计划）。小群聊流量极低，几块钱能跑很久，但严格说不是"免费"。

---

## 方案 B：Glitch（免 GitHub，永久免费，代码会公开）

纯浏览器操作，适合不想碰命令行、能接受"项目代码公开"的场景。
（代码公开 ≠ 聊天内容公开；聊天数据仍在服务器，外人看不到，只是你的源码能被搜到。）

1. 打开 https://glitch.com 注册
2. New Project → 选 **Import from GitHub** 旁边的 **"hello-express"** 模板，或新建后直接编辑
3. 把本项目三个东西放进去：
   - `server.js`（直接粘贴/上传）
   - `package.json`（同上）
   - `public/` 整个文件夹（拖进 Glitch 文件树）
4. Glitch 自动 `npm install` + `npm start` 运行，状态变 "Active" 即可
5. 地址：`https://你的项目名.glitch.me`
6. 设变量：左边 **.env** 文件加 `ROOM_KEY=xxx`、`ADMIN_PASS=xxx`

⚠️ 限制：免费项目 5 分钟无访问会休眠（下次打开冷启动几秒）；512MB 内存；
请求量有限。小群聊够用，几十人长期用会吃力。

---

## 方案 C：Render + 私有 GitLab（避开 GitHub 网站，仍永久免费）

如果你只是"不想用 github.com"，但不排斥 Git 本身：
1. 在 gitlab.com 建**私有**仓库，把代码推上去
2. Render 关联 GitLab（不是 GitHub）部署
3. 其余步骤同 `部署到云端(Render).md`
好处：仓库别人看不见，Render 免费额度照用（15 分钟休眠、冷启动 30s）。

---

## 推荐怎么选
- **只想要"免 GitHub + 真免费"** → 方案 B（Glitch），接受代码公开 + 小限制。
- **要稳定体验、能接受小额** → 方案 A（Railway），最省事。
- **不想用 GitHub 网站、不介意 Git** → 方案 C（Render + 私有 GitLab），最稳的永久免费。

需要我把哪一个做成"一键配置"（比如补一份 `railway.json` 显式指定启动命令和端口），
或帮你把 Glitch 的文件结构整理好，跟我说一声即可。
