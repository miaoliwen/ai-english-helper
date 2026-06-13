#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# AI 英语解题助手 — Docker 一键部署脚本
# 用法: bash deploy.sh
# ──────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ── 前置检查 ──
command -v docker &>/dev/null || { err "请先安装 Docker: https://docs.docker.com/engine/install/"; exit 1; }
docker compose version &>/dev/null || { err "请安装 Docker Compose (docker compose plugin)"; exit 1; }

# ── 配置生成 ──
ENV_FILE="server/.env"
if [ -f "$ENV_FILE" ]; then
  warn "检测到已有 $ENV_FILE，跳过配置生成"
  warn "如需重新配置，请删除 $ENV_FILE 后重试"
else
  echo ""
  echo -e "${CYAN}══════════════════════════════════════${NC}"
  echo -e "${CYAN}  首次部署 — 填写以下配置项${NC}"
  echo -e "${CYAN}══════════════════════════════════════${NC}"
  echo ""

  cp server/.env.production "$ENV_FILE"

  read -rp "JWT_SECRET（留空自动生成）: " jwt_in
  if [ -z "$jwt_in" ]; then
    jwt_in=$(openssl rand -base64 32 2>/dev/null || uuidgen 2>/dev/null || echo "auto-generated-secret-change-me")
  fi
  read -rp "JWT_REFRESH_SECRET（留空自动生成）: " jwt_ref_in
  if [ -z "$jwt_ref_in" ]; then
    jwt_ref_in=$(openssl rand -base64 32 2>/dev/null || uuidgen 2>/dev/null || echo "auto-generated-secret-change-me")
  fi
  read -rp "AI_CHAT_API_KEY: " chat_key
  read -rp "AI_CHAT_BASE_URL [https://api.deepseek.com]: " chat_url
  chat_url=${chat_url:-https://api.deepseek.com}
  read -rp "AI_VISION_API_KEY: " vision_key
  read -rp "AI_VISION_BASE_URL [https://api.openai.com]: " vision_url
  vision_url=${vision_url:-https://api.openai.com}
  read -rp "部署域名（留空 = http://localhost）: " domain
  cors_origin=${domain:-http://localhost}

  # 写入 .env
  cat > "$ENV_FILE" <<ENVEOF
DATABASE_URL="file:/app/data/dev.db"
JWT_SECRET="${jwt_in}"
JWT_REFRESH_SECRET="${jwt_ref_in}"
PORT=3001
CORS_ORIGIN=${cors_origin}
AI_CHAT_API_KEY=${chat_key}
AI_CHAT_BASE_URL=${chat_url}
AI_VISION_API_KEY=${vision_key}
AI_VISION_BASE_URL=${vision_url}
ENVEOF

  ok "配置已写入 $ENV_FILE"
fi

# ── 目录准备 ──
mkdir -p server/data

# ── 构建并启动 ──
echo ""
info "正在构建并启动 Docker 容器..."
echo ""

docker compose up -d --build

echo ""
if docker compose ps --status running --services | grep -q .; then
  ok "部署成功！"
  echo ""
  echo -e "${GREEN}  访问地址: http://localhost${NC}"
  echo ""
  echo -e "  查看日志: ${CYAN}docker compose logs -f${NC}"
  echo -e "  停止服务: ${CYAN}docker compose down${NC}"
  echo -e "  更新服务: ${CYAN}git pull && docker compose up -d --build${NC}"
else
  err "服务启动失败，查看日志: docker compose logs"
  exit 1
fi
