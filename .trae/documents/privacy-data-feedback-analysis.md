# AI Chat Notes - 隐私协议、数据管理、用户反馈功能分析

## 一、应用现状分析

### 当前功能概览
- **用户系统**：注册、登录、登出、修改密码
- **模型管理**：多 LLM 提供商配置、模型选择
- **聊天功能**：多轮对话、流式输出、对话管理
- **笔记功能**：保存对话为笔记、AI 生成标题/总结/标签
- **知识库**：笔记列表、文件夹管理、标签筛选、搜索、导出

### 当前数据安全措施
- 用户密码：bcrypt 加密存储
- API Key：AES 加密存储
- JWT Token：短期有效 + Refresh Token
- CORS 限制

---

## 二、隐私协议相关功能

### 2.1 必备功能（高优先级）

#### 1. 用户协议 (Terms of Service)
**必要性**：⭐⭐⭐⭐⭐（法律合规必需）

**功能内容**：
- 服务使用条款
- 用户权利与义务
- 知识产权声明
- 免责声明
- 服务变更/终止条款
- 争议解决机制

**实现方式**：
- 前端：独立的 `/terms` 页面，支持 Markdown 渲染
- 后端：无需 API，静态内容
- 用户注册时强制勾选同意

#### 2. 隐私政策 (Privacy Policy)
**必要性**：⭐⭐⭐⭐⭐（法律合规必需，尤其涉及用户数据）

**功能内容**：
- 收集的数据类型（邮箱、对话内容、笔记、API Key）
- 数据使用目的
- 数据存储方式与位置
- 数据共享政策（第三方 API 调用说明）
- 用户数据权利（访问、更正、删除、导出）
- Cookie 使用说明
- 隐私政策更新机制

**实现方式**：
- 前端：独立的 `/privacy` 页面
- 后端：记录用户同意隐私政策的版本和时间
- 数据库：`user_consents` 表记录用户同意记录

#### 3. 用户同意管理
**必要性**：⭐⭐⭐⭐⭐（GDPR 合规必需）

**功能内容**：
- 注册时强制同意用户协议和隐私政策
- 记录同意时间、版本
- 隐私政策更新时重新获取同意
- 用户可查看历史同意记录

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'marketing'
    version VARCHAR(20) NOT NULL,
    agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);
```
- API：`POST /api/auth/consent`, `GET /api/auth/consents`

### 2.2 推荐功能（中优先级）

#### 4. Cookie 政策与设置
**必要性**：⭐⭐⭐⭐（欧盟 GDPR 要求）

**功能内容**：
- Cookie 横幅提示
- Cookie 分类（必要、分析、营销）
- 用户可选择接受/拒绝非必要 Cookie
- Cookie 设置页面

**实现方式**：
- 前端：Cookie 横幅组件 + 设置页面
- 本地存储用户偏好

#### 5. 数据处理协议 (DPA)
**必要性**：⭐⭐⭐（企业用户可能需要）

**功能内容**：
- 数据处理者与控制者关系
- 数据处理范围与目的
- 数据安全措施
- 数据主体权利保障

**实现方式**：
- 提供可下载的 PDF 文档
- 企业用户可在线签署

---

## 三、数据管理相关功能

### 3.1 必备功能（高优先级）

#### 1. 数据导出增强
**必要性**：⭐⭐⭐⭐⭐（用户数据权利）

**当前状态**：已有单篇/批量笔记导出功能

**需要增强**：
- **全量数据导出**：导出用户所有数据（对话、笔记、文件夹、标签、模型配置）
- **导出格式**：
  - JSON（机器可读，便于迁移）
  - Markdown（人类可读，便于存档）
  - ZIP 压缩包
- **导出范围选择**：
  - 仅对话记录
  - 仅笔记
  - 全部数据

**实现方式**：
- API：`POST /api/data/export` 
- 后台任务异步处理（数据量大时）
- 邮件通知下载链接

#### 2. 数据删除功能
**必要性**：⭐⭐⭐⭐⭐（GDPR "被遗忘权"）

**功能内容**：
- **单条数据删除**：已有（对话、笔记、文件夹）
- **批量删除**：已有（笔记批量删除）
- **账号注销**：
  - 用户主动注销账号
  - 删除所有关联数据
  - 30 天冷静期（可恢复）
  - 确认邮件验证

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_deletion_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, cancelled, completed
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT
);
```
- API：`POST /api/account/delete`, `POST /api/account/delete/cancel`
- 定时任务：执行账号删除

