# AI Chat Notes - 新功能实施计划

## 📋 概述

本文档整合了隐私管理、用户 OAuth 登录、用户满意度和反馈三大功能模块的实施计划。

### 实施目标
1. **隐私管理** - 满足法律合规要求，保护用户隐私
2. **用户 OAuth 登录** - 简化用户管理，提升安全性和用户体验
3. **用户满意度和反馈** - 建立用户沟通渠道，持续改进产品

### 总体工作量
- **P0（必须实现）**：约 16 天
- **P1（推荐实现）**：约 12.5 天
- **P2（可选实现）**：约 10.5 天

---

## 🎯 功能一：隐私管理

### 1.1 功能清单

#### P0 - 必须实现（4天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| 用户协议页面 | 1天 | 法律合规必需 |
| 隐私政策页面 | 1天 | 法律合规必需，需说明第三方 API 调用 |
| 用户同意管理 | 2天 | GDPR 合规，记录用户同意历史 |

#### P1 - 推荐实现（1天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| Cookie 政策与设置 | 1天 | 欧盟 GDPR 要求 |

### 1.2 数据库设计

```sql
-- 用户同意记录表
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'marketing'
    version VARCHAR(20) NOT NULL,
    agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type, version);
```

### 1.3 API 设计

```
POST   /api/auth/consent              # 记录用户同意
GET    /api/auth/consents             # 获取用户同意记录
```

### 1.4 前端页面

```
/terms              # 用户协议页面
/privacy            # 隐私政策页面
```

### 1.5 实施要点

#### 用户协议内容
- 服务使用条款
- 用户权利与义务
- 知识产权声明
- 免责声明
- 服务变更/终止条款
- 争议解决机制

#### 隐私政策内容
- 收集的数据类型（邮箱、对话内容、笔记、API Key）
- 数据使用目的
- 数据存储方式与位置
- **第三方 API 调用说明**（重点：用户对话内容会发送到用户配置的 LLM API）
- 用户数据权利（访问、更正、删除、导出）
- Cookie 使用说明
- 隐私政策更新机制

#### 用户同意管理
- 注册时强制同意用户协议和隐私政策
- 记录同意时间、版本、IP 地址
- 隐私政策更新时重新获取同意
- 用户可查看历史同意记录

---

## 🔐 功能二：用户 OAuth 登录

### 2.1 功能清单

#### P0 - 必须实现（4.5天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| Google OAuth 登录 | 2天 | 用户基数大，审核快 |
| QQ OAuth 登录 | 1天 | 国内用户支持 |
| 用户信息管理 | 1天 | 昵称、头像、个人简介 |
| 用户设置持久化 | 0.5天 | 多设备同步设置 |

#### P1 - 推荐实现（2.5天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| GitHub OAuth 登录 | 0.5天 | 开发者用户支持 |
| 账号关联管理 | 1天 | 多 OAuth 账号绑定/解绑 |
| 账号注销 | 1天 | 30天冷静期，GDPR 合规 |

#### P2 - 可选实现（3天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| 邮箱验证码登录 | 2天 | 备选登录方式 |
| 登录历史 | 1天 | 安全审计 |

### 2.2 数据库设计

```sql
-- 修改 users 表（移除 password_hash，添加新字段）
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- OAuth 账号关联表
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'google', 'qq', 'github'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- 用户设置表
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'zh',
    font_size VARCHAR(20) DEFAULT 'medium',
    font_family VARCHAR(100) DEFAULT 'system-ui',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 账号删除请求表
CREATE TABLE account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_deletion_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT
);

CREATE INDEX idx_account_deletion_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_status ON account_deletion_requests(status);
```

### 2.3 API 设计

#### OAuth 登录相关
```
GET    /api/auth/oauth/providers       # 获取支持的 OAuth 提供商列表
GET    /api/auth/oauth/:provider       # 获取 OAuth 授权 URL
POST   /api/auth/oauth/:provider/callback  # OAuth 回调处理
```

