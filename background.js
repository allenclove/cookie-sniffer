let latestCookie = "";
let cookieHistory = [];

// 默认关键词数组
const defaultKeywords = [
  "your-api-keyword",  // 默认关键词
  "/api/",             // API请求
  "login",             // 登录相关
  "auth",              // 认证相关
  "session"            // 会话相关
];

// 当前使用的关键词数组
let targetUrlKeywords = [...defaultKeywords];

// 调试日志
function log(message) {
  console.log(`[Cookie Sniffer] ${message}`);
}

// 检查URL是否匹配任何关键词
function isTargetUrl(url) {
  const matched = targetUrlKeywords.some(keyword => 
    url.toLowerCase().includes(keyword.toLowerCase())
  );
  if (matched) {
    log(`URL匹配成功: ${url}`);
  }
  return matched;
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

// 获取Cookie的多种方式
function getCookiesForUrl(url) {
  const domain = getDomain(url);
  log(`尝试获取域名 ${domain} 的Cookie`);
  
  // 方法1: 通过域名获取
  chrome.cookies.getAll({ domain: domain }, function (cookies) {
    if (cookies && cookies.length > 0) {
      log(`通过域名获取到 ${cookies.length} 个Cookie`);
      processCookies(cookies, url, domain);
    } else {
      log(`域名 ${domain} 没有找到Cookie，尝试其他方法`);
      
      // 方法2: 通过URL获取
      chrome.cookies.getAll({ url: url }, function (urlCookies) {
        if (urlCookies && urlCookies.length > 0) {
          log(`通过URL获取到 ${urlCookies.length} 个Cookie`);
          processCookies(urlCookies, url, domain);
        } else {
          log(`URL ${url} 也没有找到Cookie`);
        }
      });
    }
  });
}

// 处理Cookie
function processCookies(cookies, url, domain) {
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  processCookiesFromString(cookieStr, url, domain);
}

// 处理Cookie字符串
function processCookiesFromString(cookieStr, url, domain) {
  if (!cookieStr || cookieStr.trim() === '') {
    log('Cookie字符串为空');
    return;
  }
  
  latestCookie = cookieStr;
  log(`处理Cookie: ${cookieStr.substring(0, 100)}...`);
  
  // 保存到历史记录
  const cookieInfo = {
    url: url,
    domain: domain,
    cookie: cookieStr,
    timestamp: new Date().toLocaleString()
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
    
    if (isTargetUrl(details.url)) {
      log(`开始获取Cookie: ${details.url}`);
      getCookiesForUrl(details.url);
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
  } else if (message.type === "getKeywords") {
    sendResponse({ keywords: targetUrlKeywords });
  } else if (message.type === "addKeyword") {
    const keyword = message.keyword.trim();
    if (keyword && !targetUrlKeywords.includes(keyword)) {
      targetUrlKeywords.push(keyword);
      chrome.storage.local.set({ keywords: targetUrlKeywords });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  } else if (message.type === "removeKeyword") {
    const keyword = message.keyword;
    const index = targetUrlKeywords.indexOf(keyword);
    if (index > -1) {
      targetUrlKeywords.splice(index, 1);
      chrome.storage.local.set({ keywords: targetUrlKeywords });
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
    if (message.cookies && isTargetUrl(message.url)) {
      log(`检测到Cookie变化: ${message.url}`);
      processCookiesFromString(message.cookies, message.url, message.domain);
    }
  }
});

// 启动时从存储中恢复数据
chrome.storage.local.get(['latestCookie', 'cookieHistory', 'keywords'], function(result) {
  if (result.latestCookie) {
    latestCookie = result.latestCookie;
  }
  if (result.cookieHistory) {
    cookieHistory = result.cookieHistory;
  }
  if (result.keywords) {
    targetUrlKeywords = result.keywords;
  }
}); 