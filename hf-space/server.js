// 小型网页聊天服务 —— 零依赖（仅 Node 内置模块）
// 实时靠 SSE（服务器推送），发消息靠普通 POST，电脑/手机浏览器通用。
// 运行：node server.js   然后浏览器打开 http://<服务器地址>:3000
// 可选房间钥匙：设置环境变量 ROOM_KEY=xxx 后，访问需带 ?key=xxx，否则 403。

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOM_KEY = process.env.ROOM_KEY || ''; // 留空=不校验
const ADMIN_PASS = process.env.ADMIN_PASS || ''; // 留空=关闭后台
const MAX_HISTORY = 200;

// —— 文件持久化（让消息在云端休眠/重启后不丢失）——
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
function loadMessages() {
  try {
    const arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch (e) { /* 忽略写入失败（如只读磁盘） */ }
  }, 500);
}

const clients = new Map();        // id -> { res, room }
const messages = loadMessages(); // { room, user, text, ts }

function keyOk(url) {
  if (!ROOM_KEY) return true;
  return url.searchParams.get('key') === ROOM_KEY;
}

function broadcast(room, msg) {
  const payload = `data: ${JSON.stringify(msg)}\n\n`;
  for (const c of clients.values()) {
    if (c.room === room) {
      try { c.res.write(payload); } catch (e) { /* 忽略断开 */ }
    }
  }
}

function serveFile(res, file, type) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

// 管理后台：是否通过密码
function adminOk(req) {
  if (!ADMIN_PASS) return false;
  return (req.headers['x-admin-pass'] || '') === ADMIN_PASS;
}

// 管理后台：汇总统计
function getStats() {
  const rooms = {};
  for (const m of messages) {
    if (!rooms[m.room]) rooms[m.room] = { count: 0, users: new Set() };
    rooms[m.room].count++;
    if (m.user) rooms[m.room].users.add(m.user);
  }
  const online = {};
  for (const c of clients.values()) {
    if (!online[c.room]) online[c.room] = new Set();
    online[c.room].add(c.nick || '(未命名)');
  }
  const list = Object.keys(rooms).map(r => ({
    room: r,
    messages: rooms[r].count,
    users: [...rooms[r].users],
    online: [...(online[r] || [])],
    onlineCount: (online[r] || []).size,
    recent: messages.filter(m => m.room === r).slice(-20).map(m => ({ user: m.user, text: m.text, ts: m.ts })),
  }));
  for (const r of Object.keys(online)) {
    if (!rooms[r]) list.push({ room: r, messages: 0, users: [], online: [...online[r]], onlineCount: online[r].size, recent: [] });
  }
  return { total: messages.length, onlineTotal: clients.size, rooms: list };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const room = url.searchParams.get('room') || 'lobby';

  // CORS（允许跨域部署时网页也能调用接口）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // 首页
  if (req.method === 'GET' && url.pathname === '/') {
    serveFile(res, path.join(__dirname, 'public', 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  // 建群落地页（微信式邀请链接）
  if (req.method === 'GET' && url.pathname === '/home') {
    serveFile(res, path.join(__dirname, 'public', 'home.html'), 'text/html; charset=utf-8');
    return;
  }

  // SSE 事件流：接收实时消息 + 首屏历史
  if (req.method === 'GET' && url.pathname === '/events') {
    if (!keyOk(url)) { res.writeHead(403); res.end('forbidden'); return; }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('retry: 3000\n\n');
    const id = Date.now() + '-' + Math.random();
    const nick = url.searchParams.get('nick') || '';
    clients.set(id, { res, room, nick });
    const hist = messages.filter(m => m.room === room).slice(-50);
    res.write(`data: ${JSON.stringify({ type: 'history', messages: hist })}\n\n`);
    req.on('close', () => clients.delete(id));
    return;
  }

  // 发送消息
  if (req.method === 'POST' && url.pathname === '/send') {
    if (!keyOk(url)) { res.writeHead(403); res.end('forbidden'); return; }
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        const { user = '匿名', text = '' } = JSON.parse(body || '{}');
        const clean = String(text).slice(0, 2000).trim();
        if (!clean) { res.writeHead(200); res.end('{"ok":false}'); return; }
        const msg = { type: 'message', room, user: String(user).slice(0, 24), text: clean, ts: Date.now() };
        messages.push(msg);
        scheduleSave();
        if (messages.length > MAX_HISTORY) messages.shift();
        broadcast(room, msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400); res.end('{"ok":false}');
      }
    });
    return;
  }

  // 管理后台页面
  if (req.method === 'GET' && url.pathname === '/admin') {
    if (!ADMIN_PASS) { res.writeHead(403); res.end('后台未启用：请设置环境变量 ADMIN_PASS'); return; }
    serveFile(res, path.join(__dirname, 'public', 'admin.html'), 'text/html; charset=utf-8');
    return;
  }

  // 管理后台数据接口（密码走请求头 x-admin-pass）
  if (req.method === 'GET' && url.pathname === '/admin/data') {
    if (!adminOk(req)) { res.writeHead(403); res.end('forbidden'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(getStats()));
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`聊天服务已启动: http://localhost:${PORT}`);
  if (ROOM_KEY) console.log('已启用房间钥匙，访问需带 ?key=' + ROOM_KEY);
});