#### 用户信息管理
```
GET    /api/auth/me                    # 获取当前用户信息
PUT    /api/auth/profile               # 更新个人信息
POST   /api/auth/avatar                # 上传头像
```

#### 账号关联管理
```
GET    /api/auth/oauth/accounts        # 获取已关联账号列表
DELETE /api/auth/oauth/accounts/:id    # 解除账号关联
```

#### 用户设置
```
GET    /api/user/settings              # 获取用户设置
PUT    /api/user/settings              # 更新用户设置
```

#### 账号管理
```
POST   /api/account/delete             # 申请注销账号
POST   /api/account/delete/cancel      # 取消注销
GET    /api/account/deletion-status    # 查询注销状态
```

### 2.4 前端页面重构

#### 登录页面
```
/login
├── OAuth 登录按钮组
│   ├── 使用 Google 账号登录
│   ├── 使用 QQ 邮箱登录
│   └── 使用 GitHub 登录（可选）
└── 邮箱验证码登录（可选）
```

#### 设置页面
```
/settings
├── 个人信息
│   ├── 头像（从 OAuth 获取，可修改）
│   ├── 昵称（从 OAuth 获取，可修改）
│   ├── 邮箱（从 OAuth 获取，只读）
│   └── 个人简介（可选）
├── 登录方式
│   ├── 已关联账号列表
│   └── 添加登录方式
├── 外观设置
│   ├── 主题
│   ├── 语言
│   ├── 字体大小
│   └── 字体族
└── 危险操作
    └── 注销账号
```

### 2.5 OAuth 配置

#### 环境变量
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/oauth/google/callback

# QQ OAuth
QQ_CLIENT_ID=your_qq_client_id
QQ_CLIENT_SECRET=your_qq_client_secret
QQ_REDIRECT_URL=http://localhost:3000/api/auth/oauth/qq/callback

# GitHub OAuth (可选)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URL=http://localhost:3000/api/auth/oauth/github/callback
```

#### 申请流程
1. **Google OAuth**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建项目并启用 Google+ API
   - 创建 OAuth 2.0 凭据
   - 审核时间：1-3 天

2. **QQ OAuth**
   - 访问 [QQ 互联平台](https://connect.qq.com/)
   - 创建应用
   - 获取 APP ID 和 APP Key
   - 审核时间：1-7 天（需要网站备案）

3. **GitHub OAuth**
   - GitHub Settings → Developer settings → OAuth Apps
   - 创建新的 OAuth App
   - 即时生效

### 2.6 实施要点

#### OAuth 登录流程
```
用户点击登录 → 选择邮箱服务商 → 跳转 OAuth 授权 → 
获取用户信息 → 创建/更新用户 → 生成 JWT Token → 登录成功
```

#### 账号关联逻辑
- 用户可通过多个 OAuth 账号登录同一个账号（基于邮箱关联）
- 首次登录：创建用户 + 创建 OAuth 关联
- 再次登录：通过邮箱查找用户 + 检查/创建 OAuth 关联

#### 安全验证
- OAuth state 参数验证（防 CSRF）
- Redirect URI 验证
- HTTPS 必须启用

#### 数据迁移
如果已有用户数据：
1. 保留原有用户数据
2. 引导用户绑定 OAuth 账号
3. 提供过渡期（同时支持密码登录和 OAuth 登录）

---

## 💬 功能三：用户满意度和反馈

### 3.1 功能清单

#### P0 - 必须实现（3.5天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| 问题反馈系统 | 3天 | 产品改进必需 |
| 联系方式页面 | 0.5天 | 用户支持必需 |

#### P1 - 推荐实现（3天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| 功能投票系统 | 2天 | 了解用户需求优先级 |
| 帮助中心 / FAQ | 1天 | 减少支持成本 |

#### P2 - 可选实现（1天）
| 功能 | 工作量 | 说明 |
|------|--------|------|
| 用户满意度调查 | 1天 | 产品改进参考 |

### 3.2 数据库设计

```sql
-- 用户反馈表
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'bug', 'feature', 'question', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    screenshots JSONB,
    user_agent TEXT,
    browser_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);