#### 3. 数据使用统计
**必要性**：⭐⭐⭐⭐（用户了解自己的使用情况）

**功能内容**：
- 对话数量统计
- 笔记数量统计
- 存储空间占用
- API 调用次数（如果记录）
- 按时间段统计（日/周/月）

**实现方式**：
- 前端：设置页面新增"数据统计"标签页
- API：`GET /api/data/statistics`

### 3.2 推荐功能（中优先级）

#### 4. 数据备份与恢复
**必要性**：⭐⭐⭐⭐（数据安全）

**功能内容**：
- 自动备份：
  - 用户可开启自动备份
  - 每周/每月自动备份
  - 保留最近 N 个备份
- 手动备份：
  - 用户主动触发备份
  - 生成备份文件下载
- 数据恢复：
  - 从备份文件恢复数据
  - 选择性恢复（仅笔记、仅对话等）

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE user_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    backup_type VARCHAR(20) NOT NULL, -- 'auto', 'manual'
    backup_scope VARCHAR(50) NOT NULL, -- 'all', 'notes', 'conversations'
    file_path VARCHAR(500),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```
- API：`POST /api/backups`, `GET /api/backups`, `POST /api/backups/:id/restore`
- 定时任务：自动备份

#### 5. 存储空间管理
**必要性**：⭐⭐⭐（如果提供免费套餐，需要限制存储）

**功能内容**：
- 存储配额设置（如免费用户 100MB）
- 存储空间使用情况展示
- 超额提醒
- 清理建议（大文件、重复内容）

**实现方式**：
- 计算用户数据总大小
- 前端展示存储进度条
- 超额时限制新内容创建

#### 6. 数据访问日志
**必要性**：⭐⭐⭐（安全审计）

**功能内容**：
- 记录用户登录日志
- 记录敏感操作（修改密码、导出数据、删除账号）
- 用户可查看自己的操作日志

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- API：`GET /api/activity-logs`

---

## 四、用户反馈相关功能

### 4.1 必备功能（高优先级）

#### 1. 问题反馈系统
**必要性**：⭐⭐⭐⭐⭐（产品改进必需）

**功能内容**：
- 反馈类型：
  - Bug 报告
  - 功能建议
  - 使用问题
  - 其他
- 反馈内容：
  - 标题
  - 详细描述（支持 Markdown）
  - 优先级（低/中/高/紧急）
  - 截图上传（可选）
  - 浏览器/设备信息（自动收集）
- 反馈状态：
  - 待处理
  - 处理中
  - 已解决
  - 已关闭
- 用户可查看自己提交的反馈及处理状态

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'bug', 'feature', 'question', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    screenshots JSONB, -- 存储截图 URL 数组
    user_agent TEXT,
    browser_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feedback_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- 管理员回复时可为 NULL
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- API：
  - `POST /api/feedback` - 提交反馈
  - `GET /api/feedback` - 获取我的反馈列表
  - `GET /api/feedback/:id` - 获取反馈详情
  - `POST /api/feedback/:id/comments` - 添加评论

#### 2. 联系方式
**必要性**：⭐⭐⭐⭐（用户支持必需）

**功能内容**：
- 关于页面展示：
  - 开发者/团队信息
  - 联系邮箱
  - GitHub 仓库链接（如果是开源项目）
  - 社交媒体链接（可选）
- 设置页面：
  - 联系表单（直接发送邮件）

**实现方式**：
- 前端：独立的 `/about` 页面
- API：`POST /api/contact`（发送邮件）

### 4.2 推荐功能（中优先级）

#### 3. 功能投票系统
**必要性**：⭐⭐⭐⭐（了解用户需求优先级）

**功能内容**：
- 展示计划开发的功能列表
- 用户可投票支持想要的功能
- 用户可提交新功能建议
- 按投票数排序展示

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'under_review', -- under_review, planned, in_progress, completed, declined
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_request_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_request_id, user_id)
);
```
- API：
  - `GET /api/feature-requests` - 获取功能请求列表
  - `POST /api/feature-requests` - 提交功能请求
  - `POST /api/feature-requests/:id/vote` - 投票

