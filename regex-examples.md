# Cookie Sniffer 正则表达式示例

## 常用正则表达式示例

### 1. API 相关匹配

```
规则名称: api-v1
匹配值: /api/v1/
匹配类型: 关键词
页面URL: 

规则名称: api-v2
匹配值: /api/v2/
匹配类型: 关键词
页面URL: 

规则名称: api-version
匹配值: /api/v\d+/
匹配类型: 正则
页面URL: 

规则名称: api-endpoints
匹配值: /api/(users|posts|comments)/
匹配类型: 正则
页面URL: 
```

### 2. 用户相关匹配

```
规则名称: user-profile
匹配值: /user/\d+
匹配类型: 正则
页面URL: 

规则名称: user-actions
匹配值: /user/(login|logout|register)
匹配类型: 正则
页面URL: 

规则名称: user-settings
匹配值: /user/settings
匹配类型: 关键词
页面URL: 
```

### 3. 认证相关匹配

```
规则名称: auth-pages
匹配值: /(login|logout|register|signin|signup)
匹配类型: 正则
页面URL: 

规则名称: oauth
匹配值: /oauth/
匹配类型: 关键词
页面URL: 

规则名称: token-verify
匹配值: /token/verify
匹配类型: 关键词
页面URL: 
```

### 4. 数据相关匹配

```
规则名称: data-api
匹配值: /data/
匹配类型: 关键词
页面URL: 

规则名称: analytics
匹配值: /analytics/
匹配类型: 关键词
页面URL: 

规则名称: log-endpoints
匹配值: /log/.*
匹配类型: 正则
页面URL: 
```

### 5. 特定域名匹配

```
规则名称: bilibili-data
匹配值: https://data\.bilibili\.com/.*
匹配类型: 正则
页面URL: https://data.bilibili.com

规则名称: bilibili-api
匹配值: https://api\.bilibili\.com/.*
匹配类型: 正则
页面URL: https://api.bilibili.com

规则名称: github-api
匹配值: https://api\.github\.com/.*
匹配类型: 正则
页面URL: https://api.github.com
```

## 正则表达式语法说明

### 常用元字符
- `.` - 匹配任意字符（除换行符）
- `*` - 匹配前面的字符0次或多次
- `+` - 匹配前面的字符1次或多次
- `?` - 匹配前面的字符0次或1次
- `\d` - 匹配数字字符
- `\w` - 匹配字母、数字、下划线
- `\s` - 匹配空白字符
- `[]` - 字符类，匹配方括号中的任意一个字符
- `()` - 分组
- `|` - 或操作符

### 转义字符
- `\.` - 匹配实际的点号
- `\*` - 匹配实际的星号
- `\+` - 匹配实际的加号
- `\?` - 匹配实际的问号
- `\(` - 匹配实际的左括号
- `\)` - 匹配实际的右括号
- `\[` - 匹配实际的左方括号
- `\]` - 匹配实际的右方括号

## 测试步骤

1. **安装扩展**：确保 Cookie Sniffer 扩展已安装并启用

2. **添加规则**：在扩展弹窗中添加上述规则示例

3. **测试匹配**：
   - 打开浏览器开发者工具
   - 访问相关网站或使用测试页面
   - 观察网络请求是否被匹配

4. **查看结果**：
   - 点击扩展图标
   - 查看是否捕获到 Cookie
   - 检查匹配信息是否正确

## 常见问题

### 正则表达式不生效？
1. 检查正则表达式语法是否正确
2. 确保没有特殊字符需要转义
3. 查看浏览器控制台的错误信息

### 匹配不到预期的URL？
1. 确认URL格式是否与正则表达式匹配
2. 使用在线正则表达式测试工具验证
3. 检查是否有多余的空格或特殊字符

### 性能问题？
1. 避免使用过于复杂的正则表达式
2. 优先使用关键词匹配，必要时才使用正则
3. 定期清理不需要的规则

## 实用技巧

1. **测试正则表达式**：使用在线工具如 regex101.com 测试
2. **逐步调试**：从简单的关键词开始，逐步添加正则表达式
3. **记录日志**：查看浏览器控制台的调试信息
4. **备份规则**：定期导出重要的匹配规则

## 示例测试URL

```
https://api.example.com/v1/users
https://api.example.com/v2/posts
https://data.bilibili.com/v2/log/web
https://github.com/api/v3/user
https://example.com/user/12345
https://example.com/login
https://example.com/oauth/authorize
```
