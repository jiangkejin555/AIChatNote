# AI Chat Note 部署指南

## 📋 目录

- [项目技术栈概览](#项目技术栈概览)
- [核心依赖服务清单](#核心依赖服务清单)
- [部署方案全面对比](#部署方案全面对比)
- [成本对比表](#成本对比表)
- [阿里云成本详细分析](#阿里云成本详细分析)
- [推荐方案](#推荐方案)
- [快速部署步骤](#快速部署步骤)
- [上线前检查清单](#上线前检查清单)

---

## 项目技术栈概览

### 前端 (Frontend)
- **框架**: Next.js 16.2.0 (React 19.2.4)
- **UI**: Tailwind CSS 4 + shadcn/ui 组件库
- **状态管理**: Zustand 5.0.12
- **数据请求**: TanStack Query 5.91.3 + Axios
- **编辑器**: TipTap (富文本编辑器)
- **国际化**: next-intl 4.8.3

### 后端 (Backend)
- **语言**: Go 1.21
- **Web框架**: Gin 1.9.1
- **数据库**: PostgreSQL (GORM ORM)
- **认证**: JWT (golang-jwt/jwt)
- **AI集成**: go-openai (支持 OpenAI 兼容 API)

---

## 核心依赖服务清单

### 1. 数据库服务
- **PostgreSQL 15** - 主数据库
- **持久化存储**: 用户数据、对话、笔记、配置等

### 2. AI 服务提供商 (必需)
应用需要至少配置一个 AI Provider 才能正常工作：
- **OpenAI** / **DeepSeek** / **Claude** / **Gemini** 等
- 支持所有 OpenAI 兼容 API 格式的模型
- 用于：对话生成、标题生成、笔记总结

### 3. 邮件服务 (可选，用于邮箱验证)
- **SMTP 服务器** (配置文件中已配置 Gmail SMTP)
- 用于：用户注册验证、密码重置

### 4. OAuth 服务 (可选)
支持第三方登录：
- **Google OAuth**
- **GitHub OAuth**
- **QQ OAuth**

### 5. Notion 集成 (可选)
- **Notion API** - 用于同步笔记到 Notion

---

## 部署方案全面对比

### 方案一：全托管云平台（最简单）

#### **Railway.app** ⭐⭐⭐⭐⭐ 推荐
- **前端**: 免费部署 Next.js（500小时/月）
- **后端**: $5/月起（Go 应用）
- **数据库**: PostgreSQL $5/月（1GB存储）
- **总成本**: **$5-10/月**
- **优点**:
  - 一键部署，自动 CI/CD
  - 自动 HTTPS 域名
  - 内置数据库管理
  - 支持环境变量配置
- **缺点**: 免费额度有限，流量大需升级

#### **Render.com** ⭐⭐⭐⭐
- **前端**: 免费
- **后端**: $7/月
- **数据库**: PostgreSQL 免费（90天试用）后 $7/月
- **总成本**: **$0-14/月**
- **优点**: 免费SSL，自动部署
- **缺点**: 免费数据库有期限

#### **Fly.io** ⭐⭐⭐⭐
- **前端+后端**: $3-5/月
- **数据库**: PostgreSQL $7/月
- **总成本**: **$10-12/月**
- **优点**: 全球 CDN，性能好
- **缺点**: 配置稍复杂

---

### 方案二：Vercel + 云数据库（推荐前端开发者）

#### **Vercel + Supabase/Railway** ⭐⭐⭐⭐⭐ 最推荐
- **前端**: 免费
- **后端**: Railway $5/月 或 Fly.io $3/月
- **数据库**: Supabase 免费（500MB）或 Railway $5/月
- **总成本**: **$0-10/月**
- **优点**:
  - 前端部署最简单（Git push 自动部署）
  - Supabase 提供免费 PostgreSQL + 管理界面
  - 全球 CDN 加速
- **缺点**: 需要两个平台管理

---

### 方案三：云服务器 VPS（最灵活）

#### **国内云服务商**

**阿里云/腾讯云轻量应用服务器**
- **配置**: 2核4G
- **成本**: **¥60-100/月**（$8-14）
- **优点**:
  - 国内访问快
  - 完全控制
  - 可部署多个应用
- **缺点**:
  - 需要备案（15-20天）
  - 需要运维知识
  - 需要手动配置 HTTPS

**华为云/百度云**
- **成本**: **¥50-80/月**
- 类似优缺点

#### **海外 VPS**

**DigitalOcean**
- **配置**: 2核2G
- **成本**: **$12/月**
- **优点**: 简单易用，文档丰富
- **缺点**: 国内访问可能较慢

**Vultr**
- **配置**: 2核4G
- **成本**: **$10/月**
- **优点**: 多地机房，可选东京/新加坡

**Linode/Akamai**
- **配置**: 2核4G
- **成本**: **$10/月**

---

### 方案五：阿里云详细部署方案（国内用户推荐）

阿里云提供多种部署方案，适合不同规模和需求的应用。

#### **5.1 轻量应用服务器（最推荐个人开发者）**

**适合场景**: 个人项目、小型应用、快速上线

##### 配置推荐
```
入门配置：
- CPU: 2核
- 内存: 2GB
- 存储: 60GB SSD
- 带宽: 3Mbps
- 流量: 不限

价格: ¥60-80/月（$8-11）
```

```
推荐配置：
- CPU: 2核
- 内存: 4GB
- 存储: 80GB SSD
- 带宽: 5Mbps
- 流量: 不限

价格: ¥100-120/月（$14-17）
```

##### 优点
- ✅ 价格便宜
- ✅ 国内访问快
- ✅ 操作简单
- ✅ 自带面板
- ✅ 一键安装环境

##### 缺点
- ❌ 需要备案（15-20天）
- ❌ 需要自己运维
- ❌ 扩展性有限

---

#### **5.2 ECS 云服务器（最灵活）**

**适合场景**: 中大型应用、需要灵活配置

##### 配置推荐
```
入门配置：
- 实例: ecs.t6-c1m2.large
- CPU: 2核
- 内存: 2GB
- 存储: 40GB ESSD
- 带宽: 按流量计费

价格: ¥80-150/月
```

```
推荐配置：
- 实例: ecs.c6.large
- CPU: 2核
- 内存: 4GB
- 存储: 100GB ESSD
- 带宽: 5Mbps

价格: ¥200-300/月
```

##### 优点
- ✅ 配置灵活
- ✅ 性能强大
- ✅ 扩展性好
- ✅ 企业级服务

##### 缺点
- ❌ 价格较高
- ❌ 需要运维知识
- ❌ 配置复杂

---

#### **5.3 容器服务 ACK（最现代）**

**适合场景**: 微服务架构、容器化应用

##### 配置推荐
```
托管集群：
- 节点: 2台 ecs.c6.large
- CPU: 2核×2
- 内存: 4GB×2
- 存储: 100GB×2

价格: ¥400-600/月
```

##### 优点
- ✅ 容器化部署
- ✅ 自动扩容
- ✅ 高可用性

##### 缺点
- ❌ 成本高
- ❌ 复杂度高
- ❌ 需要专业知识

---

#### **5.4 函数计算 FC + RDS（最省钱）**

**适合场景**: 流量不稳定、按需付费

##### 配置推荐
```
函数计算：
- 内存: 512MB
- 执行时间: 按实际使用
- 调用次数: 按实际使用

RDS PostgreSQL：
- 规格: 1核2GB
- 存储: 20GB

价格: ¥50-100/月
```

##### 优点
- ✅ 按需付费
- ✅ 自动扩容
- ✅ 免运维

##### 缺点
- ❌ 冷启动延迟
- ❌ 有状态应用不适用
- ❌ 配置复杂

---

### 方案四：Serverless（最省钱但复杂）

#### **阿里云函数计算 + RDS**
- **函数计算**: 按调用次数计费（免费额度大）
- **数据库**: RDS PostgreSQL ¥50/月
- **总成本**: **¥50-80/月**
- **优点**: 按需付费，省钱
- **缺点**: 配置复杂，冷启动延迟

---

## 成本对比表

| 方案 | 月成本 | 部署难度 | 性能 | 国内访问 | 推荐度 |
|------|--------|----------|------|----------|--------|
| **Vercel + Railway** | **$5-10** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Railway 全托管 | $5-10 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Render | $0-14 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **阿里云轻量服务器** | **¥112-187** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **阿里云 ECS + RDS** | **¥328-421** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 国内 VPS | ¥60-100 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 海外 VPS | $10-12 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 阿里云成本详细分析

### 方案 A：轻量应用服务器（最经济）

| 项目 | 配置 | 月费用 | 年费用 |
|------|------|--------|--------|
| **轻量服务器** | 2核4G，80GB，5Mbps | ¥112 | ¥1,200 |
| **域名** | .com 域名 | ¥55 | ¥55 |
| **SSL证书** | 免费证书 | ¥0 | ¥0 |
| **对象存储 OSS** | 10GB（可选） | ¥2 | ¥24 |
| **CDN** | 100GB流量（可选） | ¥18 | ¥216 |
| **总计** | - | **¥187** | **¥1,495** |

**实际成本**: ¥112-187/月（$15-26）

---

### 方案 B：ECS + RDS（最稳定）

| 项目 | 配置 | 月费用 | 年费用 |
|------|------|--------|--------|
| **ECS服务器** | 2核4G，100GB | ¥248 | ¥2,976 |
| **RDS PostgreSQL** | 1核2G，20GB | ¥80 | ¥960 |
| **域名** | .com 域名 | ¥55 | ¥55 |
| **SSL证书** | 免费证书 | ¥0 | ¥0 |
| **负载均衡 SLB** | 按量付费（可选） | ¥20 | ¥240 |
| **CDN** | 100GB流量（可选） | ¥18 | ¥216 |
| **总计** | - | **¥421** | **¥4,447** |

**实际成本**: ¥328-421/月（$45-58）

---

### 方案 C：ACK 容器服务（最专业）

| 项目 | 配置 | 月费用 | 年费用 |
|------|------|--------|--------|
| **ACK集群** | 托管集群 | ¥0 | ¥0 |
| **ECS节点** | 2台 2核4G | ¥496 | ¥5,952 |
| **RDS PostgreSQL** | 2核4G，50GB | ¥200 | ¥2,400 |
| **SLB负载均衡** | 按量付费 | ¥30 | ¥360 |
| **域名+SSL** | - | ¥55 | ¥55 |
| **CDN** | 200GB流量 | ¥36 | ¥432 |
| **总计** | - | **¥817** | **¥9,199** |

**实际成本**: ¥817/月（$113）

---

## 推荐方案

### 🏆 最优方案：Vercel + Railway

#### 为什么最推荐？
1. **成本最低**: $5-10/月（甚至可以 $0 启动）
2. **部署最简单**: Git push 自动部署
3. **免运维**: 不需要管理服务器
4. **自动 HTTPS**: 免费SSL证书
5. **全球CDN**: 访问速度快
6. **无需备案**: 使用海外服务

#### 为什么前端选择 Vercel 而不是统一部署到 Railway？

Vercel 是 Next.js 的创建公司，对 Next.js 有其他平台无法复制的专属优化能力：

**1. 自动 SSR（Server-Side Rendering，服务端渲染）**
用户请求页面时，Vercel 在服务器上实时生成完整 HTML 再返回给浏览器。普通部署的流程是：浏览器收到空 HTML → 下载 JS → 执行 JS → 请求数据 → 渲染页面，白屏时间长。Vercel SSR 直接返回带数据的完整 HTML，用户立刻看到内容，然后 JS 接管交互。
- 对本项目的意义：用户打开笔记列表页时直接看到渲染好的笔记内容，不会出现空白闪烁。

**2. 自动 ISR（Incremental Static Regeneration，增量静态再生）**
页面预先生成静态 HTML 缓存在 CDN，当数据更新后后台自动重新生成，不用全站重新构建。传统静态站改一条数据需要整站 `npm run build`，耗时数分钟；ISR 只需设置 `revalidate: 60`，60秒后有人访问就自动在后台重新生成该页面，用户始终拿到缓存的快速版本。
- 对本项目的意义：笔记页面可以被缓存为静态页面（毫秒级响应），数据变更后自动更新，不用每次请求都跑一遍服务端逻辑。

**3. 自动图片优化**
Vercel 自动处理 Next.js `<Image>` 组件的图片：自动转 WebP/AVIF 格式（体积减少 30-50%）；根据用户设备返回合适分辨率（手机不会下载桌面版大图）；自动懒加载和 CDN 缓存，优化后的图片只处理一次。
- 对本项目的意义：用户头像、笔记中的图片等自动压缩到最优格式和尺寸，加载速度翻倍。

> **总结**：这些优化在其他平台技术上可以自己配置（Nginx + CDN + 图片处理服务），但需要大量手动运维。Vercel 是零配置自动完成，这是它作为 Next.js 创始公司的核心壁垒。

#### 总成本明细：
- **Railway 数据库**: $5/月（1GB）
- **Railway 后端**: $5/月（或免费额度内）
- **Vercel 前端**: 免费
- **总计**: **$5-10/月**

---

### 💰 0成本启动方案：Render + Supabase

#### 使用免费额度组合：
- **前端**: Render 免费
- **后端**: Render 免费（750小时/月）
- **数据库**: Supabase 免费（500MB）
- **总成本**: **$0/月**

#### 限制说明：
- Render 免费版会休眠（15分钟无访问）
- Supabase 500MB 存储限制
- 适合个人使用和初期验证

---

## 快速部署步骤

### 方案一：Railway + Vercel 部署（推荐）

#### 第一步：部署数据库和后端到 Railway

1. **注册 Railway 账号**
   - 访问 [railway.app](https://railway.app)
   - 使用 GitHub 账号登录

2. **创建 PostgreSQL 数据库**
   ```bash
   # 在 Railway Dashboard 中：
   # New Project -> Provision PostgreSQL
   ```

3. **部署后端服务**
   ```bash
   # 方式一：通过 Dashboard
   # New Project -> Deploy from GitHub repo -> 选择 backend 目录

   # 方式二：使用 CLI
   npm install -g @railway/cli
   railway login

   cd backend
   railway init
   railway up
   ```

4. **配置后端环境变量**
   ```bash
   # 在 Railway Dashboard 中设置环境变量：
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secret-key-at-least-32-characters-long
   JWT_REFRESH_SECRET=your-refresh-token-secret-key
   ENCRYPTION_KEY=your-32-byte-encryption-key-here
   FRONTEND_URL=https://your-app.vercel.app
   GIN_MODE=release

   # 可选配置
   TITLE_GENERATOR_API_KEY=your-api-key
   TITLE_GENERATOR_API_BASE=https://api.deepseek.com
   TITLE_GENERATOR_MODEL=deepseek-chat
   ```

   ```
   # 密钥生成方式
   # JWT Secret
   openssl rand -base64 48

   # JWT Refresh Secret
   openssl rand -base64 48

   # Encryption Key (必须恰好 32 字节)
   openssl rand -base64 32 | head -c 32
   ```
5. **获取后端地址**
   - Railway 会自动分配域名，例如：`https://ai-chat-note-backend.railway.app`

#### 第二步：部署前端到 Vercel

1. **注册 Vercel 账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   ```bash
   # 方式一：通过 Dashboard
   # New Project -> Import Git Repository -> 选择 frontend 目录

   # 方式二：使用 CLI
   npm install -g vercel
   vercel login

   cd frontend
   vercel
   ```

3. **配置环境变量**
   ```bash
   # 在 Vercel Dashboard 中设置：
   NEXT_PUBLIC_API_URL=https://aichatnode-production.up.railway.app/api
   ```

4. **部署**
   ```bash
   # 生产环境部署
   vercel --prod
   ```

5. **获取前端地址**
   - Vercel 会自动分配域名，例如：`https://ai-chat-note.vercel.app`

#### 第三步：更新后端 CORS 配置

```bash
# 在 Railway 后端环境变量中更新：
FRONTEND_URL=https://ai-chat-note.vercel.app

# Railway 会自动重启服务
```

#### 第四步：配置 AI Provider

用户可以在前端界面的"模型管理"中配置 AI Provider：
- Provider 名称（如：DeepSeek、OpenAI）
- API Base URL
- API Key
- 模型名称

---

### 方案二：Render + Supabase 部署（0成本）

#### 第一步：创建 Supabase 数据库

1. **注册 Supabase 账号**
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目

2. **获取数据库连接信息**
   ```bash
   # 在 Project Settings -> Database 中找到：
   # Connection string (URI)
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

#### 第二步：部署后端到 Render

1. **注册 Render 账号**
   - 访问 [render.com](https://render.com)

2. **创建 Web Service**
   ```bash
   # New -> Web Service
   # 连接 GitHub 仓库
   # 选择 backend 目录

   # 配置：
   Name: ai-chat-note-backend
   Environment: Docker
   Region: Oregon (US West) 或 Singapore
   Branch: main
   ```

3. **设置环境变量**
   ```bash
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
   JWT_SECRET=your-secret-key
   ENCRYPTION_KEY=your-32-byte-encryption-key
   FRONTEND_URL=https://your-frontend.onrender.com
   ```

#### 第三步：部署前端到 Render

1. **创建 Static Site**
   ```bash
   # New -> Static Site
   # 选择 frontend 目录

   # 构建配置：
   Build Command: npm run build
   Publish Directory: .next
   ```

2. **设置环境变量**
   ```bash
   NEXT_PUBLIC_API_URL=https://ai-chat-note-backend.onrender.com
   ```

---

### 方案四：阿里云轻量服务器部署（国内用户推荐）

#### 第一步：购买服务器

1. **登录阿里云控制台**
   ```
   https://www.aliyun.com
   ```

2. **购买轻量应用服务器**
   ```
   产品 -> 轻量应用服务器
   地域: 华东/华北/华南（选离用户近的）
   镜像: Ubuntu 22.04 或 CentOS 8
   套餐: 2核4GB
   时长: 1年（更优惠）
   ```

3. **费用**
   ```
   2核4GB: ¥112/月
   年付优惠: ¥1,200/年（约 ¥100/月）
   ```

#### 第二步：配置服务器环境

1. **SSH 连接服务器**
   ```bash
   ssh root@your-server-ip
   
   # 或使用阿里云控制台的远程连接
   ```

2. **安装 Docker**
   ```bash
   # Ubuntu
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   
   # 启动 Docker
   systemctl start docker
   systemctl enable docker
   ```

3. **安装 Docker Compose**
   ```bash
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

4. **安装 Nginx**
   ```bash
   apt update
   apt install nginx -y
   systemctl start nginx
   systemctl enable nginx
   ```

#### 第三步：部署数据库

**选项 A：Docker 部署 PostgreSQL**
```bash
# 创建数据目录
mkdir -p /data/postgres

# 启动 PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=chat_note \
  -v /data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

**选项 B：购买 RDS PostgreSQL**
```bash
# 在阿里云控制台购买
# 产品 -> 云数据库 RDS -> PostgreSQL
# 规格: 1核2GB
# 存储: 20GB
# 费用: ¥80/月
```

#### 第四步：部署后端

1. **上传代码**
   ```bash
   # 方式一：Git clone
   git clone https://github.com/your-repo/ai-chat-note.git
   cd ai-chat-note/backend
   
   # 方式二：SCP 上传
   scp -r backend/ root@your-server-ip:/root/
   ```

2. **配置环境变量**
   ```bash
   cd /root/ai-chat-note/backend
   cp config.yaml config.prod.yaml
   
   # 编辑配置
   vim config.prod.yaml
   ```

   修改关键配置：
   ```yaml
   server:
     port: "8080"
     gin_mode: "release"
   
   database:
     host: localhost  # 或 RDS 地址
     port: 5432
     user: postgres
     password: your-strong-password
     dbname: chat_note
   
   jwt:
     secret: "your-very-strong-jwt-secret-at-least-32-characters"
     refresh_secret: "your-refresh-token-secret-key"
   
   encryption:
     key: "your-32-byte-encryption-key-here"
   
   cors:
     frontend_url: "https://your-domain.com"
   ```

3. **构建和启动**
   ```bash
   # 使用 Docker Compose
   docker-compose up -d
   
   # 或手动构建
   docker build -t chat-note-backend .
   docker run -d \
     --name backend \
     -p 8080:8080 \
     -v $(pwd)/config.prod.yaml:/app/config.yaml \
     chat-note-backend
   ```

#### 第五步：部署前端

1. **构建前端**
   ```bash
   cd /root/ai-chat-note/frontend
   
   # 安装依赖
   npm install
   
   # 配置环境变量
   export NEXT_PUBLIC_API_URL=https://your-domain.com/api
   
   # 构建
   npm run build
   ```

2. **使用 PM2 运行**
   ```bash
   npm install -g pm2
   pm2 start npm --name "frontend" -- start
   pm2 save
   pm2 startup
   ```

3. **或使用 Docker**
   ```bash
   # Dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY . .
   RUN npm install && npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   
   # 构建运行
   docker build -t chat-note-frontend .
   docker run -d -p 3000:3000 chat-note-frontend
   ```

#### 第六步：配置 Nginx

1. **创建 Nginx 配置**
   ```bash
   vim /etc/nginx/sites-available/ai-chat-note
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # 后端 API
       location /api {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           
           # 流式响应支持
           proxy_buffering off;
           proxy_cache off;
       }
   }
   ```

2. **启用配置**
   ```bash
   ln -s /etc/nginx/sites-available/ai-chat-note /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

#### 第七步：域名和备案

1. **购买域名**
   ```
   阿里云 -> 域名注册
   .com: ¥55/年
   .cn: ¥29/年
   ```

2. **域名解析**
   ```
   域名控制台 -> 解析设置
   添加记录:
   - 记录类型: A
   - 主机记录: @
   - 记录值: 服务器IP
   ```

3. **网站备案**（必须）
   ```
   阿里云 ICP 代备案管理系统
   流程:
   1. 提交备案申请（3-5天）
   2. 上传资料（身份证、人脸识别）
   3. 等待审核（10-20天）
   4. 备案成功
   
   费用: 免费
   时间: 15-20天
   ```

#### 第八步：配置 HTTPS

1. **申请免费 SSL 证书**
   ```
   阿里云 -> SSL证书 -> 免费证书
   品牌: DigiCert
   有效期: 1年
   费用: 免费
   ```

2. **配置 Nginx**
   ```bash
   # 下载证书文件
   # 上传到服务器
   mkdir -p /etc/nginx/ssl
   upload your-domain.pem /etc/nginx/ssl/
   upload your-domain.key /etc/nginx/ssl/
   
   # 更新 Nginx 配置
   vim /etc/nginx/sites-available/ai-chat-note
   ```

   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/your-domain.pem;
       ssl_certificate_key /etc/nginx/ssl/your-domain.key;
       
       # SSL 优化
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       # ... 其他配置同上
   }
   
   # HTTP 重定向到 HTTPS
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **重启 Nginx**
   ```bash
   nginx -t
   systemctl reload nginx
   ```

#### 第九步：优化和安全加固

1. **性能优化**

   **启用 Gzip 压缩**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml;
   gzip_min_length 1000;
   ```

   **配置缓存**
   ```nginx
   location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
       expires 30d;
       add_header Cache-Control "public, immutable";
   }
   ```

   **启用 HTTP/2**
   ```nginx
   listen 443 ssl http2;
   ```

2. **安全加固**

   **防火墙配置**
   ```bash
   # 安装 ufw
   apt install ufw

   # 开放端口
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS

   # 启用防火墙
   ufw enable
   ```

   **禁用 root 登录**
   ```bash
   # 创建新用户
   adduser deploy
   usermod -aG sudo deploy

   # 修改 SSH 配置
   vim /etc/ssh/sshd_config
   PermitRootLogin no

   # 重启 SSH
   systemctl reload sshd
   ```

3. **定期备份**

   **数据库备份脚本**
   ```bash
   vim /root/backup.sh
   ```

   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   BACKUP_DIR="/data/backup"
   mkdir -p $BACKUP_DIR

   # 备份数据库
   docker exec postgres pg_dump -U postgres chat_note > $BACKUP_DIR/db_$DATE.sql

   # 备份上传文件
   tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /data/uploads

   # 删除7天前的备份
   find $BACKUP_DIR -type f -mtime +7 -delete

   # 上传到 OSS（可选）
   # aliyun oss cp $BACKUP_DIR oss://your-bucket/backups/
   ```

   **定时任务**
   ```bash
   crontab -e
   0 2 * * * /root/backup.sh
   ```

---

### 方案五：Docker Compose 部署（VPS）

#### 适用于：阿里云/腾讯云/DigitalOcean 等 VPS

1. **安装 Docker 和 Docker Compose**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **修改配置文件**
   ```bash
   cd backend
   cp config.yaml config.prod.yaml

   # 修改关键配置：
   # - 数据库密码
   # - JWT 密钥
   # - 加密密钥
   # - CORS 前端地址
   ```

3. **构建和启动**
   ```bash
   # 构建镜像
   make docker-build

   # 启动服务
   docker-compose up -d

   # 查看日志
   docker-compose logs -f
   ```

4. **配置 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

5. **配置 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 必需环境变量配置清单

### 后端环境变量

#### 必需配置
```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@host:port/dbname

# JWT 配置（生产环境必须修改）
JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-key

# 加密密钥（必须32字节）
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# CORS 配置
FRONTEND_URL=https://your-frontend-domain.com

# 运行模式
GIN_MODE=release
```

#### 可选配置
```bash
# 标题生成器配置
TITLE_GENERATOR_API_KEY=your-api-key
TITLE_GENERATOR_API_BASE=https://api.deepseek.com
TITLE_GENERATOR_MODEL=deepseek-chat

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_ENABLED=true

# OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Notion 集成
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
```

### 前端环境变量

```bash
# 后端 API 地址
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## 上线前检查清单

### 必需项
- [ ] 修改所有默认密码和密钥
- [ ] 配置至少一个 AI Provider（可在界面配置）
- [ ] 设置正确的 CORS 域名
- [ ] 数据库持久化存储配置
- [ ] HTTPS 证书配置（生产环境）

### 推荐项
- [ ] 配置邮件服务（用户验证）
- [ ] 设置数据库备份策略
- [ ] 配置日志收集
- [ ] 设置监控告警
- [ ] 配置 CDN 加速静态资源

### 安全检查
- [ ] JWT 密钥足够复杂（至少32字符）
- [ ] 加密密钥保密且为32字节
- [ ] 数据库密码强度足够
- [ ] 生产环境关闭 DEBUG 模式
- [ ] 配置速率限制（防止滥用）

---

## 常见问题

### Q1: Railway 免费额度用完怎么办？
**A**: 可以升级到付费计划（$5/月起），或迁移到其他平台。Railway 按使用量计费，个人使用一般不会超过 $10/月。

### Q2: 如何绑定自定义域名？
**A**:
- **Vercel**: Project Settings -> Domains -> Add Domain
- **Railway**: Settings -> Domains -> Custom Domain
- 需要在域名服务商配置 DNS 解析

### Q3: 数据库如何备份？
**A**:
- **Railway**: 自动备份，可在 Dashboard 查看
- **Supabase**: 提供自动备份功能
- **自建**: 使用 `pg_dump` 定期备份

### Q4: 如何监控应用状态？
**A**:
- **Railway/Vercel**: 内置监控 Dashboard
- **自建**: 使用 Prometheus + Grafana
- **日志**: 配置日志收集服务

### Q5: 国内访问速度慢怎么办？
**A**:
- 使用国内云服务商（需备案）
- 配置 CDN 加速
- 使用多地域部署

### Q6: 阿里云和 Railway 如何选择？
**A**: 参考以下对比：

| 对比项 | 阿里云（轻量） | Railway |
|--------|---------------|---------|
| **月成本** | ¥112-187 ($15-26) | $5-10 |
| **部署难度** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **运维成本** | 高（需自己管理） | 低（免运维） |
| **国内访问** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **备案要求** | 需要（15-20天） | 不需要 |
| **数据安全** | 完全控制 | 依赖平台 |
| **扩展性** | 灵活 | 有限 |
| **技术支持** | 企业级 | 社区 |

**选择建议**：
- **选择阿里云**：主要用户在国内、需要完全控制数据、有运维能力、可以等待备案
- **选择 Railway**：快速验证产品、国际用户为主、不想管理服务器、预算有限

### Q7: 阿里云备案流程需要多久？
**A**:
- 提交备案申请：3-5天
- 上传资料审核：1-3天
- 管局审核：10-15天
- 总计：15-20天
- 费用：免费

### Q8: 如何选择阿里云服务器地域？
**A**:
- **华东（杭州/上海）**：适合华东地区用户
- **华北（北京）**：适合华北地区用户
- **华南（深圳/广州）**：适合华南地区用户
- **香港**：无需备案，但成本较高
- 建议：选择离主要用户群体最近的地域

---

## 技术支持

- **项目文档**: `/docs` 目录
- **API 文档**: `/docs/api.yaml`
- **设计文档**: `/docs/design.md`
- **GitHub Issues**: 提交问题和建议

---

## 更新日志

- 2026-03-29: 初版发布，包含完整部署方案对比
- 2026-03-29: 新增阿里云详细部署方案，包含轻量服务器、ECS、ACK、函数计算等多种方案
- 2026-03-29: 补充阿里云成本详细分析和完整部署步骤
