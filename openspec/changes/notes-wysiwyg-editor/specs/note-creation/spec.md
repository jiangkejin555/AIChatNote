## ADDED Requirements

### Requirement: 新建笔记入口

系统 SHALL 在笔记列表顶部提供"新建笔记"按钮。

#### Scenario: 显示新建按钮
- **WHEN** 用户进入知识库页面
- **THEN** 笔记列表顶部显示"+"或"新建笔记"按钮

#### Scenario: 点击新建按钮
- **WHEN** 用户点击新建笔记按钮
- **THEN** 创建一个新的空白笔记并自动选中

### Requirement: 文件夹归属

系统 SHALL 根据当前选中的文件夹自动设置新笔记的归属。

#### Scenario: 选中文件夹时创建笔记
- **WHEN** 用户选中"文件夹 A"后点击新建笔记
- **THEN** 新笔记的 folder_id 自动设置为"文件夹 A"的 ID

#### Scenario: 未选中文件夹时创建笔记
- **WHEN** 用户未选中任何文件夹（显示全部笔记）时点击新建笔记
- **THEN** 新笔记的 folder_id 为 null（归属根目录）

### Requirement: 新笔记初始状态

系统 SHALL 为新笔记设置合理的初始值。

#### Scenario: 新笔记初始内容
- **WHEN** 创建新笔记
- **THEN** 笔记标题为空，内容为空，标签为空

#### Scenario: 新笔记自动进入编辑状态
- **WHEN** 创建新笔记成功
- **THEN** 自动选中该笔记，编辑器聚焦到标题输入框

### Requirement: 标题编辑

系统 SHALL 允许用户编辑笔记标题，标题即为笔记显示名称。

#### Scenario: 编辑标题
- **WHEN** 用户在标题输入框中输入文字
- **THEN** 标题实时更新

#### Scenario: 标题同步到列表
- **WHEN** 用户保存笔记
- **THEN** 笔记列表中显示更新后的标题

#### Scenario: 空标题处理
- **WHEN** 用户保存标题为空的笔记
- **THEN** 自动生成默认标题"无标题笔记"或显示"未命名"

### Requirement: 标签选择

系统 SHALL 提供标签选择器，允许用户为笔记添加标签。

#### Scenario: 添加标签
- **WHEN** 用户点击"添加标签"按钮并输入新标签
- **THEN** 标签添加到笔记的标签列表

#### Scenario: 选择已有标签
- **WHEN** 用户点击标签输入框
- **THEN** 显示已有标签列表供选择

#### Scenario: 移除标签
- **WHEN** 用户点击标签旁的"×"按钮
- **THEN** 该标签从笔记中移除
