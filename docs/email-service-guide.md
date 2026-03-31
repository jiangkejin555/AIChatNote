# 邮件服务配置指南

本项目支持两种邮件发送方式：**SMTP**（支持 Gmail、QQ 邮箱等）和 **Resend**（云 API 服务）。代码中 Resend 优先于 SMTP，两者都启用时使用 Resend 发送。

## 目录

- [方案对比](#方案对比)
- [Gmail SMTP](#gmail-smtp)
- [QQ 邮箱 SMTP](#qq-邮箱-smtp)
- [Resend](#resend)
- [配置方式](#配置方式)
- [常见问题](#常见问题)

---

## 方案对比

| 特性 | Gmail SMTP | QQ 邮箱 SMTP | Resend |
|------|-----------|-------------|--------|
| 费用 | 免费 | 免费 | 免费 100 封/天 |
| 国内可用 | 需要翻墙 | 直接可用 | 需要翻墙 |
| 申请难度 | 简单 | 简单 | 简单 |
| 线上部署 | 不推荐（需翻墙） | 不推荐（端口可能被封） | 推荐 |
| 适用场景 | 本地开发 | 本地开发 | 生产环境 |

---

## Gmail SMTP

### 申请步骤

#### 1. 开启两步验证

Gmail 应用密码要求账号必须开启两步验证：

1. 访问 [Google 账号安全设置](https://myaccount.google.com/security)
2. 找到「两步验证」，按提示开启

#### 2. 生成应用密码

1. 访问 [Google 应用密码](https://myaccount.google.com/apppasswords)
2. 选择「邮件」和设备（或选择「其他」自定义名称，如 `AI Chat Note`）
3. 点击「生成」
4. 复制生成的 **16 位密码**（格式：`xxxx xxxx xxxx xxxx`，去掉空格使用）

#### 3. 配置参数

| 参数 | 值 |
|------|------|
| SMTP 服务器 | `smtp.gmail.com` |
| 端口 | `587` |
| 用户名 | 你的 Gmail 地址 |
| 密码 | 上一步生成的应用密码 |
| TLS | 开启 |

### 注意事项

- 应用密码不是 Gmail 登录密码
- **需要翻墙**才能连接 Gmail SMTP，线上服务器（如国内云服务）无法使用
- 每天发送上限约 500 封
- 适合本地开发调试

---

## QQ 邮箱 SMTP

### 申请步骤

#### 1. 登录 QQ 邮箱

访问 [QQ 邮箱](https://mail.qq.com/) 并登录。

#### 2. 开启 SMTP 服务

1. 点击顶部「设置」→「账户」
2. 找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务**
3. 点击 SMTP 服务旁边的「开启」
4. 按提示用手机发送短信验证
5. 验证成功后会显示一个 **16 位授权码**（只显示一次，务必保存）

#### 3. 配置参数

| 参数 | 值 |
|------|------|
| SMTP 服务器 | `smtp.qq.com` |
| 端口 | `587` |
| 用户名 | 你的 QQ 邮箱地址 |
| 密码 | 上一步获取的授权码（不是 QQ 密码） |
| TLS | 开启 |

### 注意事项

- 授权码不是 QQ 密码，是通过短信验证生成的专用密码
- 不需要翻墙，国内直连
- 适合本地开发调试
- 线上服务器部署时，部分云服务商可能封禁 587 端口

---

## Resend

### 简介

[Resend](https://resend.com) 是一个现代邮件 API 服务，通过 HTTPS 调用发送邮件，无需 SMTP 连接，适合云部署。

### 申请步骤

#### 1. 注册账号

访问 [Resend 官网](https://resend.com) 注册账号（支持 GitHub 登录）。

#### 2. 获取 API Key

1. 登录后进入 [Dashboard](https://resend.com/api-keys)
2. 点击「Create API Key」
3. 输入名称（如 `AI Chat Note`），选择权限（Full access）
4. 点击「Create」
5. 复制生成的 API Key（格式：`re_xxxxxxxxxx`）

#### 3. 配置发件人

**测试阶段**：无需额外配置，直接使用 Resend 提供的测试域名：

```
onboarding@resend.dev
```

**生产阶段**：需要验证自己的域名

1. 在 Resend Dashboard 中进入「Domains」
2. 点击「Add Domain」，输入你的域名（如 `yourdomain.com`）
3. Resend 会提供一组 DNS 记录（SPF、DKIM、DMARC）
4. 登录你的域名 DNS 管理面板，添加这些记录
5. 等待 DNS 生效（通常几分钟到几小时）
6. 验证通过后即可使用 `noreply@yourdomain.com` 等地址发送邮件

#### 4. 配置参数

| 参数 | 值 |
|------|------|
| API Key | `re_xxxxxxxxxx` |
| From（测试） | `onboarding@resend.dev` |
| From（生产） | `noreply@yourdomain.com`（需验证域名） |

### 注意事项

- 免费额度：100 封/天
- 测试域名 `resend.dev` 只能发送给已添加的收件人
- **需要翻墙**才能访问 Resend API（`api.resend.com`）
- 适合部署在海外服务器（Vercel、Railway 等）

---

## 配置方式

所有邮件相关配置支持两种方式，**环境变量优先于 config.yaml**。

### 方式一：config.yaml

```yaml
# SMTP 配置（以 QQ 邮箱为例）
smtp:
  host: "smtp.qq.com"
  port: 587
  username: "your-email@qq.com"
  password: "your-authorization-code"
  from: "your-email@qq.com"
  from_name: "AI Chat Note"
  use_tls: true
  enabled: true

# Resend 配置
resend:
  api_key: "re_xxxxxxxxxx"
  from: "onboarding@resend.dev"
  from_name: "AI Chat Note"
  enabled: false
```

### 方式二：环境变量

```bash
# SMTP
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USERNAME=your-email@qq.com
SMTP_PASSWORD=your-authorization-code
SMTP_FROM=your-email@qq.com
SMTP_FROM_NAME=AI Chat Note
SMTP_USE_TLS=true
SMTP_ENABLED=true

# Resend
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM=onboarding@resend.dev
RESEND_FROM_NAME=AI Chat Note
RESEND_ENABLED=false
```

### 启用优先级

代码逻辑（`email.go`）：

1. 如果 Resend 已启用（`enabled=true` + `api_key` 非空 + `from` 非空），使用 Resend
2. 否则如果 SMTP 已启用（`enabled=true` + `host` + `username` + `password` 非空），使用 SMTP
3. 两者都未启用时，邮件功能不可用

### 推荐配置

**本地开发**：使用 QQ 邮箱 SMTP（无需翻墙）

**线上部署（海外服务器）**：使用 Resend

**线上部署（国内服务器）**：使用 QQ 邮箱 SMTP 或其他国内邮件服务

---

## 常见问题

### Q1: Gmail SMTP 连接超时怎么办？

Gmail 服务器在国内无法直连，需要：
- 本地开发：开启 VPN
- 线上部署：换用 QQ 邮箱 SMTP 或 Resend（海外服务器）

### Q2: QQ 邮箱发送失败，提示认证错误？

确认使用的是**授权码**而非 QQ 密码。授权码获取方式：QQ 邮箱 → 设置 → 账户 → 开启 SMTP 服务 → 短信验证后获取。

### Q3: Resend 测试邮件收不到？

`onboarding@resend.dev` 域名只能发送给 Resend Dashboard 中已添加的收件人邮箱。需要在 Resend 后台先添加收件人。

### Q4: 如何只启用其中一种？

将不需要的方式设为 `enabled: false` 或不配置即可。只启用 SMTP：`SMTP_ENABLED=true`，`RESEND_ENABLED=false`。

### Q5: 线上部署用哪种方案最好？

推荐 **Resend**，原因：
- 通过 HTTPS API 调用，无需开放 SMTP 端口
- 海外云平台（Vercel、Railway）原生支持
- 配置简单，只需一个 API Key