-- 反馈评论表
CREATE TABLE feedback_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);

-- 功能请求表
CREATE TABLE feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'under_review',
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_requests_status ON feature_requests(status);

-- 功能请求投票表
CREATE TABLE feature_request_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_request_id, user_id)
);

CREATE INDEX idx_feature_request_votes_feature_id ON feature_request_votes(feature_request_id);

-- 用户调查表
CREATE TABLE user_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_type VARCHAR(50) NOT NULL, -- 'nps', 'satisfaction'
    responses JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_surveys_user_id ON user_surveys(user_id);
```

### 3.3 API 设计

#### 反馈相关
```
POST   /api/feedback                  # 提交反馈
GET    /api/feedback                  # 获取我的反馈列表
GET    /api/feedback/:id              # 获取反馈详情
POST   /api/feedback/:id/comments     # 添加评论
```

#### 联系方式
```
POST   /api/contact                   # 发送联系邮件
```

#### 功能投票
```
GET    /api/feature-requests          # 获取功能请求列表
POST   /api/feature-requests          # 提交功能请求
POST   /api/feature-requests/:id/vote # 投票
```

#### 用户调查
```
POST   /api/surveys                   # 提交调查问卷
```

### 3.4 前端页面

```
/feedback           # 反馈提交页面
/feature-requests   # 功能投票页面
/about              # 关于我们（包含联系方式）
/help               # 帮助中心 / FAQ
/settings/feedback  # 我的反馈列表
```

### 3.5 实施要点

#### 问题反馈系统
- 反馈类型：Bug 报告、功能建议、使用问题、其他
- 反馈内容：标题、详细描述（支持 Markdown）、优先级、截图上传
- 反馈状态：待处理、处理中、已解决、已关闭
- 用户可查看自己提交的反馈及处理状态

#### 功能投票系统
- 展示计划开发的功能列表
- 用户可投票支持想要的功能
- 用户可提交新功能建议
- 按投票数排序展示

#### 用户满意度调查
- 定期弹出满意度调查（如使用 1 周后）
- NPS (Net Promoter Score) 评分
- 具体问题评分（易用性、功能完整性等）
- 开放式建议

---

## 🎨 页面布局设计

### 设计原则

采用 **"独立页面 + 设置页面整合"** 的混合方案：

1. **隐私协议** → 独立页面 + 设置页面链接
2. **用户反馈** → 设置页面整合 + 快捷入口
3. **关于我们** → 独立页面
4. **帮助中心** → 独立页面

### 当前前端结构

```
左侧导航栏（Sidebar）
├── 新建对话按钮
├── 对话历史列表
├── 导航菜单
│   ├── 知识库 (/notes)
│   ├── 模型管理 (/models)
│   └── 设置 (/settings)
└── 用户菜单（底部）
    ├── 设置
    └── 登出

当前页面
├── / - 首页（聊天）
├── /notes - 知识库
├── /models - 模型管理
└── /settings - 设置（仅主题/语言/字体）
```

### 新增页面布局

#### 1. 左侧导航栏（新增）

```
左侧导航栏
├── 新建对话按钮
├── 对话历史列表
├── 导航菜单
│   ├── 知识库
│   ├── 模型管理
│   └── 设置
├── 反馈按钮（新增）⭐
│   └── 点击打开反馈对话框
└── 用户菜单（底部）
    ├── 设置
    └── 登出