#### 4. 用户满意度调查
**必要性**：⭐⭐⭐（产品改进参考）

**功能内容**：
- 定期弹出满意度调查（如使用 1 周后）
- NPS (Net Promoter Score) 评分
- 具体问题评分（易用性、功能完整性等）
- 开放式建议

**实现方式**：
- 数据库新增表：
```sql
CREATE TABLE user_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    survey_type VARCHAR(50) NOT NULL, -- 'nps', 'satisfaction', 'feature_feedback'
    responses JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- API：`POST /api/surveys`
- 前端：弹窗组件

#### 5. 帮助中心 / FAQ
**必要性**：⭐⭐⭐（减少支持成本）

**功能内容**：
- 常见问题解答
- 使用教程
- 快捷键说明
- 视频教程（可选）

**实现方式**：
- 前端：独立的 `/help` 页面
- 内容可静态管理或后台管理

---

## 五、功能优先级总结

### P0 - 必须实现（法律合规/核心需求）
| 功能 | 类型 | 工作量 | 理由 |
|------|------|--------|------|
| 用户协议 | 隐私协议 | 1天 | 法律合规必需 |
| 隐私政策 | 隐私协议 | 1天 | 法律合规必需 |
| 用户同意管理 | 隐私协议 | 2天 | GDPR 合规必需 |
| 全量数据导出 | 数据管理 | 2天 | 用户数据权利 |
| 账号注销 | 数据管理 | 2天 | GDPR "被遗忘权" |
| 问题反馈系统 | 用户反馈 | 3天 | 产品改进必需 |
| 联系方式 | 用户反馈 | 0.5天 | 用户支持必需 |

**P0 总工作量：约 11.5 天**

### P1 - 推荐实现（提升用户体验）
| 功能 | 类型 | 工作量 | 理由 |
|------|------|--------|------|
| Cookie 政策与设置 | 隐私协议 | 1天 | 欧盟 GDPR 要求 |
| 数据使用统计 | 数据管理 | 1天 | 用户了解使用情况 |
| 数据备份与恢复 | 数据管理 | 3天 | 数据安全 |
| 数据访问日志 | 数据管理 | 2天 | 安全审计 |
| 功能投票系统 | 用户反馈 | 2天 | 了解用户需求优先级 |
| 帮助中心 / FAQ | 用户反馈 | 1天 | 减少支持成本 |

**P1 总工作量：约 10 天**

### P2 - 可选实现（锦上添花）
| 功能 | 类型 | 工作量 | 理由 |
|------|------|--------|------|
| 数据处理协议 | 隐私协议 | 0.5天 | 企业用户可能需要 |
| 存储空间管理 | 数据管理 | 2天 | 免费套餐限制 |
| 用户满意度调查 | 用户反馈 | 1天 | 产品改进参考 |

**P2 总工作量：约 3.5 天**

---

## 六、数据库设计补充

### 新增表汇总

```sql
-- 用户同意记录
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 账号删除请求
CREATE TABLE account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_deletion_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT
);

-- 用户备份
CREATE TABLE user_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_type VARCHAR(20) NOT NULL,
    backup_scope VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 用户活动日志
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户反馈
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
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

-- 反馈评论
CREATE TABLE feedback_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 功能请求
CREATE TABLE feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'under_review',
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 功能请求投票
CREATE TABLE feature_request_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_request_id, user_id)
);

-- 用户调查
CREATE TABLE user_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_type VARCHAR(50) NOT NULL,
    responses JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 七、API 设计补充

### 隐私协议相关

```
POST   /api/auth/consent              # 记录用户同意
GET    /api/auth/consents             # 获取用户同意记录
```

### 数据管理相关

