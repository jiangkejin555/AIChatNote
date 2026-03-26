# TypeScript 与 TSX 基础语法指南

本文档结合项目前端代码 `frontend/` 中的实际示例，帮助你理解 TypeScript 和 TSX 的基础语法。

---

## 目录

1. [TypeScript 基础类型](#1-typescript-基础类型)
2. [接口 (Interface)](#2-接口-interface)
3. [类型别名 (Type Alias)](#3-类型别名-type-alias)
4. [泛型 (Generics)](#4-泛型-generics)
5. [函数类型](#5-函数类型)
6. [React 组件基础](#6-react-组件基础)
7. [React Hooks](#7-react-hooks)
8. [事件处理](#8-事件处理)
9. [状态管理 (Zustand)](#9-状态管理-zustand)
10. [常用模式与技巧](#10-常用模式与技巧)

---

## 1. TypeScript 基础类型

### 1.1 基本类型

```typescript
// 基本类型
let name: string = "hello"
let count: number = 42
let isActive: boolean = true

// 数组
let ids: number[] = [1, 2, 3]
let names: Array<string> = ["a", "b", "c"]

// 对象
let user: { id: number; name: string } = { id: 1, name: "test" }
```

### 1.2 联合类型与可选属性

**项目示例** - [types/index.ts:170](../frontend/src/types/index.ts#L170):

```typescript
// 联合类型: role 只能是 'user' 或 'assistant'
export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'  // 联合类型
  content: string
  provider_model_id?: string | null  // 可选属性 + 联合 null
  model_id?: string  // 可选属性 (相当于 string | undefined)
  created_at: string
}
```

**关键点**:
- `|` 表示联合类型，变量可以是多种类型之一
- `?` 表示可选属性，相当于 `类型 | undefined`
- `| null` 表示也可以是 `null`

### 1.3 类型断言

**项目示例** - [login/page.tsx:55](../frontend/src/app/(auth)/login/page.tsx#L55):

```typescript
const axiosError = error as AxiosError<{ message?: string }>
```

当你比 TypeScript 更清楚某个变量的类型时，可以使用 `as` 进行类型断言。

---

## 2. 接口 (Interface)

接口用于定义对象的结构，是 TypeScript 最常用的特性之一。

### 2.1 基本接口

**项目示例** - [types/index.ts:2-7](../frontend/src/types/index.ts#L2):

```typescript
export interface User {
  id: number
  email: string
  created_at: string
  updated_at: string
}
```

### 2.2 嵌套接口

**项目示例** - [types/index.ts:188-201](../frontend/src/types/index.ts#L188):

```typescript
export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {                    // 嵌套对象类型
    index: number
    delta: {                    // 再嵌套
      content?: string
      role?: string
    }
    finish_reason: string | null
  }[]
}
```

### 2.3 接口继承

```typescript
// 基础接口
interface BaseRequest {
  title?: string
}

// 继承并扩展
interface CreateNoteRequest extends BaseRequest {
  content: string
  tags?: string[]
}
```

### 2.4 只读属性

```typescript
interface Config {
  readonly apiKey: string  // 只读，初始化后不可修改
}
```

---

## 3. 类型别名 (Type Alias)

`type` 和 `interface` 类似，但更灵活。

### 3.1 定义联合类型

**项目示例** - [types/index.ts:26-34](../frontend/src/types/index.ts#L26):

```typescript
// 定义一组可选的字面量类型
export type ProviderType =
  | 'openai'
  | 'volcengine'
  | 'deepseek'
  | 'anthropic'
  | 'google'
  | 'moonshot'
  | 'zhipu'
  | 'custom'
```

### 3.2 Type vs Interface

```typescript
// Interface - 可扩展，适合定义对象结构
interface User {
  name: string
}
interface User {  // 可以重复声明，会自动合并
  age: number
}

// Type - 更灵活，但不能重复声明
type ID = string | number
type Point = { x: number; y: number }
```

**建议**: 定义对象结构时用 `interface`，定义联合类型或复杂类型时用 `type`。

---

## 4. 泛型 (Generics)

泛型让你可以编写可重用的组件，类型在使用时才确定。

### 4.1 泛型接口

**项目示例** - [types/index.ts:268-277](../frontend/src/types/index.ts#L268):

```typescript
// <T> 是类型参数，使用时传入具体类型
export interface ApiResponse<T> {
  data: T
}

// 使用示例
const userResponse: ApiResponse<User> = {
  data: { id: 1, email: "test@example.com", ... }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}
```

### 4.2 泛型函数

**项目示例** - [lib/utils.ts:4-6](../frontend/src/lib/utils.ts#L4):

```typescript
// ...inputs: ClassValue[] 是剩余参数
// 返回值是 string
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### 4.3 React Query 中的泛型

**项目示例** - [use-conversations.ts:10-15](../frontend/src/hooks/use-conversations.ts#L10):

```typescript
export function useConversations() {
  return useQuery({          // useQuery<返回类型, 错误类型, 数据类型>
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,  // 返回 Promise<Conversation[]>
  })
}
```

---

## 5. 函数类型

### 5.1 函数声明

```typescript
// 普通函数
function add(a: number, b: number): number {
  return a + b
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b

// 可选参数
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting}, ${name}` : `Hello, ${name}`
}
```

### 5.2 异步函数

**项目示例** - [login/page.tsx:43-61](../frontend/src/app/(auth)/login/page.tsx#L43):

```typescript
const onSubmit = async (data: LoginForm) => {  // async 返回 Promise
  setIsLoading(true)
  try {
    const response = await authApi.login({  // await 等待 Promise
      email: data.email,
      password: data.password,
    })
    login(response.user, response.token)
    toast.success(t('auth.loginSuccess'))
    router.push(decodeURIComponent(redirect))
  } catch (error) {
    // 错误处理
    const axiosError = error as AxiosError<{ message?: string }>
    toast.error(axiosError.response?.data?.message || 'Error')
  } finally {
    setIsLoading(false)  // 无论成功失败都执行
  }
}
```

### 5.3 回调函数类型

```typescript
// 定义回调函数类型
type OnSendCallback = (content: string) => void

// 在组件中使用
interface MessageInputProps {
  onSend: OnSendCallback
  isLoading?: boolean
}
```

---

## 6. React 组件基础

### 6.1 函数组件

**项目示例** - [login/page.tsx:126-141](../frontend/src/app/(auth)/login/page.tsx#L126):

```typescript
// 默认导出的函数组件
export default function LoginPage() {
  const t = useTranslations()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}
```

### 6.2 组件 Props

**项目示例** - [message-input.tsx:10-16](../frontend/src/components/chat/message-input.tsx#L10):

```typescript
// 定义 Props 接口
interface MessageInputProps {
  onSend: (content: string) => void
  isLoading?: boolean   // 可选 prop
  disabled?: boolean
}

// 解构 Props
export function MessageInput({ onSend, isLoading, disabled }: MessageInputProps) {
  // 组件实现
}
```

### 6.3 带泛型的组件

**项目示例** - [button.tsx:45-58](../frontend/src/components/ui/button.tsx#L45):

```typescript
// & 表示交叉类型，合并多个类型
function Button({
  className,
  variant = "default",  // 默认值
  size = "default",
  ...props              // 剩余 props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}   // 展开剩余 props
    />
  )
}
```

### 6.4 TSX 语法

```tsx
// 条件渲染
{isLoading && <Loader2 className="animate-spin" />}
{errors.email && <p className="error">{errors.email.message}</p>}

// 三元表达式
{isLoading ? <Loader2 /> : <Send />}

// 列表渲染
{conversations.map((conv) => (
  <ConversationItem key={conv.id} conversation={conv} />
))}

// 类名条件组合
<div className={`base-class ${isActive ? 'active' : ''}`} />

// 使用 cn 工具函数 (推荐)
<div className={cn('base-class', isActive && 'active', className)} />
```

---

## 7. React Hooks

### 7.1 useState

**项目示例** - [login/page.tsx:24](../frontend/src/app/(auth)/login/page.tsx#L24):

```typescript
// [当前值, 设置函数] = useState(初始值)
const [isLoading, setIsLoading] = useState(false)

// 带类型注解
const [count, setCount] = useState<number>(0)
const [user, setUser] = useState<User | null>(null)
```

### 7.2 useRef

**项目示例** - [message-input.tsx:18-19](../frontend/src/components/chat/message-input.tsx#L18):

```typescript
// 引用 DOM 元素
const textareaRef = useRef<HTMLTextAreaElement>(null)

// 引用任意值 (不触发重渲染)
const prevConversationIdRef = useRef<number | null>(null)

// 使用
if (textareaRef.current) {
  textareaRef.current.focus()
}
```

### 7.3 useEffect

**项目示例** - [message-input.tsx:24-33](../frontend/src/components/chat/message-input.tsx#L24):

```typescript
useEffect(() => {
  // 副作用逻辑
  if (prevConversationIdRef.current !== currentConversationId) {
    prevConversationIdRef.current = currentConversationId
    if (currentConversationId) {
      setContent(drafts[currentConversationId] || '')
    } else {
      setContent('')
    }
  }
}, [currentConversationId, drafts])  // 依赖数组

// 空依赖 - 只在挂载时执行一次
useEffect(() => {
  console.log('Component mounted')
}, [])

// 无依赖 - 每次渲染都执行
useEffect(() => {
  console.log('Every render')
})
```

### 7.4 useCallback

**项目示例** - [message-input.tsx:35-44](../frontend/src/components/chat/message-input.tsx#L35):

```typescript
// 缓存函数，避免不必要的重渲染
const handleSubmit = useCallback(() => {
  if (!content.trim() || isLoading || disabled) return

  onSend(content.trim())
  setContent('')

  if (currentConversationId) {
    clearDraft(currentConversationId)
  }
}, [content, isLoading, disabled, onSend, currentConversationId, clearDraft])
// 只有依赖变化时才创建新函数
```

### 7.5 自定义 Hook

**项目示例** - [use-conversations.ts:10-15](../frontend/src/hooks/use-conversations.ts#L10):

```typescript
// 自定义 Hook 就是一个以 use 开头的函数
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
  })
}

// 带参数的 Hook
export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => (id ? conversationsApi.getById(id) : null),
    enabled: !!id,  // 条件启用
  })
}
```

---

## 8. 事件处理

### 8.1 事件类型

**项目示例** - [message-input.tsx:54-59](../frontend/src/components/chat/message-input.tsx#L54):

```typescript
// 键盘事件
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

// 表单事件
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
}

// 输入事件
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}

// 点击事件
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // 处理点击
}
```

### 8.2 表单处理 (react-hook-form)

**项目示例** - [login/page.tsx:32-41](../frontend/src/app/(auth)/login/page.tsx#L32):

```typescript
interface LoginForm {
  email: string
  password: string
}

// 使用泛型指定表单数据类型
const {
  register,        // 注册输入字段
  handleSubmit,    // 包装提交函数
  formState: { errors },  // 表单状态
} = useForm<LoginForm>({
  defaultValues: {
    email: '',
    password: '',
  },
})

// 在 JSX 中使用
<Input
  {...register('email', {
    required: '邮箱必填',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: '邮箱格式不正确',
    },
  })}
/>
```

---

## 9. 状态管理 (Zustand)

### 9.1 创建 Store

**项目示例** - [auth-store.ts:1-41](../frontend/src/stores/auth-store.ts#L1):

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 定义状态接口
interface AuthState {
  // 状态
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // 方法
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

// 创建 Store
export const useAuthStore = create<AuthState>()(
  persist(  // 使用 persist 中间件持久化
    (set) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,

      // 方法实现 (使用 set 更新状态)
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (user) =>
        set({ user }),
    }),
    {
      name: 'auth-storage',  // localStorage key
    }
  )
)
```

### 9.2 使用 Store

```typescript
// 在组件中使用
function MyComponent() {
  // 获取状态和方法
  const { user, isAuthenticated, login, logout } = useAuthStore()

  // 选择性订阅 (优化性能)
  const user = useAuthStore((state) => state.user)

  // 在非组件中使用
  const token = useAuthStore.getState().token
}
```

---

## 10. 常用模式与技巧

### 10.1 可选链 (Optional Chaining)

**项目示例** - [login/page.tsx:56](../frontend/src/app/(auth)/login/page.tsx#L56):

```typescript
// 安全访问嵌套属性
const message = axiosError.response?.data?.message || '默认错误信息'

// 等价于
const message = axiosError.response && axiosError.response.data && axiosError.response.data.message
  ? axiosError.response.data.message
  : '默认错误信息'
```

### 10.2 空值合并 (Nullish Coalescing)

```typescript
// ?? 只在 null/undefined 时使用默认值
const value = null ?? 'default'  // 'default'
const value = '' ?? 'default'    // '' (空字符串保持不变)

// || 在 falsy 值时使用默认值
const value = '' || 'default'    // 'default' (空字符串被替换)
```

### 10.3 解构与重命名

```typescript
// 解构并重命名
const { user: currentUser, token: authToken } = response

// 解构带默认值
const { name = '匿名' } = user

// 解构嵌套对象
const { response: { data: { message } } } = result
```

### 10.4 展开运算符

```typescript
// 对象展开
const newUser = { ...user, name: '新名字' }

// 数组展开
const newArr = [...oldArr, newItem]

// Props 展开
<Button {...props} className={cn('custom-class', props.className)} />
```

### 10.5 导入导出

```typescript
// 命名导出
export const name = 'test'
export function doSomething() {}

// 默认导出
export default function LoginPage() {}

// 命名导入
import { useAuthStore, useChatStore } from '@/stores'

// 默认导入
import LoginPage from './LoginPage'

// 别名导入
import { useAuthStore as authStore } from '@/stores'

// 导入所有
import * as Icons from 'lucide-react'
```

### 10.6 路径别名

**项目配置** - 使用 `@/` 代替相对路径:

```typescript
// 使用别名 (推荐)
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores'

// 相对路径
import { Button } from '../../../components/ui/button'
```

---

## 附录: 常见错误处理

### 类型错误
```typescript
// ❌ 错误: 可能是 null
const name = user.name

// ✅ 正确: 添加空值检查
const name = user?.name ?? '未知'
```

### Props 类型错误
```typescript
// ❌ 缺少必选 prop
<Button>点击</Button>

// ✅ 提供所有必选 props
<Button onClick={handleClick}>点击</Button>
```

### 事件类型错误
```typescript
// ❌ 隐式 any
const handleClick = (e) => {}

// ✅ 明确类型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {}
```

---

## 推荐学习资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js 文档](https://nextjs.org/docs)
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

*本文档基于项目 `frontend/` 目录下的实际代码编写，示例均来自项目源码。*
