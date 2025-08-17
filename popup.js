document.addEventListener("DOMContentLoaded", function () {
  // 获取Cookie和历史记录
  chrome.runtime.sendMessage({ type: "getCookie" }, function (response) {
    const textarea = document.getElementById("cookieText");
    const sourceDiv = document.getElementById("cookieSource");
    
    if (response.cookie && response.cookie !== "未捕获到 Cookie") {
      textarea.value = response.cookie;
      // 显示最新Cookie的来源信息
      if (response.history && response.history.length > 0) {
        const latest = response.history[0];
        sourceDiv.textContent = `来源: ${latest.url} (匹配规则: ${latest.matchKey} [${latest.matchType}])`;
        sourceDiv.className = "cookie-source active";
      }
    } else {
      textarea.value = "未捕获到 Cookie";
      sourceDiv.textContent = "等待捕获 Cookie...";
      sourceDiv.className = "cookie-source";
    }
    
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
          const sourceDiv = document.getElementById("cookieSource");
          textarea.value = "未捕获到 Cookie";
          sourceDiv.textContent = "等待捕获 Cookie...";
          sourceDiv.className = "cookie-source";
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

  // 匹配规则管理
  loadMatchRules();
  setupRuleManagement();
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
        <span class="match-info">匹配: ${item.matchKey} [${item.matchType}]</span>
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

// 正则表达式转义函数
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 加载匹配规则
function loadMatchRules() {
  chrome.runtime.sendMessage({ type: "getMatchRules" }, function (response) {
    if (response.rules) {
      displayMatchRules(response.rules);
    }
  });
}

// 显示匹配规则
function displayMatchRules(rules) {
  const rulesList = document.getElementById("rulesList");
  rulesList.innerHTML = rules.map(rule => `
    <div class="rule" data-key="${rule.key}">
      <div class="rule-header">
        <span class="rule-key">${rule.key}</span>
        <span class="rule-type">[${rule.type}]</span>
        <div class="rule-actions">
          <button class="edit-rule" data-key="${rule.key}" title="编辑规则">✏️</button>
          <button class="remove-rule" data-key="${rule.key}" title="删除规则">×</button>
        </div>
      </div>
      <div class="rule-value">${rule.value}</div>
      ${rule.url ? `<div class="rule-url">
        <a href="${rule.url}" target="_blank" class="rule-link">🔗 打开页面</a>
      </div>` : ''}
    </div>
  `).join('');
  
  // 为删除按钮添加事件
  document.querySelectorAll('.remove-rule').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const key = this.getAttribute('data-key');
      removeMatchRule(key);
    });
  });
  
  // 为编辑按钮添加事件
  document.querySelectorAll('.edit-rule').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const key = this.getAttribute('data-key');
      editMatchRule(key, rules.find(r => r.key === key));
    });
  });
}

// 编辑匹配规则
function editMatchRule(key, rule) {
  const ruleElement = document.querySelector(`[data-key="${key}"]`);
  if (!ruleElement) return;
  
  // 添加编辑模式样式
  ruleElement.classList.add('editing');
  
  // 创建编辑表单
  const editForm = `
    <div class="rule-edit-form">
      <input type="text" id="edit-key-${key}" value="${rule.key}" placeholder="规则名称">
      <input type="text" id="edit-value-${key}" value="${rule.value}" placeholder="匹配值">
      <select id="edit-type-${key}">
        <option value="关键词" ${rule.type === '关键词' ? 'selected' : ''}>关键词</option>
        <option value="全匹配" ${rule.type === '全匹配' ? 'selected' : ''}>全匹配</option>
        <option value="正则" ${rule.type === '正则' ? 'selected' : ''}>正则</option>
      </select>
      <input type="text" id="edit-url-${key}" value="${rule.url || ''}" placeholder="页面URL">
      <div class="rule-edit-actions">
        <button class="save-rule" data-key="${key}">保存</button>
        <button class="cancel-rule" data-key="${key}">取消</button>
      </div>
    </div>
  `;
  
  // 隐藏原有内容，显示编辑表单
  ruleElement.querySelector('.rule-header').style.display = 'none';
  ruleElement.querySelector('.rule-value').style.display = 'none';
  if (ruleElement.querySelector('.rule-url')) {
    ruleElement.querySelector('.rule-url').style.display = 'none';
  }
  
  ruleElement.insertAdjacentHTML('beforeend', editForm);
  
  // 为保存和取消按钮添加事件
  ruleElement.querySelector('.save-rule').addEventListener('click', function() {
    const newKey = document.getElementById(`edit-key-${key}`).value.trim();
    const newValue = document.getElementById(`edit-value-${key}`).value.trim();
    const newType = document.getElementById(`edit-type-${key}`).value;
    const newUrl = document.getElementById(`edit-url-${key}`).value.trim();
    
    if (newKey && newValue) {
      updateMatchRule(key, { key: newKey, value: newValue, type: newType, url: newUrl });
    } else {
      showNotification("⚠️ 请填写规则名称和匹配值");
    }
  });
  
  ruleElement.querySelector('.cancel-rule').addEventListener('click', function() {
    cancelEditRule(key);
  });
  
  // 为匹配值输入框添加正则转义提示
  const valueInput = document.getElementById(`edit-value-${key}`);
  valueInput.addEventListener('input', function() {
    if (newType === '正则') {
      // 可以在这里添加实时验证
    }
  });
}

