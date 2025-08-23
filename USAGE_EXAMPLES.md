# 🍪 Cookie Sniffer 使用示例

本文档提供了Cookie Sniffer扩展的各种使用示例和最佳实践。

## 📋 目录

1. [基本使用示例](#基本使用示例)
2. [规则配置示例](#规则配置示例)
3. [正则表达式示例](#正则表达式示例)
4. [导入导出示例](#导入导出示例)
5. [设置配置示例](#设置配置示例)
6. [常见场景示例](#常见场景示例)

## 🚀 基本使用示例

### 1. 安装和启动
```bash
# 1. 下载扩展文件
# 2. 打开Chrome扩展管理页面 (chrome://extensions/)
# 3. 开启开发者模式
# 4. 点击"加载已解压的扩展程序"
# 5. 选择扩展文件夹
```

### 2. 查看捕获的Cookie
1. 点击浏览器工具栏中的Cookie Sniffer图标
2. 查看"最新捕获的Cookie"区域
3. 点击"复制Cookie"按钮复制到剪贴板

### 3. 查看历史记录
1. 在弹窗中滚动到"历史记录"区域
2. 查看所有捕获的Cookie及其详细信息
3. 点击历史记录中的"复制"按钮复制特定Cookie

## ⚙️ 规则配置示例

### 1. 关键词匹配规则

**场景**: 捕获所有包含"/api/"的请求的Cookie

```
规则名称: api-requests
匹配值: /api/
匹配类型: 关键词
页面URL: https://example.com/api/
```

**效果**: 会匹配以下URL：
- `https://example.com/api/users`
- `https://example.com/api/login`
- `https://api.example.com/data`

### 2. 全匹配规则

**场景**: 只捕获特定URL的Cookie

```
规则名称: exact-login
匹配值: https://example.com/login
匹配类型: 全匹配
页面URL: https://example.com/login
```

**效果**: 只会匹配完全相同的URL

### 3. 正则表达式规则

**场景**: 捕获特定模式的URL

```
规则名称: user-profiles
匹配值: /user/\d+/profile
匹配类型: 正则
页面URL: https://example.com/user/
```

**效果**: 会匹配以下URL：
- `/user/123/profile`
- `/user/456/profile`
- `/user/789/profile`

## 🔍 正则表达式示例

### 1. API版本匹配
```
规则名称: api-v1
匹配值: /api/v1/.*
匹配类型: 正则
```

**匹配示例**:
- `/api/v1/users`
- `/api/v1/posts`
- `/api/v1/comments`

### 2. 域名匹配
```
规则名称: bilibili-data
匹配值: https://data\.bilibili\.com/.*
匹配类型: 正则
```

**匹配示例**:
- `https://data.bilibili.com/v2/log/web`
- `https://data.bilibili.com/api/stats`

### 3. 认证页面匹配
```
规则名称: auth-pages
匹配值: /(login|logout|register|signin|signup)
匹配类型: 正则
```

**匹配示例**:
- `/login`
- `/logout`
- `/register`
- `/signin`
- `/signup`

### 4. 用户ID匹配
```
规则名称: user-ids
匹配值: /user/\d+
匹配类型: 正则
```

**匹配示例**:
- `/user/12345`
- `/user/67890`
- `/user/11111`

## 📤 导入导出示例

### 1. 导出规则
1. 点击"导出规则"按钮
2. 自动下载JSON文件，例如：`cookie-sniffer-rules-2024-01-01.json`

**导出的JSON格式**:
```json
{
  "version": "1.0",
  "exportTime": "2024-01-01T12:00:00.000Z",
  "rules": [
    {
      "key": "api-keyword",
      "value": "/api/",
      "type": "关键词",
      "url": ""
    },
    {
      "key": "login-pages",
      "value": "/(login|logout|register)",
      "type": "正则",
      "url": ""
    }
  ]
}
```

### 2. 导入规则
1. 点击"导入规则"按钮
2. 在弹框中粘贴JSON内容
3. 点击"确认导入"

**导入的JSON示例**:
```json
{
  "version": "1.0",
  "exportTime": "2024-01-01T12:00:00.000Z",
  "rules": [
    {
      "key": "github-api",
      "value": "https://api.github.com",
      "type": "关键词",
      "url": "https://github.com"
    },
    {
      "key": "stackoverflow",
      "value": "https://stackoverflow.com",
      "type": "全匹配",
      "url": "https://stackoverflow.com"
    }
  ]
}
```

## ⚙️ 设置配置示例

### 1. 插件置顶
- 开启后，插件图标会显示📌标识
- 方便快速访问插件功能

### 2. 输入记忆
- 开启后，记住上次填写的规则内容
- 避免重复输入相同的规则信息

### 3. 自动保存
- 开启后，规则自动保存到本地存储
- 清缓存时不会丢失规则

## 🎯 常见场景示例

### 1. 开发环境调试
**目标**: 捕获开发服务器的API请求Cookie

```
规则名称: dev-api
匹配值: localhost:3000/api
匹配类型: 关键词
页面URL: http://localhost:3000
```

### 2. 社交媒体网站
**目标**: 捕获特定社交网站的Cookie

```
规则名称: twitter-api
匹配值: https://api.twitter.com
匹配类型: 关键词
页面URL: https://twitter.com
```

### 3. 电商网站
**目标**: 捕获购物网站的认证Cookie

```
规则名称: amazon-auth
匹配值: /auth|/login|/signin
匹配类型: 正则
页面URL: https://amazon.com
```

### 4. 视频网站
**目标**: 捕获视频网站的会话Cookie

```
规则名称: youtube-session
匹配值: /watch|/channel|/user
匹配类型: 正则
页面URL: https://youtube.com
```

### 5. 新闻网站
**目标**: 捕获新闻网站的API请求

```
规则名称: news-api
匹配值: /api/news|/api/articles
匹配类型: 正则
页面URL: https://news.example.com
```

## 🔧 高级技巧

### 1. 组合使用多个规则
可以添加多个规则来覆盖不同的场景：

```
规则1: api-general
匹配值: /api/
匹配类型: 关键词

规则2: api-specific
匹配值: /api/v2/
匹配类型: 关键词

规则3: auth-pages
匹配值: /(login|logout|register)
匹配类型: 正则
```

### 2. 使用正则表达式的分组
```
规则名称: user-actions
匹配值: /user/(\d+)/(profile|settings|posts)
匹配类型: 正则
```

### 3. 排除特定URL
使用负向前瞻：
```
规则名称: exclude-admin
匹配值: /api/(?!admin).*
匹配类型: 正则
```

## 🐛 故障排除

### 1. 规则不生效
- 检查规则语法是否正确
- 确认URL格式是否匹配
- 查看浏览器控制台的错误信息

### 2. 正则表达式问题
- 使用正则表达式测试工具验证语法
- 确保特殊字符已正确转义
- 测试匹配效果

### 3. 导入导出失败
- 检查JSON格式是否正确
- 确认规则数据结构完整
- 查看错误提示信息

## 📝 最佳实践

1. **规则命名**: 使用描述性的名称，便于识别
2. **测试验证**: 添加规则后及时测试效果
3. **定期备份**: 定期导出规则配置
4. **权限控制**: 只添加必要的规则，避免过度捕获
5. **版本管理**: 使用导入导出功能管理不同环境的配置

---

**注意**: 请确保遵守相关网站的使用条款和隐私政策，仅用于合法的开发和测试目的。
