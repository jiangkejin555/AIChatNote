## MODIFIED Requirements

### Requirement: 两栏布局

系统 SHALL 使用两栏布局显示笔记页面，左侧为笔记列表，右侧为编辑区。

#### Scenario: 两栏布局显示
- **WHEN** 用户进入知识库页面
- **THEN** 页面显示两栏：左侧笔记列表（固定宽度 288px），右侧编辑区（自适应宽度）

#### Scenario: 响应式布局
- **WHEN** 屏幕宽度小于 768px
- **THEN** 笔记列表可折叠，编辑区占满屏幕

### Requirement: 笔记列表整合

系统 SHALL 将文件夹导航、搜索、笔记列表整合到左侧边栏。

#### Scenario: 侧边栏内容
- **WHEN** 用户查看左侧边栏
- **THEN** 从上到下依次显示：搜索框、文件夹列表、新建按钮、笔记卡片列表

#### Scenario: 文件夹筛选
- **WHEN** 用户点击某个文件夹
- **THEN** 笔记列表仅显示该文件夹下的笔记

#### Scenario: 搜索笔记
- **WHEN** 用户在搜索框输入关键词
- **THEN** 笔记列表实时过滤显示匹配的笔记

## REMOVED Requirements

### Requirement: 独立标签云组件
**Reason**: 标签功能整合到编辑区，不再需要独立的标签云
**Migration**: 使用编辑区的标签选择器代替

### Requirement: 独立文件夹树组件
**Reason**: 文件夹功能整合到笔记列表顶部
**Migration**: 使用笔记列表顶部的文件夹列表代替