```

#### 2. 设置页面（重构）

```
/settings
├── 个人信息
│   ├── 头像（从 OAuth 获取，可修改）
│   ├── 昵称（从 OAuth 获取，可修改）
│   ├── 邮箱（从 OAuth 获取，只读）
│   └── 个人简介（可选）
├── 登录方式
│   ├── 已关联账号列表
│   │   ├── Google (user@gmail.com) [解除关联]
│   │   └── QQ (user@qq.com) [解除关联]
│   └── 添加登录方式
├── 外观设置
│   ├── 主题
│   ├── 语言
│   ├── 字体大小
│   └── 字体族
├── 数据管理
│   ├── 数据统计
│   ├── 数据导出
│   └── 数据备份（可选）
├── 反馈与支持（新增）⭐
│   ├── 提交反馈 [按钮]
│   ├── 功能投票 [链接]
│   ├── 帮助中心 [链接]
│   └── 联系我们 [链接]
├── 法律信息（新增）⭐
│   ├── 用户协议 [链接]
│   ├── 隐私政策 [链接]
│   └── Cookie 政策 [链接]
└── 危险操作
    └── 注销账号
```

#### 3. 新增独立页面

```
/terms              # 用户协议页面
/privacy            # 隐私政策页面
/about              # 关于我们页面
/help               # 帮助中心页面
/settings/feedback  # 我的反馈列表页面
/feature-requests   # 功能投票页面（可选）
```

### 详细页面设计

#### 1. 用户协议页面 (/terms)

**页面结构**：
```
/terms
├── 标题
├── 最后更新时间
└── 协议内容
    ├── 服务使用条款
    ├── 用户权利与义务
    ├── 知识产权声明
    ├── 免责声明
    ├── 服务变更/终止条款
    └── 争议解决机制
```

**访问入口**：
1. 注册页面底部 - 用户注册时必须勾选同意
2. 设置页面 → 法律信息 → 用户协议
3. 页面底部 Footer（全局）

#### 2. 隐私政策页面 (/privacy)

**页面结构**：
```
/privacy
├── 标题
├── 最后更新时间
└── 政策内容
    ├── 收集的数据类型
    ├── 数据使用目的
    ├── 数据存储方式与位置
    ├── 第三方 API 调用说明（重点）
    ├── 用户数据权利
    ├── Cookie 使用说明
    └── 隐私政策更新机制
```

**访问入口**：
1. 注册页面底部 - 用户注册时必须勾选同意
2. 设置页面 → 法律信息 → 隐私政策
3. 页面底部 Footer（全局）

#### 3. 反馈对话框（Modal）

**触发方式**：点击左侧导航栏的"反馈"按钮

**对话框结构**：
```
反馈对话框
├── 反馈类型选择
│   ├── Bug 报告
│   ├── 功能建议
│   ├── 使用问题
│   └── 其他
├── 标题输入
├── 详细描述（支持 Markdown）
├── 截图上传（可选）
└── [取消] [提交]
```

#### 4. 我的反馈列表页面 (/settings/feedback)

**页面结构**：
```
/settings/feedback
├── 页面标题
├── 提交新反馈按钮
└── 反馈列表
    ├── 反馈项
    │   ├── 类型标签（Bug/功能/问题）
    │   ├── 标题
    │   ├── 状态（待处理/处理中/已解决）
    │   ├── 提交时间
    │   └── 查看详情 [按钮]
    └── ...
```

#### 5. 功能投票页面 (/feature-requests)

**页面结构**：
```
/feature-requests
├── 页面标题
├── 提交新功能建议按钮
└── 功能请求列表
    ├── 功能请求卡片
    │   ├── 标题
    │   ├── 描述
    │   ├── 状态（审核中/计划中/开发中/已完成）
    │   ├── 投票数
    │   └── 投票按钮
    └── ...（按投票数排序）
```

#### 6. 关于我们页面 (/about)

**页面结构**：
```
/about
├── 产品介绍
│   ├── 产品名称
│   ├── 产品描述
│   └── 核心功能
├── 团队信息（可选）
├── 联系方式
│   ├── 联系邮箱
│   ├── GitHub 仓库
│   └── 社交媒体链接（可选）
└── 法律信息链接
    ├── 用户协议
    └── 隐私政策