// 更新匹配规则
function updateMatchRule(oldKey, newRule) {
  chrome.runtime.sendMessage({ 
    type: "updateMatchRule", 
    oldKey: oldKey,
    newRule: newRule 
  }, function (response) {
    if (response.success) {
      loadMatchRules();
      showNotification("✅ 规则已更新");
    } else {
      showNotification("❌ 规则更新失败");
    }
  });
}

// 取消编辑规则
function cancelEditRule(key) {
  const ruleElement = document.querySelector(`[data-key="${key}"]`);
  if (!ruleElement) return;
  
  // 移除编辑模式样式
  ruleElement.classList.remove('editing');
  
  // 恢复原有内容显示
  ruleElement.querySelector('.rule-header').style.display = 'flex';
  ruleElement.querySelector('.rule-value').style.display = 'block';
  if (ruleElement.querySelector('.rule-url')) {
    ruleElement.querySelector('.rule-url').style.display = 'block';
  }
  
  // 移除编辑表单
  const editForm = ruleElement.querySelector('.rule-edit-form');
  if (editForm) {
    editForm.remove();
  }
}

// 设置规则管理
function setupRuleManagement() {
  const addBtn = document.getElementById("addRuleBtn");
  const keyInput = document.getElementById("ruleKeyInput");
  const valueInput = document.getElementById("ruleValueInput");
  const typeSelect = document.getElementById("ruleTypeSelect");
  const urlInput = document.getElementById("ruleUrlInput");
  
  // 添加规则
  addBtn.addEventListener("click", function() {
    const key = keyInput.value.trim();
    const value = valueInput.value.trim();
    const type = typeSelect.value;
    const url = urlInput.value.trim();
    
    if (key && value) {
      addMatchRule({ key, value, type, url });
      keyInput.value = "";
      valueInput.value = "";
      urlInput.value = "";
    } else {
      showNotification("⚠️ 请填写规则名称和匹配值");
    }
  });
  
  // 回车添加规则
  [keyInput, valueInput, urlInput].forEach(input => {
    input.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        const type = typeSelect.value;
        const url = urlInput.value.trim();
        
        if (key && value) {
          addMatchRule({ key, value, type, url });
          keyInput.value = "";
          valueInput.value = "";
          urlInput.value = "";
        }
      }
    });
  });
  
  // 正则表达式类型切换时的提示
  typeSelect.addEventListener("change", function() {
    if (this.value === "正则") {
      showNotification("💡 提示：正则表达式中的特殊字符会自动转义");
    }
  });
  
  // 为匹配值输入框添加正则转义辅助
  valueInput.addEventListener("input", function() {
    if (typeSelect.value === "正则") {
      // 可以在这里添加实时验证或提示
    }
  });
}

// 添加匹配规则
function addMatchRule(rule) {
  chrome.runtime.sendMessage({ 
    type: "addMatchRule", 
    rule: rule 
  }, function (response) {
    if (response.success) {
      loadMatchRules();
      showNotification("✅ 匹配规则已添加");
    } else {
      showNotification("❌ 规则名称已存在");
    }
  });
}

// 删除匹配规则
function removeMatchRule(key) {
  if (confirm(`确定要删除规则 "${key}" 吗？`)) {
    chrome.runtime.sendMessage({ 
      type: "removeMatchRule", 
      key: key 
    }, function (response) {
      if (response.success) {
        loadMatchRules();
        showNotification("🗑️ 规则已删除");
      }
    });
  }
} 