# Checklist

## 后端验证

- [x] satisfaction_ratings 表创建成功，包含正确的约束和索引
- [x] feedbacks 表创建成功，包含正确的约束和索引
- [x] feature_requests 和 feature_votes 表创建成功，包含正确的约束和索引
- [x] versions 表创建成功，包含正确的约束和索引
- [x] GET /api/feedback/satisfaction 返回当前用户评分
- [x] POST /api/feedback/satisfaction 正确保存或更新评分
- [x] GET /api/feedbacks 返回当前用户的反馈列表
- [x] POST /api/feedbacks 正确创建新反馈
- [x] GET /api/feedbacks/:id 返回反馈详情
- [x] PUT /api/feedbacks/:id 正确更新反馈（仅待处理状态）
- [x] GET /api/features 返回功能列表及投票状态
- [x] POST /api/features/:id/vote 正确记录投票
- [x] DELETE /api/features/:id/vote 正确取消投票
- [x] GET /api/versions 返回版本列表
- [x] GET /api/versions/current 返回当前版本信息

## 前端验证

### 国际化
- [x] zh.json 包含所有关于我们相关翻译键
- [x] en.json 包含所有关于我们相关翻译键

### 关于我们主页面
- [x] /about 页面路由正确配置
- [x] 页面顶部正确显示产品介绍和标语
- [x] 三个功能模块入口卡片正确显示（帮助、反馈、版本）
- [x] 点击卡片正确跳转到对应子页面

### 帮助页面
- [x] /about/help 页面正确显示
- [x] 产品概述内容完整
- [x] 核心功能介绍清晰
- [x] 快速入门指南步骤明确
- [x] 常见问题 FAQ 列表完整

### 反馈页面
- [x] /about/feedback 页面正确显示
- [x] 满意度评分组件正确显示 1-5 星评分
- [x] 满意度评分组件支持选择和保存评分
- [x] 反馈对话框包含类型选择、标题、描述、联系方式字段
- [x] 反馈对话框提交后正确调用 API
- [x] 反馈历史列表正确显示用户历史反馈
- [x] 功能投票组件正确显示功能列表
- [x] 功能投票组件显示投票数和用户投票状态
- [x] 功能投票组件支持投票和取消投票

### 版本页面
- [x] /about/version 页面正确显示
- [x] 当前版本信息正确展示
- [x] 历史版本列表正确展示
- [x] 版本更新内容格式化正确

### 侧边栏菜单
- [x] 用户菜单包含"关于我们"选项
- [x] 点击"关于我们"正确跳转到 /about 页面

## 用户体验验证

- [x] 满意度评分支持修改
- [x] 反馈提交后显示成功提示
- [x] 功能投票后即时更新投票数
- [x] 所有交互支持中英文切换
- [ ] 移动端布局正确显示（需手动测试）
- [ ] 深色模式下样式正确（需手动测试）
- [x] 子页面返回按钮正常工作
