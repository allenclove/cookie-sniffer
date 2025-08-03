document.addEventListener("DOMContentLoaded", function () {
  // 获取Cookie和历史记录
  chrome.runtime.sendMessage({ type: "getCookie" }, function (response) {
    const textarea = document.getElementById("cookieText");
    textarea.value = response.cookie || "未捕获到 Cookie";
    
    // 显示历史记录
    displayHistory(response.history || []);
  });

  // 复制按钮
  document.getElementById("copyBtn").addEventListener("click", function () {
    const text = document.getElementById("cookieText").value;
    if (text && text !== "未捕获到 Cookie") {
      navigator.clipboard.writeText(text).then(() => {
        showNotification("✅ Cookie 已复制到剪贴板！");
      }).catch(() => {
        showNotification("❌ 复制失败，请手动复制");
      });
    } else {
      showNotification("⚠️ 没有可复制的 Cookie");
    }
  });

  // 清空按钮
  document.getElementById("clearBtn").addEventListener("click", function () {
    if (confirm("确定要清空所有Cookie数据吗？")) {
      chrome.runtime.sendMessage({ type: "clearAll" }, function (response) {
        if (response.success) {
          const textarea = document.getElementById("cookieText");
          textarea.value = "未捕获到 Cookie";
          displayHistory([]);
          showNotification("🗑️ 所有数据已清空");
        }
      });
    }
  });

  // 清空历史记录按钮
  document.getElementById("clearHistoryBtn").addEventListener("click", function () {
    if (confirm("确定要清空所有历史记录吗？")) {
      chrome.runtime.sendMessage({ type: "clearHistory" }, function (response) {
        if (response.success) {
          displayHistory([]);
          showNotification("🗑️ 历史记录已清空");
        }
      });
    }
  });

  // 关键词管理
  loadKeywords();
  setupKeywordManagement();
});

// 显示历史记录
function displayHistory(history) {
  const historyList = document.getElementById("historyList");
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-history">暂无历史记录</div>';
    return;
  }
  
  historyList.innerHTML = history.map((item, index) => `
    <div class="history-item">
      <div class="history-header">
        <span class="domain">${item.domain}</span>
        <span class="time">${item.timestamp}</span>
      </div>
      <div class="history-url" data-full-url="${item.url}" data-index="${index}">${truncateUrl(item.url)}</div>
      <div class="history-cookie">${truncateCookie(item.cookie)}</div>
      <button class="copy-history-btn" data-index="${index}">复制</button>
    </div>
  `).join('');
  
  // 为历史记录中的复制按钮添加事件
  document.querySelectorAll('.copy-history-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      const cookie = history[index].cookie;
      navigator.clipboard.writeText(cookie).then(() => {
        showNotification("✅ 历史 Cookie 已复制！");
      });
    });
  });
  
  // 为历史记录中的URL添加点击事件
  document.querySelectorAll('.history-url').forEach(urlElement => {
    urlElement.addEventListener('click', function() {
      const fullUrl = this.getAttribute('data-full-url');
      const currentText = this.textContent;
      
      if (this.classList.contains('full-url')) {
        // 如果已经显示完整URL，则切换回截断版本
        this.textContent = truncateUrl(fullUrl);
        this.classList.remove('full-url');
      } else {
        // 显示完整URL
        this.textContent = fullUrl;
        this.classList.add('full-url');
      }
    });
  });
}

// 截断URL显示
function truncateUrl(url) {
  return url.length > 60 ? url.substring(0, 60) + '...' : url;
}

// 截断Cookie显示
function truncateCookie(cookie) {
  return cookie.length > 80 ? cookie.substring(0, 80) + '...' : cookie;
}

// 显示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// 加载关键词
function loadKeywords() {
  chrome.runtime.sendMessage({ type: "getKeywords" }, function (response) {
    if (response.keywords) {
      displayKeywords(response.keywords);
    }
  });
}

// 显示关键词
function displayKeywords(keywords) {
  const keywordsList = document.getElementById("keywordsList");
  keywordsList.innerHTML = keywords.map(keyword => `
    <span class="keyword" data-keyword="${keyword}">
      ${keyword}
      <span class="remove-keyword" data-keyword="${keyword}">×</span>
    </span>
  `).join('');
  
  // 为删除按钮添加事件
  document.querySelectorAll('.remove-keyword').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const keyword = this.getAttribute('data-keyword');
      removeKeyword(keyword);
    });
  });
}

// 设置关键词管理
function setupKeywordManagement() {
  const addBtn = document.getElementById("addKeywordBtn");
  const input = document.getElementById("keywordInput");
  
  // 添加关键词
  addBtn.addEventListener("click", function() {
    const keyword = input.value.trim();
    if (keyword) {
      addKeyword(keyword);
      input.value = "";
    }
  });
  
  // 回车添加关键词
  input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      const keyword = input.value.trim();
      if (keyword) {
        addKeyword(keyword);
        input.value = "";
      }
    }
  });
}

// 添加关键词
function addKeyword(keyword) {
  chrome.runtime.sendMessage({ 
    type: "addKeyword", 
    keyword: keyword 
  }, function (response) {
    if (response.success) {
      loadKeywords();
      showNotification("✅ 关键词已添加");
    } else {
      showNotification("❌ 关键词已存在");
    }
  });
}

// 删除关键词
function removeKeyword(keyword) {
  if (confirm(`确定要删除关键词 "${keyword}" 吗？`)) {
    chrome.runtime.sendMessage({ 
      type: "removeKeyword", 
      keyword: keyword 
    }, function (response) {
      if (response.success) {
        loadKeywords();
        showNotification("🗑️ 关键词已删除");
      }
    });
  }
} 