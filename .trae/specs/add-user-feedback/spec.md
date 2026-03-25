# 用户反馈功能 Spec

## Why

当前应用缺少用户反馈渠道，无法了解用户使用体验和需求。需要添加用户反馈功能，帮助收集用户满意度、问题反馈和功能需求，以便持续改进产品。

## What Changes

- 新增用户满意度调查功能，支持用户对整体体验进行评分
- 新增问题反馈功能，允许用户提交 Bug 报告或改进建议
- 新增功能投票功能，让用户对计划中的功能进行投票，帮助规划产品路线
- 在设置页面添加反馈入口
- 在侧边栏用户菜单添加快捷反馈入口

## Impact

- Affected specs: 无
- Affected code:
  - 前端: `frontend/src/app/(main)/settings/page.tsx`, `frontend/src/components/layout/sidebar.tsx`
  - 后端: 需新增反馈相关 API 和数据库表
  - 国际化: `frontend/src/messages/zh.json`, `frontend/src/messages/en.json`

## ADDED Requirements

### Requirement: 用户满意度调查

系统应提供用户满意度调查功能，允许用户对产品体验进行评分。

#### Scenario: 用户提交满意度评分
- **WHEN** 用户在设置页面点击满意度评分
- **THEN** 系统显示 1-5 星评分选项，用户选择后保存评分
- **AND** 用户可以添加可选的文字说明
- **AND** 系统记录评分时间、用户 ID 和评分内容

#### Scenario: 用户修改满意度评分
- **WHEN** 用户已提交过满意度评分，再次进入满意度页面
- **THEN** 系统显示用户之前的评分，允许用户修改

### Requirement: 问题反馈

系统应提供问题反馈功能，允许用户提交 Bug 报告或改进建议。

#### Scenario: 用户提交问题反馈
- **WHEN** 用户在设置页面点击提交反馈
- **THEN** 系统显示反馈表单，包含：
  - 反馈类型选择（Bug 报告 / 功能建议 / 其他）
  - 标题输入框
  - 详细描述输入框
  - 可选的联系方式
- **AND** 用户提交后系统保存反馈记录

#### Scenario: 用户查看历史反馈
- **WHEN** 用户进入反馈页面
- **THEN** 系统显示用户提交过的反馈列表，包含状态（待处理 / 处理中 / 已解决）

### Requirement: 功能投票

系统应提供功能投票功能，让用户对计划中的功能进行投票。

#### Scenario: 用户浏览可投票功能
- **WHEN** 用户进入功能投票页面
- **THEN** 系统显示功能列表，每个功能包含：
  - 功能名称和描述
  - 当前投票数
  - 用户是否已投票

#### Scenario: 用户投票
- **WHEN** 用户点击某个功能的投票按钮
- **THEN** 系统记录用户投票，更新投票数
- **AND** 用户可以取消投票

#### Scenario: 管理员管理功能列表
- **WHEN** 管理员添加新功能到投票列表
- **THEN** 新功能对所有用户可见
- **AND** 管理员可以标记功能状态（计划中 / 开发中 / 已上线）

## 数据模型设计

### satisfaction_ratings 表（满意度评分）

```sql
CREATE TABLE satisfaction_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)  -- 每个用户只有一条评分记录
);
```

### feedbacks 表（问题反馈）

```sql
CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
```

### feature_votes 表（功能投票）

```sql
CREATE TABLE feature_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_id INTEGER NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_id)  -- 每个用户对每个功能只能投一票
);

CREATE INDEX idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX idx_feature_votes_user_id ON feature_votes(user_id);
```

## API 设计

### 满意度相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/feedback/satisfaction | 获取当前用户的满意度评分 |
| POST | /api/feedback/satisfaction | 提交/更新满意度评分 |
| GET | /api/feedback/satisfaction/stats | 获取满意度统计（管理员） |

### 问题反馈相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/feedbacks | 获取当前用户的反馈列表 |
| POST | /api/feedbacks | 提交新反馈 |
| GET | /api/feedbacks/:id | 获取反馈详情 |
| PUT | /api/feedbacks/:id | 更新反馈（仅限待处理状态） |

