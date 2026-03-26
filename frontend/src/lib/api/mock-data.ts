import type { Provider, ProviderModel, AvailableModel, Note, Folder, Tag, Conversation, Message } from '@/types'

// Mock notes data
export const MOCK_NOTES: Note[] = [
  {
    id: 1,
    user_id: 1,
    folder_id: 1,
    title: 'React Hooks 学习笔记',
    content: '<h2>React Hooks 入门</h2><p>React Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用状态和其他 React 特性。</p><h3>常用的 Hooks</h3><ul><li><strong>useState</strong>: 状态管理</li><li><strong>useEffect</strong>: 副作用处理</li><li><strong>useContext</strong>: 上下文访问</li></ul><pre><code>const [count, setCount] = useState(0);</code></pre>',
    tags: ['React', '前端', '学习'],
    source_conversation_id: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    folder_id: 1,
    title: 'TypeScript 类型体操',
    content: '<h2>TypeScript 高级类型</h2><p>TypeScript 提供了强大的类型系统，可以实现复杂的类型推导。</p><h3>常用技巧</h3><ul><li>条件类型</li><li>映射类型</li><li>模板字面量类型</li></ul>',
    tags: ['TypeScript', '前端'],
    source_conversation_id: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    folder_id: 2,
    title: '项目开发计划',
    content: '<h2>本周任务</h2><ol><li>完成用户认证模块</li><li>实现笔记 CRUD</li><li>添加搜索功能</li></ol><h3>下周计划</h3><p>开始开发 AI 对话功能。</p>',
    tags: ['计划', '项目'],
    source_conversation_id: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
]

export const MOCK_FOLDERS: Folder[] = [
  {
    id: 1,
    user_id: 1,
    name: '技术笔记',
    parent_id: null,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    name: '项目文档',
    parent_id: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

export const MOCK_TAGS: Tag[] = [
  { name: 'React', count: 1 },
  { name: '前端', count: 2 },
  { name: '学习', count: 1 },
  { name: 'TypeScript', count: 1 },
  { name: '计划', count: 1 },
  { name: '项目', count: 1 },
]

// In-memory store for mock data
let mockNotes: Note[] = [...MOCK_NOTES]
let mockFolders: Folder[] = [...MOCK_FOLDERS]
let nextNoteId = 4
let nextFolderId = 3

// Mock provider data
export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'OpenAI (个人)',
    type: 'openai',
    api_base: 'https://api.openai.com/v1',
    models: [
      {
        id: '1-1',
        provider_id: '1',
        model_id: 'gpt-4o',
        display_name: 'GPT-4o',
        is_default: true,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '1-2',
        provider_id: '1',
        model_id: 'gpt-4o-mini',
        display_name: 'GPT-4o Mini',
        is_default: false,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: '火山引擎',
    type: 'volcengine',
    api_base: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      {
        id: '2-1',
        provider_id: '2',
        model_id: 'doubao-pro-32k',
        display_name: 'Doubao Pro 32K',
        is_default: true,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock available models from API
export const MOCK_AVAILABLE_MODELS: Record<string, AvailableModel[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', owned_by: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', owned_by: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', owned_by: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', owned_by: 'openai' },
    { id: 'o1-preview', name: 'o1 Preview', owned_by: 'openai' },
    { id: 'o1-mini', name: 'o1 Mini', owned_by: 'openai' },
  ],
  volcengine: [
    { id: 'doubao-pro-32k', name: 'Doubao Pro 32K', owned_by: 'bytedance' },
    { id: 'doubao-pro-128k', name: 'Doubao Pro 128K', owned_by: 'bytedance' },
    { id: 'doubao-lite-32k', name: 'Doubao Lite 32K', owned_by: 'bytedance' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', owned_by: 'deepseek' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', owned_by: 'deepseek' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', owned_by: 'anthropic' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', owned_by: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', owned_by: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', owned_by: 'anthropic' },
  ],
  google: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', owned_by: 'google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', owned_by: 'google' },
    { id: 'gemini-pro', name: 'Gemini Pro', owned_by: 'google' },
  ],
  moonshot: [
    { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', owned_by: 'moonshot' },
    { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', owned_by: 'moonshot' },
    { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', owned_by: 'moonshot' },
  ],
  zhipu: [
    { id: 'glm-4-plus', name: 'GLM-4 Plus', owned_by: 'zhipu' },
    { id: 'glm-4', name: 'GLM-4', owned_by: 'zhipu' },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', owned_by: 'zhipu' },
  ],
  custom: [],
}

// In-memory store for mock data (simulates database)
let mockProviders: Provider[] = [...MOCK_PROVIDERS]
let nextProviderId = 3
let nextModelId = 10

// Helper to simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API functions
export const mockProvidersApi = {
  getAll: async (): Promise<Provider[]> => {
    await delay()
    return [...mockProviders]
  },

  getById: async (id: string): Promise<Provider> => {
    await delay()
    const provider = mockProviders.find(p => p.id === id)
    if (!provider) throw new Error('Provider not found')
    return { ...provider }
  },

  create: async (data: { name: string; type: string; api_base: string; api_key: string }): Promise<Provider> => {
    await delay()
    const newProvider: Provider = {
      id: String(nextProviderId++),
      name: data.name,
      type: data.type as any,
      api_base: data.api_base,
      models: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockProviders.push(newProvider)
    return { ...newProvider }
  },

  update: async (id: string, data: { name?: string; api_base?: string; api_key?: string }): Promise<Provider> => {
    await delay()
    const index = mockProviders.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Provider not found')
    mockProviders[index] = {
      ...mockProviders[index],
      ...(data.name && { name: data.name }),
      ...(data.api_base && { api_base: data.api_base }),
      updated_at: new Date().toISOString(),
    }
    return { ...mockProviders[index] }
  },

  delete: async (id: string): Promise<void> => {
    await delay()
    const index = mockProviders.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Provider not found')
    mockProviders.splice(index, 1)
  },

  getAvailableModels: async (id: string): Promise<{ models: AvailableModel[]; isPredefined: boolean }> => {
    await delay(500)
    const provider = mockProviders.find(p => p.id === id)
    if (!provider) throw new Error('Provider not found')

    const models = MOCK_AVAILABLE_MODELS[provider.type] || []
    return { models, isPredefined: provider.type === 'anthropic' }
  },
}

export const mockProviderModelsApi = {
  getAll: async (providerId: string): Promise<ProviderModel[]> => {
    await delay()
    const provider = mockProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')
    return [...provider.models]
  },

  add: async (providerId: string, data: { model_id: string; display_name?: string; is_default?: boolean }): Promise<ProviderModel> => {
    await delay()
    const provider = mockProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')

    // If setting as default, remove default from others
    if (data.is_default) {
      provider.models.forEach(m => m.is_default = false)
    }

    const newModel: ProviderModel = {
      id: `${providerId}-${nextModelId++}`,
      provider_id: providerId,
      model_id: data.model_id,
      display_name: data.display_name || data.model_id,
      is_default: data.is_default || false,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    provider.models.push(newModel)
    return { ...newModel }
  },

  update: async (providerId: string, modelId: string, data: { display_name?: string; is_default?: boolean; enabled?: boolean }): Promise<ProviderModel> => {
    await delay()
    const provider = mockProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')

    const modelIndex = provider.models.findIndex(m => m.id === modelId)
    if (modelIndex === -1) throw new Error('Model not found')

    // If setting as default, remove default from others
    if (data.is_default) {
      provider.models.forEach(m => m.is_default = false)
    }

    provider.models[modelIndex] = {
      ...provider.models[modelIndex],
      ...(data.display_name !== undefined && { display_name: data.display_name }),
      ...(data.is_default !== undefined && { is_default: data.is_default }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      updated_at: new Date().toISOString(),
    }
    return { ...provider.models[modelIndex] }
  },

  delete: async (providerId: string, modelId: string): Promise<void> => {
    await delay()
    const provider = mockProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')

    const modelIndex = provider.models.findIndex(m => m.id === modelId)
    if (modelIndex === -1) throw new Error('Model not found')
    provider.models.splice(modelIndex, 1)
  },

  batchAdd: async (providerId: string, data: { models: { model_id: string; display_name?: string }[]; default_model_id?: string }): Promise<ProviderModel[]> => {
    await delay()
    const provider = mockProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')

    const newModels: ProviderModel[] = []

    for (const modelData of data.models) {
      const newModel: ProviderModel = {
        id: `${providerId}-${nextModelId++}`,
        provider_id: providerId,
        model_id: modelData.model_id,
        display_name: modelData.display_name || modelData.model_id,
        is_default: data.default_model_id === modelData.model_id,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      provider.models.push(newModel)
      newModels.push(newModel)
    }

    return newModels
  },
}

// Mock connection test - simulates testing API connectivity
export const mockTestConnection = async (
  providerId: string,
  modelId?: string
): Promise<{ success: boolean; message: string; latency?: number }> => {
  await delay(800 + Math.random() * 1200) // 800-2000ms delay

  const provider = mockProviders.find(p => p.id === providerId)
  if (!provider) {
    return { success: false, message: '提供商不存在' }
  }

  // Simulate random success/failure (80% success rate)
  const isSuccess = Math.random() > 0.2

  if (isSuccess) {
    const latency = Math.floor(100 + Math.random() * 400) // 100-500ms
    return {
      success: true,
      message: `连接成功${modelId ? ` - ${modelId}` : ''}`,
      latency,
    }
  } else {
    const errors = [
      'API Key 无效',
      '网络连接超时',
      'API 服务暂时不可用',
      '请求频率超限',
    ]
    return {
      success: false,
      message: errors[Math.floor(Math.random() * errors.length)],
    }
  }
}

// Reset mock data (useful for testing)
export const resetMockData = () => {
  mockProviders = [...MOCK_PROVIDERS]
  mockNotes = [...MOCK_NOTES]
  mockFolders = [...MOCK_FOLDERS]
  nextProviderId = 3
  nextModelId = 10
  nextNoteId = 4
  nextFolderId = 3
}

// ============ Notes Mock API ============
export const mockNotesApi = {
  getAll: async (params?: { folder_id?: number; tag?: string; search?: string }): Promise<Note[]> => {
    await delay()
    let result = [...mockNotes]

    if (params?.folder_id !== undefined) {
      result = result.filter(n => n.folder_id === params.folder_id)
    }
    if (params?.tag) {
      result = result.filter(n => n.tags.includes(params.tag!))
    }
    if (params?.search) {
      const search = params.search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search)
      )
    }

    return result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  },

  getById: async (id: number): Promise<Note> => {
    await delay()
    const note = mockNotes.find(n => n.id === id)
    if (!note) throw new Error('Note not found')
    return { ...note }
  },

  create: async (data: { title: string; content: string; tags?: string[]; folder_id?: number }): Promise<Note> => {
    await delay()
    const newNote: Note = {
      id: nextNoteId++,
      user_id: 1,
      folder_id: data.folder_id ?? null,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      source_conversation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockNotes.unshift(newNote)
    return { ...newNote }
  },

  update: async (id: number, data: { title?: string; content?: string; tags?: string[]; folder_id?: number }): Promise<Note> => {
    await delay()
    const index = mockNotes.findIndex(n => n.id === id)
    if (index === -1) throw new Error('Note not found')

    mockNotes[index] = {
      ...mockNotes[index],
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.folder_id !== undefined && { folder_id: data.folder_id }),
      updated_at: new Date().toISOString(),
    }
    return { ...mockNotes[index] }
  },

  delete: async (id: number): Promise<void> => {
    await delay()
    const index = mockNotes.findIndex(n => n.id === id)
    if (index === -1) throw new Error('Note not found')
    mockNotes.splice(index, 1)
  },

  // New mock API functions for redesign
  importMarkdown: async (file: File, folderId?: number): Promise<Note> => {
    await delay()
    const content = await file.text()

    // Extract title from first # heading
    const headingMatch = content.match(/^#\s+(.+)$/m)
    const title = headingMatch ? headingMatch[1].trim() : file.name.replace(/\.md$/, '')

    const newNote: Note = {
      id: nextNoteId++,
      user_id: 1,
      folder_id: folderId ?? null,
      title,
      content,
      tags: [],
      source_conversation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockNotes.unshift(newNote)
    return { ...newNote }
  },

  batchDeleteNotes: async (ids: number[]): Promise<void> => {
    await delay()
    mockNotes = mockNotes.filter(n => !ids.includes(n.id))
  },

  batchMoveNotes: async (ids: number[], targetFolderId: number | null): Promise<void> => {
    await delay()
    mockNotes = mockNotes.map(n =>
      ids.includes(n.id) ? { ...n, folder_id: targetFolderId, updated_at: new Date().toISOString() } : n
    )
  },

  copyNote: async (id: number): Promise<Note> => {
    await delay()
    const note = mockNotes.find(n => n.id === id)
    if (!note) throw new Error('Note not found')

    const newNote: Note = {
      ...note,
      id: nextNoteId++,
      title: `${note.title} - Copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockNotes.unshift(newNote)
    return { ...newNote }
  },
}

// ============ Folders Mock API ============
export const mockFoldersApi = {
  getAll: async (): Promise<Folder[]> => {
    await delay()
    return [...mockFolders]
  },

  create: async (data: { name: string; parent_id?: number }): Promise<Folder> => {
    await delay()
    const newFolder: Folder = {
      id: nextFolderId++,
      user_id: 1,
      name: data.name,
      parent_id: data.parent_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockFolders.push(newFolder)
    return { ...newFolder }
  },

  update: async (id: number, data: { name?: string; parent_id?: number }): Promise<Folder> => {
    await delay()
    const index = mockFolders.findIndex(f => f.id === id)
    if (index === -1) throw new Error('Folder not found')

    mockFolders[index] = {
      ...mockFolders[index],
      ...(data.name !== undefined && { name: data.name }),
      ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      updated_at: new Date().toISOString(),
    }
    return { ...mockFolders[index] }
  },

  delete: async (id: number): Promise<void> => {
    await delay()
    const index = mockFolders.findIndex(f => f.id === id)
    if (index === -1) throw new Error('Folder not found')
    mockFolders.splice(index, 1)
    // Move notes in this folder to root
    mockNotes.forEach(n => {
      if (n.folder_id === id) n.folder_id = null
    })
  },

  // New mock API function for redesign
  copyFolder: async (id: number): Promise<Folder> => {
    await delay()
    const folder = mockFolders.find(f => f.id === id)
    if (!folder) throw new Error('Folder not found')

    const newFolder: Folder = {
      id: nextFolderId++,
      user_id: folder.user_id,
      name: `${folder.name} - Copy`,
      parent_id: folder.parent_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockFolders.push(newFolder)

    // Copy all notes in this folder
    const notesInFolder = mockNotes.filter(n => n.folder_id === id)
    for (const note of notesInFolder) {
      const newNote: Note = {
        ...note,
        id: nextNoteId++,
        folder_id: newFolder.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockNotes.unshift(newNote)
    }

    return { ...newFolder }
  },
}

// ============ Tags Mock API ============
export const mockTagsApi = {
  getAll: async (): Promise<Tag[]> => {
    await delay()
    // Calculate tag counts from current notes
    const tagCounts = new Map<string, number>()
    mockNotes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  },
}

// ============ Conversations Mock Data ============
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    user_id: 1,
    current_provider_model_id: '1-1',
    model_id: 'deepseek-chat',
    title: 'Markdown 格式测试',
    is_saved: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    current_provider_model_id: '1-1',
    model_id: 'deepseek-chat',
    title: '如何学习 React',
    is_saved: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    current_provider_model_id: '1-1',
    model_id: 'deepseek-chat',
    title: 'TypeScript 类型体操',
    is_saved: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
]

// Comprehensive markdown test content
const MARKDOWN_TEST_CONTENT = `# 这是一级标题

这是一段普通的文本，包含 **加粗文本**、*斜体文本* 和 \`行内代码\`。

## 这是二级标题

### 这是三级标题

#### 这是四级标题

---

## 列表演示

### 无序列表
- 第一项
- 第二项
- 第三项

### 有序列表
1. 步骤一：安装依赖
2. 步骤二：配置环境
3. 步骤三：启动项目

---

## 代码块演示

### JavaScript 代码
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return {
    message: \`Welcome to our app\`,
    timestamp: Date.now()
  };
}

// 调用函数
greet('World');
\`\`\`

### Python 代码
\`\`\`python
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 打印前10个斐波那契数
for i in range(10):
    print(fibonacci(i))
\`\`\`

---

## 引用块演示

> 这是一段引用文本。
>
> 引用可以包含多行内容，用于强调重要信息或引用他人观点。

---

## 表格演示

| 功能 | 描述 | 状态 |
|------|------|------|
| 用户认证 | 支持邮箱和第三方登录 | ✅ 已完成 |
| 笔记管理 | CRUD 操作 | ✅ 已完成 |
| AI 对话 | 流式响应 | 🚧 开发中 |
| 搜索功能 | 全文搜索 | 📋 计划中 |

---

## 链接和图片

这是一个 [外部链接](https://github.com) 示例。

---

## 混合格式

在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以在一段文本中可以 **同时使用** *多种格式*，比如 \`代码\` 和 [链接](https://example.com)。

> 💡 **提示**：点击右上角的按钮可以保存为笔记！
`

export const MOCK_MESSAGES: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      conversation_id: 1,
      role: 'user',
      content: '请展示一下 Markdown 的所有格式',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      conversation_id: 1,
      role: 'assistant',
      content: MARKDOWN_TEST_CONTENT,
      created_at: new Date(Date.now() - 86400000 + 1000).toISOString(),
    },
  ],
  2: [
    {
      id: 3,
      conversation_id: 2,
      role: 'user',
      content: '如何学习 React？',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 4,
      conversation_id: 2,
      role: 'assistant',
      content: '学习 React 可以按照以下步骤进行：\n\n1. **掌握 JavaScript 基础**：确保你熟悉 ES6+ 语法\n2. **学习 React 核心概念**：组件、Props、State\n3. **实践项目**：从简单的 Todo List 开始\n4. **学习 React Hooks**：useState, useEffect 等\n5. **深入学习**：路由、状态管理、性能优化',
      created_at: new Date(Date.now() - 86400000 + 1000).toISOString(),
    },
  ],
  3: [
    {
      id: 5,
      conversation_id: 3,
      role: 'user',
      content: 'TypeScript 中的 infer 关键字怎么用？',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 6,
      conversation_id: 3,
      role: 'assistant',
      content: '`infer` 关键字用于条件类型中推断类型。它通常与 `extends` 一起使用：\n\n```typescript\ntype GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;\n```\n\n这个例子中，如果 `T` 是函数类型，`infer R` 会推断出返回值类型并赋给 `R`。',
      created_at: new Date(Date.now() - 3600000 * 5 + 1000).toISOString(),
    },
  ],
}

// In-memory store for conversations
let mockConversations: Conversation[] = [...MOCK_CONVERSATIONS]
let mockConversationMessages: Record<number, Message[]> = { ...MOCK_MESSAGES }
let nextConversationId = 4
let nextMessageId = 7

// ============ Conversations Mock API ============
export const mockConversationsApi = {
  getAll: async (): Promise<Conversation[]> => {
    await delay()
    return [...mockConversations].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  },

  getById: async (id: number): Promise<Conversation> => {
    await delay()
    const conversation = mockConversations.find(c => c.id === id)
    if (!conversation) throw new Error('Conversation not found')
    return { ...conversation }
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    await delay()
    return [...(mockConversationMessages[conversationId] || [])]
  },

  create: async (data: { provider_model_id?: string; model_id?: string; title?: string }): Promise<Conversation> => {
    await delay()
    const newConversation: Conversation = {
      id: nextConversationId++,
      user_id: 1,
      current_provider_model_id: data.provider_model_id || '1-1',
      model_id: data.model_id || 'deepseek-chat',
      title: data.title || '新对话',
      is_saved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockConversations.unshift(newConversation)
    mockConversationMessages[newConversation.id] = []
    return { ...newConversation }
  },

  update: async (id: number, data: { title?: string }): Promise<Conversation> => {
    await delay()
    const index = mockConversations.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Conversation not found')
    mockConversations[index] = {
      ...mockConversations[index],
      ...(data.title !== undefined && { title: data.title }),
      updated_at: new Date().toISOString(),
    }
    return { ...mockConversations[index] }
  },

  delete: async (id: number): Promise<void> => {
    await delay()
    const index = mockConversations.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Conversation not found')
    mockConversations.splice(index, 1)
    delete mockConversationMessages[id]
  },

  sendMessage: async (conversationId: number, data: { content: string }): Promise<Message> => {
    await delay()
    const userMessage: Message = {
      id: nextMessageId++,
      conversation_id: conversationId,
      role: 'user',
      content: data.content,
      created_at: new Date().toISOString(),
    }
    if (!mockConversationMessages[conversationId]) {
      mockConversationMessages[conversationId] = []
    }
    mockConversationMessages[conversationId].push(userMessage)

    // Simulate assistant response
    const assistantMessage: Message = {
      id: nextMessageId++,
      conversation_id: conversationId,
      role: 'assistant',
      content: '这是一个模拟的 AI 响应。在实际环境中，这里会调用真实的 AI API。',
      created_at: new Date().toISOString(),
    }
    mockConversationMessages[conversationId].push(assistantMessage)

    // Update conversation updated_at
    const convIndex = mockConversations.findIndex(c => c.id === conversationId)
    if (convIndex !== -1) {
      mockConversations[convIndex].updated_at = new Date().toISOString()
    }

    return assistantMessage
  },

  regenerate: async (conversationId: number, messageId: number): Promise<Message> => {
    await delay()
    const messages = mockConversationMessages[conversationId]
    if (!messages) throw new Error('Conversation not found')
    const index = messages.findIndex(m => m.id === messageId)
    if (index === -1) throw new Error('Message not found')

    // Regenerate the message (simulate new response)
    messages[index] = {
      ...messages[index],
      content: '这是重新生成的模拟响应。',
      created_at: new Date().toISOString(),
    }
    return { ...messages[index] }
  },

  markAsSaved: async (id: number): Promise<Conversation> => {
    await delay()
    const index = mockConversations.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Conversation not found')
    mockConversations[index].is_saved = true
    mockConversations[index].updated_at = new Date().toISOString()
    return { ...mockConversations[index] }
  },
}
