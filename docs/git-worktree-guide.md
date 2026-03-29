# Git Worktree 原理与使用指南

## 什么是 Git Worktree

Git Worktree 是 Git 的原生功能（Git 2.5+），允许从同一个 `.git` 仓库 checkout 多个工作目录，每个目录可以在不同的分支上独立工作。

## 原理

### 传统模式

一个 Git 仓库只有一个工作目录和一个 `HEAD` 指向：

```
project/
├── .git/              ← 仓库数据库 + HEAD 指向 main
└── src/               ← 只能在一个分支上工作
```

切换分支时，Git 会修改工作目录的文件来匹配目标分支的状态。

### Worktree 模式

多个工作目录共享同一个 `.git` 仓库数据库：

```
project/
├── .git/                      ← 共享的 Git 对象数据库、refs
├── .git/worktrees/feat-auth/  ← feat-auth 的 HEAD 等元数据
├── .git/worktrees/hotfix/     ← hotfix 的 HEAD 等元数据
├── src/                       ← main 分支的工作目录
└── .worktrees/
    ├── feat-auth/             ← feat-auth 分支的工作目录
    └── hotfix/                ← hotfix 分支的工作目录
```

### 核心机制

1. **共享对象数据库** — 所有 worktree 共用 `.git/objects/`，不需要重复存储文件内容，新增 worktree 的磁盘开销很小
2. **独立的 HEAD** — 每个 worktree 在 `.git/worktrees/<name>/` 下维护自己的 `HEAD`、`index` 等状态文件
3. **分支互斥** — 同一个分支不能同时在两个 worktree 中 checkout，Git 会阻止这种操作以保证一致性
4. **提交实时共享** — 在一个 worktree 中的提交，其他 worktree 可以立即可见（因为共享同一个 refs）

### 与 git clone 的对比

| 特性 | `git clone` | `git worktree` |
|------|-------------|----------------|
| 存储空间 | 完整复制 `.git` | 共享 `.git`，几乎零额外开销 |
| 对象/历史 | 独立副本 | 共享同一份 |
| 分支状态同步 | 需要 fetch/pull | 实时共享 |
| 适用场景 | 独立仓库副本 | 同仓库多分支并行工作 |

## 使用场景

### 1. 紧急热修复（Hotfix）

正在开发功能时线上出 bug，需要立刻修复：

```bash
# 不需要 stash，直接开新 worktree
git worktree add .worktrees/hotfix-123 -b hotfix-123
cd .worktrees/hotfix-123
# 修复 bug、提交、推送
git push -u origin hotfix-123
# 完成后清理
cd ../..
git worktree remove .worktrees/hotfix-123
```

### 2. 并行开发多个功能

同时开发多个功能，需要来回参考或对比代码：

```bash
git worktree add .worktrees/feat-auth -b feat-auth
git worktree add .worktrees/feat-notes -b feat-notes
# 两个目录并排打开，互不干扰
```

### 3. Code Review

Review 别人的 PR 时，checkout 一个 worktree 来运行和测试代码：

```bash
git worktree add .worktrees/review-pr45 -b review-pr45 origin/feature-xyz
cd .worktrees/review-pr45
# 运行测试、查看代码
cd ../..
git worktree remove .worktrees/review-pr45
```

### 4. 合并前验证

合并前在独立目录中验证，原始分支保持干净：

```bash
git worktree add .worktrees/test-merge -b test-merge main
cd .worktrees/test-merge
git merge feat-auth
# 验证通过后合并，失败直接删掉 worktree
```

### 5. 长时间构建不阻塞

一个 worktree 跑测试/构建，另一个继续写代码。

## 常用命令

### 创建

```bash
# 基于当前 HEAD 创建新分支 + worktree
git worktree add .worktrees/feat-ui -b feat-ui

# 基于已有分支创建 worktree
git worktree add .worktrees/dev dev

# 基于某个 commit 创建（分离 HEAD 状态，适合临时调试）
git worktree add .worktrees/debug abc1234

# 指定路径和分支
git worktree add -b new-feature .worktrees/new-feature
```

### 查看

```bash
# 列出所有 worktree
git worktree list

# 详细信息
git worktree list --verbose

# 输出示例：
# /Users/user/project              abc1234 [main]
# /Users/user/project/.worktrees/feat-auth  def5678 [feat-auth]
```

### 在 Worktree 中工作

进入目录后，所有 Git 操作和正常使用完全一致：

```bash
cd .worktrees/feat-ui

git add .
git commit -m "feat: add UI component"
git push -u origin feat-ui

# 拉取主分支的更新
git merge main
git rebase main
```

### 删除

```bash
# 正常删除（无未提交改动时）
git worktree remove .worktrees/feat-ui

# 强制删除（有未提交改动）
git worktree remove --force .worktrees/feat-ui

# 手动删除目录后清理残留记录
rm -rf .worktrees/feat-ui
git worktree prune
```

### 其他维护命令

```bash
# 清理已经不存在目录的 worktree 记录
git worktree prune

# 锁定 worktree（防止被意外删除，如正在使用中）
git worktree lock .worktrees/long-running

# 解锁
git worktree unlock .worktrees/long-running

# 检查 worktree 是否需要修复
git fsck
```

## 目录结构建议

```
project/
├── .git/
├── .gitignore              ← 加上 .worktrees/
├── src/                    ← 主工作目录 (main)
└── .worktrees/
    ├── feat-auth/          ← 认证功能
    ├── hotfix-123/         ← 紧急修复
    └── refactor-api/       ← API 重构
```

### .gitignore 配置

```gitignore
# 忽略 worktree 目录，避免被跟踪
.worktrees/
```

## 完整工作流示例

```bash
# 1. 创建 worktree 开发新功能
git worktree add .worktrees/feat-auth -b feat-auth

# 2. 进入目录，安装依赖
cd .worktrees/feat-auth
npm install  # 或 go mod download, pip install 等

# 3. 编码、测试、提交
# ... 编辑文件 ...
git add .
git commit -m "feat: add authentication module"

# 4. 推送并创建 PR
git push -u origin feat-auth
gh pr create --title "feat: add authentication"

# 5. 合并完成后，回到主目录更新并清理
cd ../..
git pull
git worktree remove .worktrees/feat-auth
git branch -d feat-auth
```

## 注意事项

1. **同一分支不能 checkout 到两个 worktree** — Git 会报 fatal 错误
2. **删除 worktree 目录后记得 `git worktree prune`** — 清理 `.git/worktrees/` 下的残留元数据
3. **`.worktrees/` 加入 `.gitignore`** — 防止 worktree 内容被意外跟踪
4. **每个 worktree 是独立的工作目录** — 依赖（node_modules 等）需要单独安装
5. **删除 worktree 不会删除分支** — 分支仍然存在，需要 `git branch -d` 单独删除

## 何时不用 Worktree

- 只在一个分支上顺序工作，不涉及并行任务
- 任务简单、切换不频繁，`git stash` 够用
- 磁盘空间紧张（虽然 overhead 很小，但大项目的 node_modules 等依赖会占空间）
