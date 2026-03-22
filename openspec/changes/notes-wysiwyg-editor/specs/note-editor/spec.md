## ADDED Requirements

### Requirement: WYSIWYG Markdown 编辑

系统 SHALL 提供所见即所得的 Markdown 编辑器，用户在编辑时即可看到最终渲染效果。

#### Scenario: 编辑器加载显示内容
- **WHEN** 用户打开一个已有笔记
- **THEN** 编辑器显示笔记内容，且已渲染为最终效果（标题、加粗、列表等）

#### Scenario: Markdown 快捷语法
- **WHEN** 用户输入 `**文字**` 并按空格
- **THEN** 文字自动变为加粗效果

#### Scenario: 标题快捷输入
- **WHEN** 用户输入 `# ` 并输入标题文字
- **THEN** 文字自动渲染为一级标题样式

### Requirement: 编辑器工具栏

系统 SHALL 在编辑器顶部提供格式化工具栏。

#### Scenario: 工具栏按钮可用
- **WHEN** 编辑器加载完成
- **THEN** 工具栏显示加粗、斜体、标题、链接、代码、列表等按钮

#### Scenario: 点击加粗按钮
- **WHEN** 用户选中文本并点击加粗按钮
- **THEN** 选中文本变为加粗效果

#### Scenario: 点击标题按钮
- **WHEN** 用户点击标题下拉菜单选择"标题 2"
- **THEN** 当前行变为二级标题样式

### Requirement: 编辑器内容同步

系统 SHALL 将编辑器内容实时同步到笔记的 content 字段（Markdown 格式）。

#### Scenario: 编辑内容保存为 Markdown
- **WHEN** 用户在编辑器中编辑内容并点击保存
- **THEN** 内容以 Markdown 格式保存到数据库

### Requirement: 代码块支持

系统 SHALL 支持代码块的语法高亮显示。

#### Scenario: 插入代码块
- **WHEN** 用户输入 ``` 并选择语言
- **THEN** 编辑器显示代码块，并应用语法高亮

### Requirement: 链接支持

系统 SHALL 支持插入和编辑超链接。

#### Scenario: 插入链接
- **WHEN** 用户选中文本并点击链接按钮，输入 URL
- **THEN** 文本变为可点击的链接

#### Scenario: 编辑链接
- **WHEN** 用户点击已有链接
- **THEN** 显示链接编辑弹窗，可修改 URL