```

**访问入口**：设置页面底部 → 关于我们

#### 7. 帮助中心页面 (/help)

**页面结构**：
```
/help
├── 搜索框
├── 常见问题（FAQ）
│   ├── 如何配置模型？
│   ├── 如何保存笔记？
│   ├── 如何导出数据？
│   └── ...
├── 使用教程
│   ├── 快速入门
│   ├── 对话功能
│   ├── 笔记功能
│   └── ...
└── 快捷键说明
```

**访问入口**：设置页面 → 反馈与支持 → 帮助中心

### 页面布局对比

| 功能 | 页面位置 | 访问入口 | 设计理由 |
|------|----------|----------|----------|
| 用户协议 | 独立页面 `/terms` | 注册页、设置页、页脚 | 内容较长，方便阅读和分享 |
| 隐私政策 | 独立页面 `/privacy` | 注册页、设置页、页脚 | 内容较长，方便阅读和分享 |
| 用户反馈 | 设置页面整合 + 快捷入口 | 左侧导航栏反馈按钮 | 降低反馈门槛，提高反馈率 |
| 我的反馈 | 独立页面 `/settings/feedback` | 设置页面 | 方便查看历史反馈 |
| 功能投票 | 独立页面 `/feature-requests` | 设置页面（可选） | 独立空间展示功能列表 |
| 关于我们 | 独立页面 `/about` | 设置页面 | 内容较多，需要独立展示 |
| 帮助中心 | 独立页面 `/help` | 设置页面 | 内容较多，需要搜索功能 |

### 为什么这样设计？

#### ✅ 优点
1. **隐私协议独立页面**：方便用户阅读和分享链接
2. **用户反馈快捷入口**：降低反馈门槛，提高反馈率
3. **设置页面整合**：符合用户查找习惯，逻辑清晰
4. **左侧导航栏保持简洁**：不添加过多低频功能

#### ❌ 避免的问题
1. **全部放在设置页面**：隐私协议等内容较长，不适合嵌入
2. **全部独立页面 + 左侧导航栏**：导航栏过于拥挤
3. **缺少快捷入口**：用户反馈门槛高，反馈率低

---

## 🎨 页面布局设计

### 设计原则

采用 **"独立页面 + 设置页面整合"** 的混合方案：

1. **隐私协议** → 独立页面 + 设置页面链接
2. **用户反馈** → 设置页面整合 + 快捷入口
3. **关于我们** → 独立页面
4. **帮助中心** → 独立页面

### 当前前端结构

```
左侧导航栏（Sidebar）
├── 新建对话按钮
├── 对话历史列表
├── 导航菜单
│   ├── 知识库 (/notes)
│   ├── 模型管理 (/models)
│   └── 设置 (/settings)
└── 用户菜单（底部）
    ├── 设置
    └── 登出

当前页面
├── / - 首页（聊天）
├── /notes - 知识库
├── /models - 模型管理
└── /settings - 设置（仅主题/语言/字体）
```

### 新增页面布局

#### 1. 左侧导航栏（新增）

```
左侧导航栏
├── 新建对话按钮
├── 对话历史列表
├── 导航菜单
│   ├── 知识库
│   ├── 模型管理
│   └── 设置
├── 反馈按钮（新增）⭐
│   └── 点击打开反馈对话框
└── 用户菜单（底部）
    ├── 设置
    └── 登出
