FROM node:18-slim

WORKDIR /app

# 复制依赖描述与源码（项目零依赖，跳过 npm install）
COPY package.json ./
COPY server.js ./
COPY public ./public

# Hugging Face Spaces 会把 PORT 环境变量设为 7860，server.js 已读取该变量
EXPOSE 7860

CMD ["node", "server.js"]
