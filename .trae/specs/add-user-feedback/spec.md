# 关于我们页面 Spec

## Why

当前应用缺少用户了解产品和反馈问题的统一入口。需要添加"关于我们"页面，整合帮助文档、用户反馈和版本信息，为用户提供完整的产品支持体验。

## What Changes

- 新增"关于我们"页面 `/about`，包含产品介绍和三个功能模块
- 新增"帮助"模块，展示产品功能介绍和使用方法
- 新增"反馈"模块，包含用户满意度、问题反馈、功能投票三个子功能
- 新增"版本"模块，展示当前版本和历史版本迭代信息
- 在侧边栏用户菜单添加"关于我们"入口

## Impact

- Affected specs: 无
- Affected code:
  - 前端: 新增 `frontend/src/app/(main)/about/` 页面及相关组件
  - 前端: `frontend/src/components/layout/sidebar.tsx` 添加菜单入口
  - 后端: 需新增反馈相关 API 和数据库表
  - 国际化: `frontend/src/messages/zh.json`, `frontend/src/messages/en.json`

## ADDED Requirements

### Requirement: 关于我们页面

系统应提供"关于我们"页面，作为用户了解产品和反馈问题的统一入口。

#### Scenario: 用户访问关于我们页面
- **WHEN** 用户点击侧边栏用户菜单中的"关于我们"
- **THEN** 系统跳转到 `/about` 页面
- **AND** 页面顶部显示产品简介
- **AND** 页面下方显示三个功能模块入口：帮助、反馈、版本

### Requirement: 帮助模块

系统应提供帮助文档，展示产品功能介绍和使用方法。

#### Scenario: 用户查看帮助文档
- **WHEN** 用户在关于我们页面点击"帮助"模块
- **THEN** 系统显示帮助详情页面
- **AND** 页面包含产品核心功能介绍
- **AND** 页面包含各功能的使用方法说明

#### Scenario: 帮助内容结构
- **GIVEN** 帮助文档包含以下章节
- **THEN** 显示以下内容：
  - 产品概述：AI Chat Notes 是什么
  - 核心功能：多模型聊天、笔记保存、知识库管理
  - 快速入门：如何配置模型、开始对话、保存笔记
  - 常见问题：FAQ 列表

### Requirement: 用户满意度调查

系统应提供用户满意度调查功能，允许用户对产品体验进行评分。

#### Scenario: 用户提交满意度评分
- **WHEN** 用户在反馈模块点击满意度评分
- **THEN** 系统显示 1-5 星评分选项，用户选择后保存评分
- **AND** 用户可以添加可选的文字说明
- **AND** 系统记录评分时间、用户 ID 和评分内容

#### Scenario: 用户修改满意度评分
- **WHEN** 用户已提交过满意度评分，再次进入满意度页面
- **THEN** 系统显示用户之前的评分，允许用户修改

### Requirement: 问题反馈

系统应提供问题反馈功能，允许用户提交 Bug 报告或改进建议。

#### Scenario: 用户提交问题反馈
- **WHEN** 用户在反馈模块点击提交反馈
- **THEN** 系统显示反馈表单，包含：
  - 反馈类型选择（Bug 报告 / 功能建议 / 其他）
  - 标题输入框
  - 详细描述输入框
  - 可选的联系方式
- **AND** 用户提交后系统保存反馈记录

#### Scenario: 用户查看历史反馈
- **WHEN** 用户进入反馈模块
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

### Requirement: 版本信息

系统应提供版本信息展示功能。

#### Scenario: 用户查看版本信息
- **WHEN** 用户在关于我们页面点击"版本"模块
- **THEN** 系统显示版本详情页面
- **AND** 页面顶部显示当前版本号和发布日期
- **AND** 页面下方显示历史版本迭代记录

#### Scenario: 版本记录格式
- **GIVEN** 每个版本记录包含以下信息
- **THEN** 显示：
  - 版本号（如 v1.0.0）
  - 发布日期
  - 更新内容列表（新增功能、优化项、修复问题）

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
    UNIQUE(user_id)
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
    UNIQUE(user_id, feature_id)
);

CREATE INDEX idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX idx_feature_votes_user_id ON feature_votes(user_id);
```

### versions 表（版本记录）

```sql
CREATE TABLE versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    release_date DATE NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API 设计

### 满意度相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/feedback/satisfaction | 获取当前用户的满意度评分 |
| POST | /api/feedback/satisfaction | 提交/更新满意度评分 |

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

### 版本相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/versions | 获取版本列表 |
| GET | /api/versions/current | 获取当前版本信息 |