```

#### 2. 设置页面（重构）

```
/settings
├── 个人信息
│   ├── 头像（从 OAuth 获取，可修改）
│   ├── 昵称（从 OAuth 获取，可修改）
│   ├── 邮箱（从 OAuth 获取，只读）
│   └── 个人简介（可选）
├── 登录方式
│   ├── 已关联账号列表
│   │   ├── Google (user@gmail.com) [解除关联]
│   │   └── QQ (user@qq.com) [解除关联]
│   └── 添加登录方式
├── 外观设置
│   ├── 主题
│   ├── 语言
│   ├── 字体大小
│   └── 字体族
├── 数据管理
│   ├── 数据统计
│   ├── 数据导出
│   └── 数据备份（可选）
├── 反馈与支持（新增）⭐
│   ├── 提交反馈 [按钮]
│   ├── 功能投票 [链接]
│   ├── 帮助中心 [链接]
│   └── 联系我们 [链接]
├── 法律信息（新增）⭐
│   ├── 用户协议 [链接]
│   ├── 隐私政策 [链接]
│   └── Cookie 政策 [链接]
└── 危险操作
    └── 注销账号
```

#### 3. 新增独立页面

```
/terms              # 用户协议页面
/privacy            # 隐私政策页面
/about              # 关于我们页面
/help               # 帮助中心页面
/settings/feedback  # 我的反馈列表页面
/feature-requests   # 功能投票页面（可选）
```

### 详细页面设计

#### 1. 用户协议页面 (/terms)

**页面结构**：
```
/terms
├── 标题
├── 最后更新时间
└── 协议内容
    ├── 服务使用条款
    ├── 用户权利与义务
    ├── 知识产权声明
    ├── 免责声明
    ├── 服务变更/终止条款
    └── 争议解决机制
```

**访问入口**：
1. 注册页面底部 - 用户注册时必须勾选同意
2. 设置页面 → 法律信息 → 用户协议
3. 页面底部 Footer（全局）

#### 2. 隐私政策页面 (/privacy)

**页面结构**：
```
/privacy
├── 标题
├── 最后更新时间
└── 政策内容
    ├── 收集的数据类型
    ├── 数据使用目的
    ├── 数据存储方式与位置
    ├── 第三方 API 调用说明（重点）
    ├── 用户数据权利
    ├── Cookie 使用说明
    └── 隐私政策更新机制
```

**访问入口**：
1. 注册页面底部 - 用户注册时必须勾选同意
2. 设置页面 → 法律信息 → 隐私政策
3. 页面底部 Footer（全局）

#### 3. 反馈对话框（Modal）

**触发方式**：点击左侧导航栏的"反馈"按钮

**对话框结构**：
```
反馈对话框
├── 反馈类型选择
│   ├── Bug 报告
│   ├── 功能建议
│   ├── 使用问题
│   └── 其他
├── 标题输入
├── 详细描述（支持 Markdown）
├── 截图上传（可选）
└── [取消] [提交]
```

#### 4. 我的反馈列表页面 (/settings/feedback)

**页面结构**：
```
/settings/feedback
├── 页面标题
├── 提交新反馈按钮
└── 反馈列表
    ├── 反馈项
    │   ├── 类型标签（Bug/功能/问题）
    │   ├── 标题
    │   ├── 状态（待处理/处理中/已解决）
    │   ├── 提交时间
    │   └── 查看详情 [按钮]
    └── ...
```

#### 5. 功能投票页面 (/feature-requests)

**页面结构**：
```
/feature-requests
├── 页面标题
├── 提交新功能建议按钮
└── 功能请求列表
    ├── 功能请求卡片
    │   ├── 标题
    │   ├── 描述
    │   ├── 状态（审核中/计划中/开发中/已完成）
    │   ├── 投票数
    │   └── 投票按钮
    └── ...（按投票数排序）
```

#### 6. 关于我们页面 (/about)

**页面结构**：
```
/about
├── 产品介绍
│   ├── 产品名称
│   ├── 产品描述
│   └── 核心功能
├── 团队信息（可选）
├── 联系方式
│   ├── 联系邮箱
│   ├── GitHub 仓库
│   └── 社交媒体链接（可选）
└── 法律信息链接
    ├── 用户协议
    └── 隐私政策
