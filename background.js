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
  if (message.type === "getCookie") {
    sendResponse({ 
      cookie: latestCookie,
      history: cookieHistory 
    });
  } else if (message.type === "getHistory") {
    sendResponse({ history: cookieHistory });
  } else if (message.type === "clearHistory") {
    cookieHistory = [];
    chrome.storage.local.set({ cookieHistory: [] });
    sendResponse({ success: true });
  } else if (message.type === "getMatchRules") {
    sendResponse({ rules: targetMatchRules });
  } else if (message.type === "addMatchRule") {
    const rule = message.rule;
    if (rule.key && rule.value && rule.type && !targetMatchRules.some(r => r.key === rule.key)) {
      targetMatchRules.push(rule);
      chrome.storage.local.set({ matchRules: targetMatchRules });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  } else if (message.type === "updateMatchRule") {
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
        chrome.storage.local.set({ matchRules: targetMatchRules });
        sendResponse({ success: true });
      }
    } else {
      sendResponse({ success: false, error: "规则不存在或数据无效" });
    }
  } else if (message.type === "removeMatchRule") {
    const key = message.key;
    const index = targetMatchRules.findIndex(rule => rule.key === key);
    if (index > -1) {
      targetMatchRules.splice(index, 1);
      chrome.storage.local.set({ matchRules: targetMatchRules });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  } else if (message.type === "clearAll") {
    // 清空所有数据
    latestCookie = "";
    cookieHistory = [];
    chrome.storage.local.clear(function() {
      log("所有数据已清空");
    });
    sendResponse({ success: true });
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
  }
}); 