## 前端页面设计

### 关于我们主页面

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🤖 AI Chat Notes                             │
│                                                                 │
│           聊天即生产，对话即沉淀                                   │
│                                                                 │
│    AI Chat Notes 是一个聚合多模型的 AI 聊天应用，                  │
│    支持将对话转化为结构化笔记，帮助您沉淀知识。                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │     📖      │  │     💬      │  │     📦      │            │
│   │    帮助     │  │    反馈     │  │    版本     │            │
│   │             │  │             │  │             │            │
│   │  了解产品   │  │  提交反馈   │  │  版本记录   │            │
│   │  使用方法   │  │  功能投票   │  │  更新日志   │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 帮助详情页面

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                              帮助中心                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 产品概述                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  AI Chat Notes 是一个聚合多模型的 AI 聊天应用...                  │
│                                                                 │
│  🚀 核心功能                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  • 多模型聊天 - 支持 OpenAI、Claude、DeepSeek 等多种模型          │
│  • 笔记保存 - 将对话转化为结构化笔记                              │
│  • 知识库管理 - 文件夹分类、标签筛选、全文搜索                     │
│                                                                 │
│  📝 快速入门                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  1. 配置模型：进入模型管理，添加您的 API Key                      │
│  2. 开始对话：选择模型，输入问题开始聊天                          │
│  3. 保存笔记：点击"保存为笔记"，AI 自动总结                       │
│                                                                 │
│  ❓ 常见问题                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  Q: 如何添加新的 AI 模型？                                       │
│  A: 进入模型管理页面，点击添加提供商...                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 反馈详情页面

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                              意见反馈                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⭐ 满意度评分                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  您对我们产品的整体满意度如何？                                   │
│                                                                 │
│  ⭐⭐⭐⭐⭐                                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 有什么想说的？（可选）                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [提交评分]                                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 问题反馈                                      [提交反馈]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  您的反馈记录 (2)                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Bug 报告 - 导出功能异常                    [待处理]      │   │
│  │ 2024-03-20                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🗳️ 功能投票                                                    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 导出 PDF 功能                                  👍 128   │   │
│  │ 支持将笔记导出为 PDF 格式                     [计划中]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AI 对话语音朗读                                👍 89    │   │
│  │ 支持 TTS 朗读 AI 回复内容                    [开发中]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 版本详情页面

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                              版本信息                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  当前版本                                                        │
│  ─────────────────────────────────────────────────────────────  │
│  v1.0.0                                                         │
│  发布日期：2024-03-20                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  历史版本                                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  v1.0.0 - 2024-03-20                                            │
│  ✨ 新增：多模型聚合聊天功能                                      │
│  ✨ 新增：笔记保存和管理                                          │
│  ✨ 新增：知识库文件夹和标签分类                                   │
│  🐛 修复：若干已知问题                                           │
│                                                                 │
│  v0.9.0 - 2024-03-01                                            │
│  ✨ 新增：用户认证系统                                            │
│  ✨ 新增：模型配置管理                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 侧边栏菜单更新

在侧边栏用户菜单中添加"关于我们"入口：

```
┌─────────────────┐
│ 👤 user@ex... ▲ │
└─────────────────┘
        ↓
┌─────────────────┐
│ ⚙️ 设置         │
│ ℹ️ 关于我们     │  ← 新增
│ ─────────────── │
│ 🚪 退出登录     │
└─────────────────┘
```

## 国际化

需要在 `zh.json` 和 `en.json` 中添加以下翻译键：

```json
{
  "about": {
    "title": "关于我们",
    "productIntro": "AI Chat Notes 是一个聚合多模型的 AI 聊天应用，支持将对话转化为结构化笔记，帮助您沉淀知识。",
    "tagline": "聊天即生产，对话即沉淀",
    "help": {
      "title": "帮助",
      "description": "了解产品使用方法",
      "overview": "产品概述",
      "features": "核心功能",
      "quickStart": "快速入门",
      "faq": "常见问题"
    },
    "feedback": {
      "title": "反馈",
      "description": "提交问题和建议",
      "satisfaction": "满意度评分",
      "satisfactionDesc": "您对我们产品的整体满意度如何？",
      "submitFeedback": "提交反馈",
      "feedbackHistory": "反馈记录",
      "featureVoting": "功能投票",
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
    },
    "version": {
      "title": "版本",
      "description": "查看版本更新记录",
      "currentVersion": "当前版本",
      "releaseDate": "发布日期",
      "history": "历史版本",
      "newFeature": "新增",
      "improvement": "优化",
      "bugFix": "修复"
    }
  }
}
```