```

**访问入口**：设置页面底部 → 关于我们

#### 7. 帮助中心页面 (/help)

**页面结构**：
```
/help
├── 搜索框
├── 常见问题（FAQ）
│   ├── 如何配置模型？
│   ├── 如何保存笔记？
│   ├── 如何导出数据？
│   └── ...
├── 使用教程
│   ├── 快速入门
│   ├── 对话功能
│   ├── 笔记功能
│   └── ...
└── 快捷键说明
```

**访问入口**：设置页面 → 反馈与支持 → 帮助中心

### 页面布局对比

| 功能 | 页面位置 | 访问入口 | 设计理由 |
|------|----------|----------|----------|
| 用户协议 | 独立页面 `/terms` | 注册页、设置页、页脚 | 内容较长，方便阅读和分享 |
| 隐私政策 | 独立页面 `/privacy` | 注册页、设置页、页脚 | 内容较长，方便阅读和分享 |
| 用户反馈 | 设置页面整合 + 快捷入口 | 左侧导航栏反馈按钮 | 降低反馈门槛，提高反馈率 |
| 我的反馈 | 独立页面 `/settings/feedback` | 设置页面 | 方便查看历史反馈 |
| 功能投票 | 独立页面 `/feature-requests` | 设置页面（可选） | 独立空间展示功能列表 |
| 关于我们 | 独立页面 `/about` | 设置页面 | 内容较多，需要独立展示 |
| 帮助中心 | 独立页面 `/help` | 设置页面 | 内容较多，需要搜索功能 |

### 为什么这样设计？

#### ✅ 优点
1. **隐私协议独立页面**：方便用户阅读和分享链接
2. **用户反馈快捷入口**：降低反馈门槛，提高反馈率
3. **设置页面整合**：符合用户查找习惯，逻辑清晰
4. **左侧导航栏保持简洁**：不添加过多低频功能

#### ❌ 避免的问题
1. **全部放在设置页面**：隐私协议等内容较长，不适合嵌入
2. **全部独立页面 + 左侧导航栏**：导航栏过于拥挤
3. **缺少快捷入口**：用户反馈门槛高，反馈率低

---

## 📅 实施计划

### 阶段一：隐私管理（1 周）

**优先级：最高（法律合规必需）**

#### 后端任务
1. 创建 user_consents 表
2. 实现用户同意管理 API
3. 编写用户协议和隐私政策内容

#### 前端任务
1. 创建用户协议页面
2. 创建隐私政策页面
3. 实现注册时的同意流程
4. 实现 Cookie 横幅（可选）

**预计工作量**：4-5 天

---

### 阶段二：用户 OAuth 登录（1.5 周）

**优先级：高（核心功能变更）**

#### 准备工作
1. 申请 Google OAuth 应用
2. 申请 QQ OAuth 应用
3. 申请 GitHub OAuth 应用（可选）

#### 后端任务
1. 修改 users 表结构
2. 创建 oauth_accounts 表
3. 创建 user_settings 表
4. 实现 Google OAuth 服务
5. 实现 QQ OAuth 服务
6. 实现 OAuth 登录 API
7. 实现用户信息管理 API
8. 实现用户设置 API
9. 移除原有的注册、登录 API

#### 前端任务
1. 重构登录页面（OAuth 登录按钮）
2. 实现 OAuth 登录流程
3. 重构设置页面
4. 实现个人信息区域
5. 实现用户设置持久化
6. 移除原有的注册、登录表单
7. 添加国际化文本

**预计工作量**：7-8 天

---

### 阶段三：用户满意度和反馈（1 周）

**优先级：高（产品改进必需）**

#### 后端任务
1. 创建 feedback 表
2. 创建 feedback_comments 表
3. 创建 feature_requests 表（可选）
4. 创建 feature_request_votes 表（可选）
5. 实现反馈 API
6. 实现功能投票 API（可选）

#### 前端任务
1. 实现反馈提交页面
2. 实现我的反馈列表
3. 实现联系方式页面
4. 实现帮助中心页面
5. 实现功能投票页面（可选）

**预计工作量**：5-6 天

---

## 🎯 优先级总结

### P0 - 必须实现（约 16 天）
| 功能模块 | 功能 | 工作量 |
|----------|------|--------|
| 隐私管理 | 用户协议页面 | 1天 |
| 隐私管理 | 隐私政策页面 | 1天 |
| 隐私管理 | 用户同意管理 | 2天 |
| OAuth 登录 | Google OAuth 登录 | 2天 |
| OAuth 登录 | QQ OAuth 登录 | 1天 |
| OAuth 登录 | 用户信息管理 | 1天 |
| OAuth 登录 | 用户设置持久化 | 0.5天 |
| 用户反馈 | 问题反馈系统 | 3天 |
| 用户反馈 | 联系方式页面 | 0.5天 |
| **总计** | | **12天** |

### P1 - 推荐实现（约 6.5 天）
| 功能模块 | 功能 | 工作量 |
|----------|------|--------|
| 隐私管理 | Cookie 政策与设置 | 1天 |
| OAuth 登录 | GitHub OAuth 登录 | 0.5天 |
| OAuth 登录 | 账号关联管理 | 1天 |
| OAuth 登录 | 账号注销 | 1天 |
| 用户反馈 | 功能投票系统 | 2天 |
| 用户反馈 | 帮助中心 / FAQ | 1天 |
| **总计** | | **6.5天** |

### P2 - 可选实现（约 4 天）
| 功能模块 | 功能 | 工作量 |
|----------|------|--------|
| OAuth 登录 | 邮箱验证码登录 | 2天 |
| OAuth 登录 | 登录历史 | 1天 |
| 用户反馈 | 用户满意度调查 | 1天 |
| **总计** | | **4天** |

---

## ⚠️ 注意事项

### 法律合规
1. **隐私政策必须清晰易懂**，避免过于专业的法律术语
2. **明确说明第三方 API 调用**，用户对话内容会发送到用户配置的 LLM API
3. **用户同意记录必须保存**，以备合规审计
4. **账号注销必须真实删除数据**，不能仅标记为删除

### OAuth 申请
1. **Google OAuth**
   - 需要验证域名所有权
   - 需要提供隐私政策链接
   - 审核时间：1-3 天

2. **QQ OAuth**
   - 需要网站备案（国内服务器）
   - 需要提供网站信息
   - 审核时间：1-7 天

3. **GitHub OAuth**
   - 审核最快，即时生效
   - 适合开发者用户

### 技术实现
1. **OAuth state 参数验证**，防止 CSRF 攻击
2. **数据导出要异步处理**，避免大文件导出超时
3. **账号注销设置冷静期**，防止误操作
4. **反馈系统支持截图上传**，需要文件存储服务

### 用户体验
1. **隐私政策更新时通知用户**，并重新获取同意
2. **OAuth 登录流程要简洁**，减少用户操作步骤
3. **反馈系统要有状态更新**，让用户知道处理进度
4. **帮助中心要持续更新**，根据用户反馈补充内容

---

## 📊 数据库变更汇总

### 新增表
1. `user_consents` - 用户同意记录
2. `oauth_accounts` - OAuth 账号关联
3. `user_settings` - 用户设置
4. `account_deletion_requests` - 账号删除请求
5. `feedback` - 用户反馈
6. `feedback_comments` - 反馈评论
7. `feature_requests` - 功能请求（可选）
8. `feature_request_votes` - 功能请求投票（可选）
9. `user_surveys` - 用户调查（可选）

### 修改表
1. `users` - 移除 password_hash，添加 nickname、avatar_url、bio

---

## 🚀 开始实施

建议按以下顺序开始实施：

1. **第一步**：申请 OAuth 应用（Google、QQ）
2. **第二步**：实现隐私管理功能（法律合规）
3. **第三步**：实现 OAuth 登录功能（核心功能）
4. **第四步**：实现用户反馈功能（产品改进）

准备好开始了吗？