```
POST   /api/data/export               # 全量数据导出
GET    /api/data/statistics           # 数据使用统计
POST   /api/account/delete            # 申请注销账号
POST   /api/account/delete/cancel     # 取消注销
GET    /api/backups                   # 获取备份列表
POST   /api/backups                   # 创建备份
POST   /api/backups/:id/restore       # 从备份恢复
GET    /api/activity-logs             # 获取活动日志
```

### 用户反馈相关

```
POST   /api/feedback                  # 提交反馈
GET    /api/feedback                  # 获取我的反馈列表
GET    /api/feedback/:id              # 获取反馈详情
POST   /api/feedback/:id/comments     # 添加评论
POST   /api/contact                   # 发送联系邮件
GET    /api/feature-requests          # 获取功能请求列表
POST   /api/feature-requests          # 提交功能请求
POST   /api/feature-requests/:id/vote # 投票
POST   /api/surveys                   # 提交调查问卷
```

---

## 八、前端页面补充

### 新增页面

```
/terms              # 用户协议
/privacy            # 隐私政策
/about              # 关于我们
/help               # 帮助中心
/settings/data      # 数据管理（导出、备份、统计）
/settings/feedback  # 我的反馈
/settings/account   # 账号设置（注销账号）
```

### 新增组件

```
CookieBanner        # Cookie 同意横幅
ConsentDialog       # 隐私政策同意对话框
DataExportDialog    # 数据导出对话框
AccountDeleteDialog # 账号注销对话框
FeedbackDialog      # 反馈提交对话框
FeatureVoteCard     # 功能投票卡片
```

---

## 九、实施建议

### 阶段一：法律合规（优先级最高）
**时间：1 周**

1. 实现用户协议和隐私政策页面
2. 实现用户同意管理（注册时同意、记录同意历史）
3. 实现 Cookie 横幅（如果面向欧盟用户）
4. 实现账号注销功能
5. 实现全量数据导出功能

### 阶段二：用户反馈（优先级高）
**时间：1 周**

1. 实现问题反馈系统
2. 实现联系方式页面
3. 实现帮助中心/FAQ 页面
4. 实现功能投票系统（可选）

### 阶段三：数据管理增强（优先级中）
**时间：1-2 周**

1. 实现数据使用统计
2. 实现数据备份与恢复
3. 实现数据访问日志
4. 实现存储空间管理（如果需要限制）

---

## 十、注意事项

### 法律合规
1. **隐私政策必须清晰易懂**，避免过于专业的法律术语
2. **明确说明第三方 API 调用**，用户对话内容会发送到用户配置的 LLM API
3. **用户同意记录必须保存**，以备合规审计
4. **账号注销必须真实删除数据**，不能仅标记为删除

### 技术实现
1. **数据导出要异步处理**，避免大文件导出超时
2. **账号注销设置冷静期**，防止误操作
3. **反馈系统支持截图上传**，需要文件存储服务
4. **活动日志要控制数据量**，定期归档或清理

### 用户体验
1. **隐私政策更新时通知用户**，并重新获取同意
2. **数据导出提供多种格式**，满足不同需求
3. **反馈系统要有状态更新**，让用户知道处理进度
4. **帮助中心要持续更新**，根据用户反馈补充内容

---

## 十一、总结

基于你的 AI Chat Notes 应用特点，建议优先实现以下功能：

### 必须实现（P0）
1. **用户协议** - 法律合规必需
2. **隐私政策** - 法律合规必需，尤其要说明第三方 API 调用
3. **用户同意管理** - GDPR 合规必需
4. **全量数据导出** - 用户数据权利
5. **账号注销** - GDPR "被遗忘权"
6. **问题反馈系统** - 产品改进必需
7. **联系方式** - 用户支持必需

### 推荐实现（P1）
1. **Cookie 政策与设置** - 欧盟 GDPR 要求
2. **数据使用统计** - 用户了解使用情况
3. **数据备份与恢复** - 数据安全
4. **功能投票系统** - 了解用户需求优先级
5. **帮助中心 / FAQ** - 减少支持成本

### 可选实现（P2）
1. **数据处理协议** - 企业用户可能需要
2. **存储空间管理** - 免费套餐限制
3. **用户满意度调查** - 产品改进参考

**预计总工作量：P0 约 11.5 天，P0+P1 约 21.5 天**
