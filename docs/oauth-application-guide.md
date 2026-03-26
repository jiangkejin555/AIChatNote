# OAuth 提供商申请指南

本文档详细说明如何申请各大 OAuth 提供商的 Client ID 和 Client Secret。

## 目录

- [概述](#概述)
- [Google OAuth](#google-oauth)
- [GitHub OAuth](#github-oauth)
- [QQ OAuth](#qq-oauth)
- [申请前准备](#申请前准备)
- [推荐申请顺序](#推荐申请顺序)
- [常见问题](#常见问题)

---

## 概述

### 是否需要付费？
**完全免费**。所有 OAuth 提供商都不收取任何费用。

### 申请需要多长时间？
- **Google**：即时获取（未验证应用）
- **GitHub**：即时获取
- **QQ**：1-3 个工作日审核

### 是否需要企业资质？
- **Google**：个人即可申请
- **GitHub**：个人即可申请
- **QQ**：个人或企业均可

---

## Google OAuth

### 申请地址
[Google Cloud Console](https://console.cloud.google.com/)

### 申请步骤

#### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部导航栏的项目选择器
3. 点击 "新建项目"
4. 输入项目名称（如：`AI Chat Note`）
5. 点击 "创建"

#### 2. 配置 OAuth 同意屏幕

1. 在左侧菜单中，选择 **"API 和服务" → "OAuth 同意屏幕"**
2. 选择用户类型：
   - **外部**：任何 Google 账号都可以登录（推荐）
   - **内部**：仅限组织内部用户
3. 点击 "创建"

4. **填写应用信息**：
   - **应用名称**：`AI Chat Note`
   - **用户支持电子邮件地址**：您的邮箱
   - **应用徽标**：上传应用图标（可选，建议 120x120 像素）
   - **应用首页链接**：
     - 开发环境：`http://localhost:3000`
     - 生产环境：`https://yourdomain.com`
   - **应用隐私权政策链接**：
     - 开发环境：`http://localhost:3000/privacy`
     - 生产环境：`https://yourdomain.com/privacy`
   - **应用服务条款链接**：
     - 开发环境：`http://localhost:3000/terms`
     - 生产环境：`https://yourdomain.com/terms`
   - **已获授权的网域**：添加您的域名（如：`yourdomain.com`）
   - **开发者联系信息**：您的邮箱

5. 点击 "保存并继续"

#### 3. 配置作用域

1. 点击 "添加或移除作用域"
2. 选择以下作用域：
   - `.../auth/userinfo.email` - 获取用户邮箱
   - `.../auth/userinfo.profile` - 获取用户基本信息
3. 点击 "更新"
4. 点击 "保存并继续"

#### 4. 测试用户（仅未验证应用）

1. 点击 "添加用户"
2. 输入测试用户的邮箱地址
3. 点击 "添加"
4. 点击 "保存并继续"

**注意**：未验证应用最多只能有 100 个测试用户。

#### 5. 创建 OAuth 2.0 凭据

1. 在左侧菜单中，选择 **"API 和服务" → "凭据"**
2. 点击顶部的 "创建凭据" → "OAuth 客户端 ID"
3. 选择应用类型：**Web 应用**
4. 配置 OAuth 客户端：
   - **名称**：`AI Chat Note Web Client`
   - **已获授权的 JavaScript 来源**：
     - 开发环境：`http://localhost:3000`
     - 生产环境：`https://yourdomain.com`
   - **已获授权的重定向 URI**：
     - 开发环境：`http://localhost:3000/api/auth/oauth/google/callback`
     - 生产环境：`https://yourdomain.com/api/auth/oauth/google/callback`
5. 点击 "创建"

#### 6. 获取凭据

创建成功后，会显示：
- **客户端 ID**（Client ID）
- **客户端密钥**（Client Secret）

**重要**：请妥善保存这些信息，客户端密钥只显示一次！

### 配置环境变量

将获取的凭据添加到 `.env` 文件：

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
```

### 应用验证（可选）

如果需要超过 100 个用户，需要提交应用验证：

1. 在 OAuth 同意屏幕页面，点击 "发布应用"
2. 填写验证信息
3. 提交审核（通常 1-3 天）

**验证要求**：
- 需要隐私政策页面
- 需要服务条款页面
- 需要应用首页
- 需要验证域名所有权

---

## GitHub OAuth

### 申请地址
[GitHub Developer Settings](https://github.com/settings/developers)

### 申请步骤

#### 1. 访问 OAuth Apps 页面

1. 登录 GitHub
2. 点击右上角头像 → **Settings**
3. 在左侧菜单最下方，点击 **Developer settings**
4. 点击 **OAuth Apps**
5. 点击 **New OAuth App**

#### 2. 填写应用信息

- **Application name**：`AI Chat Note`
- **Homepage URL**：
  - 开发环境：`http://localhost:3000`
  - 生产环境：`https://yourdomain.com`
- **Application description**：（可选）
  - `AI Chat Note - 聊天即生产，对话即沉淀`
- **Authorization callback URL**：
  - 开发环境：`http://localhost:3000/api/auth/oauth/github/callback`
  - 生产环境：`https://yourdomain.com/api/auth/oauth/github/callback`

#### 3. 创建应用

点击 **Register application**

#### 4. 获取凭据

创建成功后：
- **Client ID**：直接显示在页面上
- **Client Secret**：点击 "Generate a new client secret" 生成

**重要**：客户端密钥只显示一次，请立即保存！

#### 5. 上传应用图标（可选）

在应用详情页面，可以上传应用图标（建议 256x256 像素）

### 配置环境变量

将获取的凭据添加到 `.env` 文件：

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback
```

### 权限说明

GitHub OAuth 默认获取以下信息：
- 用户公开信息（用户名、头像等）
- 用户主邮箱地址

无需额外申请权限。

---

## QQ OAuth

### 申请地址
[QQ 互联平台](https://connect.qq.com/)

### 申请步骤

#### 1. 注册开发者账号

1. 访问 [QQ 互联平台](https://connect.qq.com/)
2. 点击右上角 "登录"
3. 使用 QQ 号登录
4. 点击 "应用管理" → "创建应用"
5. 选择 "网站应用"

#### 2. 完善开发者信息

首次使用需要完善开发者信息：
- **开发者类型**：个人 / 企业
- **真实姓名**：您的真实姓名
- **身份证号**：您的身份证号
- **手机号码**：您的手机号
- **邮箱地址**：您的邮箱

#### 3. 创建网站应用

填写应用信息：

- **网站名称**：`AI Chat Note`
- **网站地址**：
  - 开发环境：无法使用（QQ 不支持 localhost）
  - 生产环境：`https://yourdomain.com`
- **网站备案号**：您的网站备案号（必需）
- **网站图标**：上传应用图标（建议 120x120 像素）
- **网站简介**：`AI Chat Note - 聊天即生产，对话即沉淀`
- **网站类型**：选择合适的类型
- **回调地址**：
  - 生产环境：`https://yourdomain.com/api/auth/oauth/qq/callback`

#### 4. 提交审核

1. 检查所有信息无误
2. 点击 "提交审核"
3. 等待审核（通常 1-3 个工作日）

#### 5. 获取凭据

审核通过后，在应用详情页面可以看到：
- **APP ID**：应用 ID
- **APP Key**：应用密钥

### 配置环境变量

将获取的凭据添加到 `.env` 文件：

```bash
QQ_APP_ID=your-app-id
QQ_APP_KEY=your-app-key
QQ_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/qq/callback
```

### 注意事项

1. **必须备案**：QQ OAuth 要求网站必须备案
2. **不支持 localhost**：开发环境需要使用内网穿透或测试域名
3. **审核时间**：通常 1-3 个工作日
4. **备案信息**：网站底部需要显示备案号

### 开发环境解决方案

由于 QQ 不支持 localhost，可以使用以下方案：

1. **使用内网穿透工具**：
   - [ngrok](https://ngrok.com/)
   - [frp](https://github.com/fatedier/frp)
   - [localtunnel](https://localtunnel.github.io/www/)

2. **使用测试域名**：
   - 申请一个便宜的域名
   - 配置 DNS 解析到本地 IP
   - 使用该域名申请 QQ OAuth

---

## 申请前准备

### 必填信息清单

在申请之前，请准备以下信息：

#### 通用信息

- [ ] **应用名称**：`AI Chat Note`
- [ ] **应用描述**：`AI Chat Note - 聊天即生产，对话即沉淀`
- [ ] **应用图标**：
  - 小图标：120x120 像素
  - 大图标：256x256 像素
- [ ] **应用首页 URL**：
  - 开发环境：`http://localhost:3000`
  - 生产环境：`https://yourdomain.com`
- [ ] **隐私政策 URL**：
  - 开发环境：`http://localhost:3000/privacy`
  - 生产环境：`https://yourdomain.com/privacy`
- [ ] **服务条款 URL**：
  - 开发环境：`http://localhost:3000/terms`
  - 生产环境：`https://yourdomain.com/terms`

#### QQ 额外要求

- [ ] **网站备案号**：ICP 备案号
- [ ] **网站负责人信息**：
  - 真实姓名
  - 身份证号
  - 手机号码
  - 邮箱地址

### 回调 URL 规则

所有提供商的回调 URL 格式：

```
{基础URL}/api/auth/oauth/{provider}/callback
```

示例：
- Google：`http://localhost:3000/api/auth/oauth/google/callback`
- GitHub：`http://localhost:3000/api/auth/oauth/github/callback`
- QQ：`https://yourdomain.com/api/auth/oauth/qq/callback`

---

## 推荐申请顺序

### 方案 A：面向国际用户

```
1. Google OAuth（优先）
   ├─ 无需审核
   ├─ 立即可用
   └─ 5 分钟完成

2. GitHub OAuth（推荐）
   ├─ 无需审核
   ├─ 立即可用
   └─ 2 分钟完成

3. QQ OAuth（可选）
   ├─ 需要备案
   ├─ 需要审核
   └─ 1-3 工作日
```

### 方案 B：面向国内用户

```
1. GitHub OAuth（优先）
   ├─ 无需审核
   ├─ 立即可用
   └─ 2 分钟完成

2. QQ OAuth（推荐）
   ├─ 需要备案
   ├─ 需要审核
   └─ 1-3 工作日

3. Google OAuth（可选）
   ├─ 部分国内用户无法访问
   └─ 5 分钟完成
```

### 建议实施步骤

1. **第一步**：申请 Google OAuth（最简单）
   - 立即开始开发
   - 测试 OAuth 流程

2. **第二步**：申请 GitHub OAuth
   - 增加登录选项
   - 开发者友好

3. **第三步**：申请 QQ OAuth（如需要）
   - 完成备案
   - 提交审核
   - 等待通过

---

## 常见问题

### Q1: 未验证的 Google 应用有什么限制？

**限制**：最多 100 个用户可以登录

**解决方案**：
- 开发阶段：使用测试用户模式
- 正式上线：提交应用验证（免费，1-3 天）

### Q2: QQ OAuth 为什么不支持 localhost？

**原因**：QQ 互联平台要求网站必须备案，localhost 无法备案

**解决方案**：
1. 使用内网穿透工具（ngrok、frp）
2. 申请测试域名
3. 直接使用生产域名开发

### Q3: 如何获取用户邮箱？

**Google**：
- 默认获取用户主邮箱
- 通过 `userinfo.email` 作用域

**GitHub**：
- 默认获取用户主邮箱
- 需要用户设置为公开邮箱

**QQ**：
- 默认不返回邮箱
- 需要额外申请邮箱权限
- 建议使用 QQ 号作为唯一标识

### Q4: Client Secret 泄露了怎么办？

**立即操作**：
1. 登录提供商控制台
2. 重新生成 Client Secret
3. 更新应用配置
4. 通知所有用户重新登录

**预防措施**：
- 不要提交到代码仓库
- 使用环境变量
- 定期更换密钥

### Q5: 如何测试 OAuth 登录？

**开发环境测试**：
1. 使用提供商的测试环境
2. 配置 localhost 回调地址
3. 使用测试账号登录

**生产环境测试**：
1. 使用真实域名
2. 配置生产回调地址
3. 测试完整流程

### Q6: 多个环境如何管理？

**推荐方案**：

每个环境创建不同的 OAuth 应用：

```
开发环境：
- Google: AI Chat Note (Dev)
- GitHub: AI Chat Note Dev
- 回调: http://localhost:3000/api/auth/oauth/*/callback

生产环境：
- Google: AI Chat Note
- GitHub: AI Chat Note
- 回调: https://yourdomain.com/api/auth/oauth/*/callback
```

### Q7: OAuth 登录失败怎么办？

**排查步骤**：

1. **检查配置**：
   - Client ID 和 Secret 是否正确
   - 回调 URL 是否匹配
   - 环境变量是否加载

2. **检查网络**：
   - 能否访问提供商 API
   - 是否有防火墙限制

3. **检查日志**：
   - 查看后端错误日志
   - 查看浏览器控制台

4. **检查用户权限**：
   - Google：是否在测试用户列表
   - GitHub：是否授权应用
   - QQ：应用是否审核通过

---

## 安全建议

### 1. 保护 Client Secret

- ❌ 不要提交到代码仓库
- ❌ 不要在前端代码中使用
- ✅ 使用环境变量
- ✅ 定期更换密钥

### 2. 验证回调 URL

- ✅ 使用白名单验证
- ✅ 只接受预配置的回调地址
- ❌ 不要使用动态回调 URL

### 3. 使用 State 参数

- ✅ 生成随机 state 参数
- ✅ 验证回调中的 state
- ✅ 设置有效期（10 分钟）

### 4. HTTPS 要求

**生产环境必须使用 HTTPS**：
- Google：强制要求
- GitHub：强制要求
- QQ：强制要求

**开发环境可以使用 HTTP**：
- 所有提供商都支持 localhost 使用 HTTP

---

## 相关链接

### 官方文档

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [QQ 互联文档](https://wiki.connect.qq.com/)

### 控制台

- [Google Cloud Console](https://console.cloud.google.com/)
- [GitHub Developer Settings](https://github.com/settings/developers)
- [QQ 互联平台](https://connect.qq.com/)

### 工具

- [ngrok - 内网穿透](https://ngrok.com/)
- [OAuth 2.0 Playground](https://www.oauth.com/playground/)

---

## 更新记录

- 2024-03-26：创建文档
