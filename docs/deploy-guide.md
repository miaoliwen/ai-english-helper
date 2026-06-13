# AI 英语解题助手 — 服务器部署指南

> 适用场景：你有一台 Linux 服务器（VPS），希望部署完整的前后端服务。

---

## 前置要求

| 项目 | 要求 |
|------|------|
| 服务器 | Linux（推荐 Ubuntu 22.04+ / Debian 12+） |
| Docker | ≥ 24.0 |
| Docker Compose | ≥ 2.20（docker compose plugin） |
| 域名（可选） | 如有域名，提前做好 DNS 指向 |
| 网络 | 服务器能访问 OpenAI / DeepSeek 等 API |

---

## 第一步：安装 Docker

如果服务器上还没有 Docker，执行以下命令：

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | bash

# 验证安装
docker --version
docker compose version
```

---

## 第二步：获取代码

```bash
git clone <你的仓库地址> /opt/ai-english-helper
cd /opt/ai-english-helper
```

> 如果没有 Git，先安装：`apt install git -y`

---

## 第三步：运行部署脚本

```bash
bash deploy.sh
```

脚本会交互式询问以下配置：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `JWT_SECRET` | 用户登录令牌密钥 | 留空自动生成 |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | 留空自动生成 |
| `AI_CHAT_API_KEY` | 对话模型 API Key | `sk-xxxx` |
| `AI_CHAT_BASE_URL` | 对话模型 API 地址 | `https://api.deepseek.com` |
| `AI_VISION_API_KEY` | 视觉模型 API Key | `sk-xxxx` |
| `AI_VISION_BASE_URL` | 视觉模型 API 地址 | `https://api.openai.com` |
| 部署域名 | 用户访问的域名 | `example.com` |

> API Key 也可以在应用启动后，由用户在页面右上角的「设置」中自行填写，存在浏览器本地。不在服务端保存。

---

## 第四步：访问

部署成功后：

```
http://<服务器IP>
```

首次打开会看到注册页面，注册后即可使用。

---

## 常用操作

```bash
# 查看实时日志
docker compose logs -f

# 查看某个服务的日志
docker compose logs -f nginx
docker compose logs -f server

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新到最新版本
git pull
docker compose up -d --build
```

---

## 使用自定义域名

如果想让用户通过域名访问：

### 1. 配置反向代理（以 Nginx 为例）

在服务器上（Docker 外部）安装 Nginx，添加站点配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 申请 SSL 证书

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

### 3. 更新配置

重新运行 `bash deploy.sh`，域名填入 `https://your-domain.com`，或直接编辑 `server/.env`：

```diff
- CORS_ORIGIN=http://localhost
+ CORS_ORIGIN=https://your-domain.com
```

然后 `docker compose up -d --build` 重启。

---

## 数据备份

SQLite 数据库文件位于 `server/data/dev.db`，直接复制即可备份：

```bash
cp server/data/dev.db backup/$(date +%Y%m%d)-dev.db
```

建议设置 crontab 定期备份：

```bash
0 3 * * * cp /opt/ai-english-helper/server/data/dev.db /opt/backup/$(date +\%Y\%m\%d)-dev.db
```

---

## 常见问题

### 端口被占用

`docker compose.yml` 中 `nginx` 默认使用 80 端口。如果 80 已被占用，修改端口映射：

```yaml
ports:
  - "8080:80"   # 改为 8080
```

### 如何关闭注册

暂不支持，可在服务器端添加 IP 白名单或通过反向代理的 `auth_basic` 控制访问。

### 忘记密钥

停止服务，删除 `server/data/dev.db`，重启后重新注册。或通过 SQLite 工具手动操作。
