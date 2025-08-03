// Content Script for Cookie Sniffer
// 这个脚本会在页面中运行，用于获取当前页面的Cookie

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getPageCookies") {
    const cookies = document.cookie;
    sendResponse({ 
      success: true, 
      cookies: cookies,
      url: window.location.href,
      domain: window.location.hostname
    });
  }
});

// 自动检测页面Cookie变化
let lastCookieCount = document.cookie.split(';').length;

// 监听Cookie变化
setInterval(() => {
  const currentCookieCount = document.cookie.split(';').length;
  if (currentCookieCount !== lastCookieCount) {
    lastCookieCount = currentCookieCount;
    
    // 通知background script
    chrome.runtime.sendMessage({
      type: "cookiesChanged",
      cookies: document.cookie,
      url: window.location.href,
      domain: window.location.hostname
    });
  }
}, 1000);

// 页面加载完成后发送初始Cookie
window.addEventListener('load', () => {
  if (document.cookie) {
    chrome.runtime.sendMessage({
      type: "pageLoaded",
      cookies: document.cookie,
      url: window.location.href,
      domain: window.location.hostname
    });
  }
}); 