### 功能投票相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/features | 获取功能列表（含投票数和用户投票状态） |
| POST | /api/features/:id/vote | 为功能投票 |
| DELETE | /api/features/:id/vote | 取消投票 |

## 前端页面设计

### 设置页面新增反馈 Section

在现有设置页面底部新增"反馈"区域，包含：

```
┌─────────────────────────────────────────────┐
│  ⚙️ 设置                                    │
├─────────────────────────────────────────────┤
│  ... 现有设置项 ...                          │
├─────────────────────────────────────────────┤
│  📝 反馈                                     │
│                                             │
│  满意度评分                                  │
│  ⭐⭐⭐⭐⭐  [修改评分]                        │
│                                             │
│  问题反馈                    [提交反馈]      │
│  您有 2 条反馈记录                           │
│                                             │
│  功能投票                    [查看功能]      │
│  已投票 3 个功能                             │
└─────────────────────────────────────────────┘
```

### 反馈对话框

点击"提交反馈"弹出对话框：

```
┌─────────────────────────────────────────────┐
│  提交反馈                              ✕    │
├─────────────────────────────────────────────┤
│                                             │
│  反馈类型                                    │
│  ○ Bug 报告  ○ 功能建议  ○ 其他             │
│                                             │
│  标题                                        │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  详细描述                                    │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  联系方式（可选）                            │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              取消        提交反馈            │
└─────────────────────────────────────────────┘
```

### 功能投票页面

可设计为独立页面或对话框：

```
┌─────────────────────────────────────────────┐
│  功能投票                              ✕    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 🗳️ 导出 PDF 功能              👍 128  │ │
│  │ 支持将笔记导出为 PDF 格式              │ │
│  │ 状态: 计划中                          │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 🗳️ AI 对话语音朗读            👍 89   │ │
│  │ 支持 TTS 朗读 AI 回复内容              │ │
│  │ 状态: 开发中                          │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 🗳️ 笔记分享功能              👍 56   │ │
│  │ 支持生成分享链接，让他人查看笔记        │ │
│  │ 状态: 计划中                          │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

## 放置位置分析

### 推荐方案：设置页面 + 侧边栏快捷入口

**理由：**

1. **设置页面** - 符合用户心智模型
   - 用户习惯在设置页面寻找"帮助"、"反馈"、"关于"等系统级功能
   - 当前设置页面空间充足，可以容纳新的反馈 section
   - 与现有设置项（主题、语言）风格一致

2. **侧边栏用户菜单** - 提供快捷入口
   - 用户菜单已有"设置"和"登出"选项
   - 添加"反馈"入口可提高功能发现率
   - 点击后跳转到设置页面的反馈区域

### 备选方案（不推荐）

| 位置 | 优点 | 缺点 |
|------|------|------|
| 独立页面 `/feedback` | 功能独立完整 | 入口深，用户难以发现 |
| 主聊天页面悬浮按钮 | 入口明显 | 干扰用户聊天体验 |
| Header 右侧 | 全局可见 | Header 已有主题切换和用户菜单，空间有限 |

## 国际化

需要在 `zh.json` 和 `en.json` 中添加以下翻译键：

```json
{
  "feedback": {
    "title": "反馈",
    "satisfaction": "满意度评分",
    "satisfactionDesc": "您对我们产品的整体满意度如何？",
    "submitFeedback": "提交反馈",
    "feedbackHistory": "反馈记录",
    "featureVoting": "功能投票",
    "votedFeatures": "已投票功能",
    "bugReport": "Bug 报告",
    "featureSuggestion": "功能建议",
    "other": "其他",
    "feedbackType": "反馈类型",
    "title_placeholder": "请输入标题",
    "description_placeholder": "请详细描述您的问题或建议",
    "contact_placeholder": "选填，方便我们联系您",
    "submit": "提交",
    "cancel": "取消",
    "vote": "投票",
    "unvote": "取消投票",
    "votes": "票",
    "status": {
      "pending": "待处理",
      "in_progress": "处理中",
      "resolved": "已解决",
      "closed": "已关闭"
    },
    "featureStatus": {
      "planned": "计划中",
      "in_progress": "开发中",
      "completed": "已上线"
    }
  }
}
```
