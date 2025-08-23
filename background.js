let latestCookie = "";
let cookieHistory = [];

// 默认匹配规则数组 - 使用新的key-value结构
const defaultMatchRules = [
  {
    key: "api-keyword",
    value: "your-api-keyword",
    type: "关键词",
    url: ""
  },
  {
    key: "api-path",
    value: "/api/",
    type: "关键词",
    url: ""
  },
  {
    key: "login",
    value: "login",
    type: "关键词",
    url: ""
  },
  {
    key: "auth",
    value: "auth",
    type: "关键词",
    url: ""
  },
  {
    key: "session",
    value: "session",
    type: "关键词",
    url: ""
  }
];

// 当前使用的匹配规则数组
let targetMatchRules = [...defaultMatchRules];

// 调试日志
function log(message) {
  console.log(`[Cookie Sniffer] ${message}`);
}

// 检查URL是否匹配任何规则
function isTargetUrl(url) {
  for (const rule of targetMatchRules) {
    let matched = false;
    let matchType = "";
    
    switch (rule.type) {
      case "正则":
        try {
          const regex = new RegExp(rule.value, 'i');
          matched = regex.test(url);
          matchType = "正则";
        } catch (e) {
          log(`正则表达式错误: ${rule.value} - ${e.message}`);
          continue;
        }
        break;
        
      case "全匹配":
        matched = url.toLowerCase() === rule.value.toLowerCase();
        matchType = "全匹配";
        break;
        
      case "关键词":
        matched = url.toLowerCase().includes(rule.value.toLowerCase());
        matchType = "关键词";
        break;
    }
    
    if (matched) {
      log(`URL匹配成功 [${matchType}]: ${url} (匹配规则: ${rule.key})`);
      return { matched: true, rule: rule, matchType: matchType };
    }
  }
  
  return { matched: false, rule: null, matchType: "" };
}

// 获取域名
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    log(`解析域名失败: ${url}`);
    return "";
  }
}

// 获取Cookie的多种方式 - 优先通过URL获取
function getCookiesForUrl(url, matchInfo) {
  const domain = getDomain(url);
  log(`尝试获取URL ${url} 的Cookie`);
  
  // 方法1: 优先通过URL获取
  chrome.cookies.getAll({ url: url }, function (urlCookies) {
    if (urlCookies && urlCookies.length > 0) {
      log(`通过URL获取到 ${urlCookies.length} 个Cookie`);
      processCookies(urlCookies, url, domain, matchInfo);
    } else {
      log(`URL ${url} 没有找到Cookie，尝试通过域名获取`);
      
      // 方法2: 通过域名获取
      chrome.cookies.getAll({ domain: domain }, function (domainCookies) {
        if (domainCookies && domainCookies.length > 0) {
          log(`通过域名获取到 ${domainCookies.length} 个Cookie`);
          processCookies(domainCookies, url, domain, matchInfo);
        } else {
          log(`域名 ${domain} 也没有找到Cookie`);
        }
      });
    }
  });
}

// 处理Cookie
function processCookies(cookies, url, domain, matchInfo) {
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  processCookiesFromString(cookieStr, url, domain, matchInfo);
}

// 处理Cookie字符串
function processCookiesFromString(cookieStr, url, domain, matchInfo) {
  if (!cookieStr || cookieStr.trim() === '') {
    log('Cookie字符串为空');
    return;
  }
  
  latestCookie = cookieStr;
  log(`处理Cookie: ${cookieStr.substring(0, 100)}...`);
  
  // 保存到历史记录 - 包含匹配信息
  const cookieInfo = {
    url: url,
    domain: domain,
    cookie: cookieStr,
    timestamp: new Date().toLocaleString(),
    matchKey: matchInfo ? matchInfo.rule.key : "",
    matchType: matchInfo ? matchInfo.matchType : "",
    matchValue: matchInfo ? matchInfo.rule.value : ""
  };
  
  cookieHistory.unshift(cookieInfo);
  // 只保留最近10条记录
  if (cookieHistory.length > 10) {
    cookieHistory = cookieHistory.slice(0, 10);
  }
  
  // 保存到存储
  chrome.storage.local.set({ 
    latestCookie: latestCookie,
    cookieHistory: cookieHistory 
  });
  
  log(`Cookie已保存，历史记录数量: ${cookieHistory.length}`);
}

