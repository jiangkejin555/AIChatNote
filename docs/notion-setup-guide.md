# Notion 同步功能配置指南

本文档将指导您如何为 AI Chat Notes 项目申请并配置 Notion OAuth 凭证，以便启用“将聊天记录同步到 Notion”的功能。

## 1. 为什么需要配置？

本项目使用了 Notion 的 **OAuth 2.0 (公开集成)** 机制。当用户在应用内点击“连接 Notion”时，会被引导至 Notion 的官方授权页面。为了让 Notion 能够识别是您的应用发起的请求，并且能在授权成功后跳回到您的应用，您必须在 Notion 开发者后台注册一个自己的应用，获取专属的 `Client ID` 和 `Client Secret`。

## 2. 在 Notion 官网申请凭证

### 2.1 创建 Integration

1. 登录 [Notion My Integrations](https://www.notion.so/my-integrations)。
2. 点击左侧菜单或右上角的 **"New integration"** (新建集成) 按钮。
3. 在新建页面填写基础信息：
   - **Type (类型)**: 必须选择 **"Public integration"**。如果不选 Public，将无法获取 OAuth 必需的 Client ID，也无法设置回调地址。
   - **Name (名称)**: 填入你的应用名称（例如 `AI Chat Notes`）。这个名字会在用户授权时展示在授权界面。
   - **Logo**: （可选）上传一个应用的图标。
   - **Associated workspace**: 选择你用来管理此集成的关联工作区即可。
4. 填写完毕后，点击 **"Submit"** 保存。

### 2.2 配置权限与回调地址

创建成功后，进入该集成的详情页，依次进行以下设置：

1. **设置 API 权限 (Capabilities)**:
   - 点击左侧菜单的 **"Capabilities"**。
   - 在 **Content Capabilities** 中，确保勾选：
     - `Read content` (读取内容)
     - `Update content` (更新内容)
     - `Insert content` (插入内容)
   - 在 **User Capabilities** 中，勾选：
     - `Read user information (no email)` 即可满足需求。
   - 点击保存。

2. **设置 OAuth 域名与回调地址 (OAuth Domain & URIs)**:
   - 点击左侧菜单的 **"OAuth Domain & URIs"**。
   - 在 **Redirect URIs** 输入框中，填入前端项目处理授权回调的完整路由地址。
   - 如果你在本地开发（前端运行在 3000 端口），请填入：
     ```text
     http://localhost:3000/auth/notion/callback
     ```
   - **极其重要**：此处填写的 URL 必须与稍后在 `.env` 中配置的 `NOTION_REDIRECT_URI` 完全一致，包括尾部是否带有斜杠。

### 2.3 获取密钥

1. 点击左侧菜单的 **"Secrets & tokens"**。
2. 在该页面中，你可以看到 OAuth 所需的两个核心字段：
   - **Client ID**
   - **Client secret** (需要点击 Show 按钮查看)
3. 复制这两个字符串，准备配置到本地项目中。

---

## 3. 在后端项目中配置

拿到 Notion 凭证后，需要将它们配置到后端的环境变量中。

1. 进入项目的后端根目录 `backend/`。
2. 找到或创建一个名为 `.env` 的文件（可以参考同目录下的 `.env.example`）。
3. 将刚才复制的信息填入：

```env
# 刚才从 Notion 复制的 Client ID
NOTION_CLIENT_ID=这里填入你的_Client_ID

# 刚才从 Notion 复制的 Client Secret
NOTION_CLIENT_SECRET=这里填入你的_Client_Secret

# 必须和你在 Notion 后台填写的 Redirect URI 绝对一致
NOTION_REDIRECT_URI=http://localhost:3000/auth/notion/callback
```

## 4. 启动与测试

1. 确保 `.env` 文件保存完毕后，重新启动你的后端 Go 服务。
2. 启动前端服务，并在浏览器打开。
3. 导航至左下角的 **"设置 (Settings)"** -> **"集成 (Integrations)"**。
4. 点击 **"Connect Notion"**。
   - 预期结果：页面跳转到 Notion 官网的授权弹窗，并展示你配置的 Logo 和名称。
5. 在授权弹窗中，选择你允许该应用访问的页面（建议选择一个根页面或新建的空白页面），点击授权。
6. 授权成功后，页面会自动重定向回你的应用设置页，此时应显示“已连接 (Connected)”。
7. 在任何聊天记录中，点击“保存为笔记”并勾选“同步到 Notion”，前往 Notion 检查是否成功生成了 `AIChatNote` 父目录以及对应的笔记页面。

---

> **附：关于生产环境部署的提示**  
> 当你将应用部署到线上服务器（如域名为 `https://chat.yourdomain.com`）时，你需要：  
> 1. 回到 Notion 开发者后台，将 `Redirect URIs` 新增/修改为 `https://chat.yourdomain.com/auth/notion/callback`。  
> 2. 将服务器后端的 `.env` 中的 `NOTION_REDIRECT_URI` 同步修改为该线上地址。