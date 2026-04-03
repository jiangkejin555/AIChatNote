# OAuth 登录流程与安全机制

本文档介绍 AI Chat Note 的 OAuth 登录完整流程、State 参数的安全作用、HMAC 签名原理，以及相关代码实现。

## 目录

- [完整交互流程](#完整交互流程)
- [用户匹配逻辑](#用户匹配逻辑)
- [State 参数与 CSRF 防护](#state-参数与-csrf-防护)
- [HMAC 签名原理](#hmac-签名原理)
- [相关代码位置](#相关代码位置)

---

## 完整交互流程

以 Google 登录为例（GitHub 流程类似）：

```
用户点击 "Google登录"
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ ① GET /api/oauth/google/auth-url                    │
│    前端 → 后端                                        │
│                                                      │
│    后端生成 state（HMAC 签名的自包含令牌）              │
│    返回: {                                            │
│      "auth_url": "https://accounts.google.com        │
│        /o/oauth2/v2/auth?                            │
│        client_id=xxx&                                │
│        redirect_uri=xxx&                             │
│        state=a1b2c3.1740000000.sig&                  │
│        ..."                                          │
│    }                                                 │
└────────────────────┬────────────────────────────────┘
                     │
       前端执行 window.location.href = auth_url
       浏览器跳转到 Google 登录页
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ ② 用户在 Google 页面登录并授权                         │
│                                                      │
│    Google 回调到 redirect_uri:                        │
│    https://your-app.com/callback/google              │
│      ?code=4/0AXXXX...                               │
│      &state=a1b2c3.1740000000.sig                   │
│    （code 和 state 在 URL query string 中）            │
└────────────────────┬────────────────────────────────┘
                     │
       前端 callback 页面读取 URL 中的 code + state
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ ③ POST /api/oauth/google/callback                   │
│    前端 → 后端                                        │
│                                                      │
│    请求体: { "code": "4/0AXXXX...",                   │
│              "state": "a1b2c3.1740000000.sig" }      │
│                                                      │
│    后端验证:                                          │
│    a. 解析 state，验证 HMAC 签名 ✓                    │
│    b. 检查 timestamp 未过期（<10min）✓                │
│    c. 用 code 向 Google 换 access_token               │
│    d. 用 access_token 获取用户信息（邮箱、昵称、头像）  │
│    e. 查找或创建用户（见下方"用户匹配逻辑"）            │
│    f. 生成 JWT 返回给前端                             │
│                                                      │
│    返回: { "token": "eyJhbG...",                      │
│            "refresh_token": "xxx",                    │
│            "user": { "id": 1, "email": ... } }       │
└────────────────────┬────────────────────────────────┘
                     │
       前端保存 token，跳转到主页
       ✅ 登录完成
```

步骤 c/d 的细节（后端 → Google API）：

```
POST https://oauth2.googleapis.com/token
  code=4/0AXXXX...
  client_id=xxx
  client_secret=xxx
  redirect_uri=xxx
  grant_type=authorization_code

→ 返回 { "access_token": "ya29.xxx" }

GET https://www.googleapis.com/oauth2/v2/userinfo
  Authorization: Bearer ya29.xxx

→ 返回 { "id": "123", "email": "user@gmail.com",
          "name": "张三", "picture": "https://..." }
```

---

## 用户匹配逻辑

后端拿到 OAuth 用户信息后，按以下顺序匹配（代码：`backend/internal/handlers/oauth.go` HandleCallback 方法）：

```
Google 回调，拿到邮箱 user@gmail.com
        │
        ▼
┌──────────────────────────────────┐
│ ① 查 oauth_accounts 表           │
│   条件: provider + provider_user_id│
│                                    │
│   → 找到：直接用关联的 user_id      │
│     生成 JWT 登录（老用户）         │
└──────────────┬───────────────────┘
               │ 没找到
               ▼
┌──────────────────────────────────┐
│ ② 查 users 表（按邮箱查）          │
│                                    │
│   → 找到：创建 oauth_account，     │
│     关联到已有 user_id，然后登录    │
│     （邮箱注册过但没绑 Google）     │
└──────────────┬───────────────────┘
               │ 没找到
               ▼
┌──────────────────────────────────┐
│ ③ 全新用户                         │
│   在 users 表 INSERT 新记录        │
│   id 由数据库自增生成               │
│   再创建 oauth_account 关联该 id   │
│   （从未注册过的用户）              │
└──────────────────────────────────┘
```

数据库关系：

```
users 表（账户）
┌────┬───────────────────┬──────────┐
│ id │ email             │ nickname │
├────┼───────────────────┼──────────┤
│  5 │ victim@163.com    │ 小明      │
└────┴───────────────────┴──────────┘
          │
          │ user_id = 5（外键）
          ▼
oauth_accounts 表（绑定的第三方账号）
┌────┬─────────┬──────────┬──────────────────┐
│ id │ user_id │ provider │ provider_user_id  │
├────┼─────────┼──────────┼──────────────────┤
│  1 │       5 │ google   │ google_12345     │
│  2 │       5 │ github   │ github_67890     │
└────┴─────────┴──────────┴──────────────────┘
```

---

## State 参数与 CSRF 防护

### 为什么需要 State？

State 参数是为了防止 **CSRF 攻击**（跨站请求伪造）。攻击目标是：**把攻击者自己的 Google 账号绑定到受害者的账户，从而用 Google 登录进入受害者的账户。**

### 没有 State 时的攻击流程

```
第①步：攻击者自己完成 Google 登录流程

    攻击者浏览器                   chat-note.com              Google
        │                               │                       │
        │  GET /auth-url                 │                       │
        │──────────────────────────────▶│                       │
        │  返回 Google 登录 URL           │                       │
        │◀──────────────────────────────│                       │
        │  跳转 Google，点授权             │                       │
        │──────────────────────────────────────────────────────▶│
        │  Google 回调: ?code=ATTACKER_CODE                      │
        │◀──────────────────────────────────────────────────────│
        │                                                      │
        │  攻击者拿到了这个 callback URL
        │  但他不自己访问，而是发给受害者
```

```
第②步：受害者点击了攻击者构造的链接

    受害者浏览器                   chat-note.com
        │                               │
        │  GET /callback?code=ATTACKER_CODE                    │
        │──────────────────────────────▶│
        │                               │
        │                               │  后端用 ATTACKER_CODE
        │                               │  去 Google 换 token
        │                               │  拿到攻击者的 Google 信息:
        │                               │  { email: "attacker@gmail.com" }
        │                               │
        │                               │  查 cookie → 是受害者 (user_id=5)
        │                               │  把 attacker@gmail.com 绑到 user_id=5
        │                               │
        │  返回 "登录成功"                │
        │◀──────────────────────────────│
        │                               │
        ❌ 攻击者现在可以用 attacker@gmail.com
           通过 Google 登录进入受害者 (id=5) 的账户
```

### 有了 State 为什么能防住？

**核心：state 是服务器生成的，通过"服务器 → Google → 浏览器重定向"链路传递，攻击者无法控制 Google 返回给受害者浏览器的内容。**

```
正常流程（有 state）：

    用户浏览器                   chat-note.com              Google
        │                           │                       │
        │  点击"Google登录"           │                       │
        │──────────────────────────▶│                       │
        │                           │  生成 state=ABC123     │
        │  返回带 state 的 Google URL │                       │
        │◀──────────────────────────│                       │
        │  跳转 Google（URL 带 state=ABC123）                │
        │──────────────────────────────────────────────────▶│
        │  用户授权                                          │
        │  Google 回调: state=ABC123（原样返回）              │
        │◀──────────────────────────────────────────────────│
        │                           │                       │
        │  POST callback { state=ABC123 }                   │
        │──────────────────────────▶│                       │
        │                           │  验证 ABC123 签名 ✓    │
        │                           │  → 登录成功            │
```

```
攻击流程（有 state）：

    攻击者手里有: state=XYZ789（自己的）、ATTACKER_CODE

    受害者浏览器                chat-note.com
        │                           │
        │  攻击者把链接发给受害者：    │
        │  GET /callback?code=ATTACKER_CODE&state=XYZ789
        │──────────────────────────▶│
        │                           │
        │                           │  验证 state=XYZ789
        │                           │  HMAC 签名是对的（攻击者没改过）
        │                           │  但是！用的是 ATTACKER_CODE
        │                           │  拿到的是攻击者自己的 Google 信息
        │                           │  绑的是攻击者邮箱到受害者账号
        │                           │  攻击者得不到任何好处
```

攻击者**不能伪造**新的 state，因为不知道 HMAC 密钥；**不能篡改**已有的 state，因为签名会失效。

---

## HMAC 签名原理

### 什么是 HMAC

HMAC（Hash-based Message Authentication Code）是一种用密钥给数据生成签名的方式。让接收方能够验证数据确实是由持有密钥的一方生成的，且数据未被篡改。

### 最直观的类比

```
普通 Hash（如 SHA256）：
  sha256("转账100元") = "a1b2c3d4..."
  → 任何人都能算出同样的结果，无法证明"谁发的"

HMAC：
  hmac-sha256("密钥", "转账100元") = "f5e6d7c8..."
  → 只有知道密钥的人才能算出正确签名
  → 攻击者知道数据，但不知道密钥，无法伪造签名
```

### 在 OAuth State 中的应用

本项目的 state 格式：

```
state = nonce.timestamp.HMAC签名

示例: a1b2c3d4e5f6a7b8.1740000000.8f3a2b1c...
      \_________________/ \________/ \_________/
       nonce（16字节随机数） timestamp   HMAC-SHA256 签名
```

**生成过程**（`GenerateState` 方法）：

1. 生成 16 字节随机 nonce
2. 获取当前 Unix timestamp
3. 用 JWT secret 作为密钥，计算 `HMAC-SHA256(secret, "nonce.timestamp")`
4. 拼接为 `nonce.timestamp.signature`

**验证过程**（`ValidateState` 方法）：

1. 拆分 state 为 nonce、timestamp、signature
2. 检查 timestamp 是否在 10 分钟内
3. 用同一个密钥重新计算 HMAC
4. 比对计算结果与收到的签名是否一致

### 为什么不需要服务端存储

```
旧方案（内存存储）：
  生成时：state → 存入 Go 进程内存的 map
  验证时：查 map 里有没有
  问题：容器重启/多实例 → map 清空 → 验证失败 → 400

新方案（HMAC 签名）：
  生成时：用密钥计算签名，附在 state 中
  验证时：用同一个密钥重新计算，比对签名
  优势：不需要存储任何东西，任何实例都能验证（只要密钥一致）
```

密钥使用的是 `config.JWT.Secret`，通过环境变量 `JWT_SECRET` 配置，所有实例共享同一个值。

### Go 标准库实现

```go
// 生成签名
mac := hmac.New(sha256.New, secretKey)
mac.Write([]byte("nonce.timestamp"))
signature := hex.EncodeToString(mac.Sum(nil))

// 验证签名
expectedMAC := hmac.New(sha256.New, secretKey)
expectedMAC.Write([]byte("nonce.timestamp"))
expectedSig := hex.EncodeToString(expectedMAC.Sum(nil))
valid := hmac.Equal([]byte(signature), []byte(expectedSig))
```

---

## 相关代码位置

| 文件 | 说明 |
|------|------|
| `backend/internal/services/oauth.go` | OAuth 服务层：state 生成/验证、token 交换、用户信息获取 |
| `backend/internal/handlers/oauth.go` | OAuth 处理器：auth-url 接口、callback 处理、用户匹配逻辑 |
| `backend/internal/models/oauth_account.go` | OAuthAccount 模型定义 |
| `backend/internal/config/oauth.go` | OAuth 配置：多提供商配置、启用状态检查 |
| `backend/internal/config/config.go` | 环境变量覆盖：GOOGLE_*、GITHUB_* 等 |
| `backend/internal/database/database.go` | AutoMigrate 包含 OAuthAccount |
| `frontend/src/app/(auth)/callback/[provider]/page.tsx` | 前端 OAuth 回调页面 |
| `frontend/src/lib/api/auth.ts` | 前端 OAuth API 调用 |
| `docs/oauth-application-guide.md` | OAuth 提供商申请指南（Google/GitHub/QQ） |