// 监听所有网络请求
chrome.webRequest.onCompleted.addListener(
  function (details) {
    log(`检测到请求: ${details.url}`);
    
    const matchResult = isTargetUrl(details.url);
    if (matchResult.matched) {
      log(`开始获取Cookie: ${details.url}`);
      getCookiesForUrl(details.url, matchResult);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 返回true表示我们将异步发送响应
  let willRespondAsync = false;
  
  if (message.type === "getCookie") {
    sendResponse({ 
      cookie: latestCookie,
      history: cookieHistory 
    });
  } else if (message.type === "getHistory") {
    sendResponse({ history: cookieHistory });
  } else if (message.type === "clearHistory") {
    willRespondAsync = true;
    cookieHistory = [];
    chrome.storage.local.set({ cookieHistory: [] }, function() {
      sendResponse({ success: true });
    });
  } else if (message.type === "getMatchRules") {
    sendResponse({ rules: targetMatchRules });
  } else if (message.type === "addMatchRule") {
    willRespondAsync = true;
    const rule = message.rule;
    if (rule.key && rule.value && rule.type && !targetMatchRules.some(r => r.key === rule.key)) {
      targetMatchRules.push(rule);
      // 持久化保存规则
      chrome.storage.local.set({ matchRules: targetMatchRules }, function() {
        log(`规则已保存: ${rule.key}`);
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false });
    }
  } else if (message.type === "updateMatchRule") {
    willRespondAsync = true;
    const oldKey = message.oldKey;
    const newRule = message.newRule;
    const index = targetMatchRules.findIndex(rule => rule.key === oldKey);
    
    if (index > -1 && newRule.key && newRule.value && newRule.type) {
      // 检查新key是否与其他规则冲突（除了当前规则）
      const keyConflict = targetMatchRules.some((rule, i) => 
        i !== index && rule.key === newRule.key
      );
      
      if (keyConflict) {
        sendResponse({ success: false, error: "规则名称已存在" });
      } else {
        targetMatchRules[index] = newRule;
        // 持久化保存规则
        chrome.storage.local.set({ matchRules: targetMatchRules }, function() {
          log(`规则已更新: ${newRule.key}`);
          sendResponse({ success: true });
        });
      }
    } else {
      sendResponse({ success: false, error: "规则不存在或数据无效" });
    }
  } else if (message.type === "removeMatchRule") {
    willRespondAsync = true;
    const key = message.key;
    const index = targetMatchRules.findIndex(rule => rule.key === key);
    if (index > -1) {
      targetMatchRules.splice(index, 1);
      // 持久化保存规则
      chrome.storage.local.set({ matchRules: targetMatchRules }, function() {
        log(`规则已删除: ${key}`);
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false });
    }
  } else if (message.type === "importRules") {
    willRespondAsync = true;
    log("收到导入规则请求");
    const rules = message.rules;
    log(`规则数量: ${rules ? rules.length : 0}`);
    
    if (rules && Array.isArray(rules)) {
      // 验证规则格式
      const validRules = rules.filter(rule => 
        rule.key && rule.value && rule.type
      );
      
      log(`有效规则数量: ${validRules.length}`);
      
      if (validRules.length > 0) {
        // 合并规则，避免重复
        const existingKeys = new Set(targetMatchRules.map(r => r.key));
        const newRules = validRules.filter(rule => !existingKeys.has(rule.key));
        
        log(`新规则数量: ${newRules.length}`);
        
        if (newRules.length > 0) {
          targetMatchRules = targetMatchRules.concat(newRules);
          // 持久化保存规则
          chrome.storage.local.set({ matchRules: targetMatchRules }, function() {
            log(`导入规则成功，新增 ${newRules.length} 条规则`);
            sendResponse({ success: true, importedCount: newRules.length });
          });
        } else {
          log("所有规则都已存在");
          sendResponse({ success: false, error: "所有规则都已存在" });
        }
      } else {
        log("没有有效的规则");
        sendResponse({ success: false, error: "没有有效的规则" });
      }
    } else {
      log("规则格式无效");
      sendResponse({ success: false, error: "规则格式无效" });
    }
  } else if (message.type === "clearAll") {
    willRespondAsync = true;
    // 清空所有数据，但保留规则
    latestCookie = "";
    cookieHistory = [];
    chrome.storage.local.remove(['latestCookie', 'cookieHistory'], function() {
      log("Cookie数据已清空，规则已保留");
      sendResponse({ success: true });
    });
  } else if (message.type === "cookiesChanged" || message.type === "pageLoaded") {
    // 处理来自content script的Cookie变化消息
    if (message.cookies) {
      const matchResult = isTargetUrl(message.url);
      if (matchResult.matched) {
        log(`检测到Cookie变化: ${message.url}`);
        processCookiesFromString(message.cookies, message.url, message.domain, matchResult);
      }
    }
  }
  
  // 返回true表示我们将异步发送响应
  return willRespondAsync;
});

// 启动时从存储中恢复数据
chrome.storage.local.get(['latestCookie', 'cookieHistory', 'matchRules'], function(result) {
  if (result.latestCookie) {
    latestCookie = result.latestCookie;
  }
  if (result.cookieHistory) {
    cookieHistory = result.cookieHistory;
  }
  if (result.matchRules) {
    targetMatchRules = result.matchRules;
    log(`已加载 ${targetMatchRules.length} 条规则`);
  } else {
    // 如果没有保存的规则，使用默认规则并保存
    chrome.storage.local.set({ matchRules: targetMatchRules }, function() {
      log("已保存默认规则");
    });
  }
});

// 监听存储变化，确保规则持久化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local') {
    if (changes.matchRules) {
      log("规则存储已更新");
    }
  }
}); 