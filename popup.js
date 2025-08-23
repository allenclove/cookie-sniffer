document.addEventListener("DOMContentLoaded", function () {
  // 初始化设置
  initializeSettings();
  
  // 获取Cookie和历史记录
  chrome.runtime.sendMessage({ type: "getCookie" }, function (response) {
    const textarea = document.getElementById("cookieText");
    const sourceDiv = document.getElementById("cookieSource");
    const timeDiv = document.getElementById("cookieTime");
    
    if (response.cookie && response.cookie !== "未捕获到 Cookie") {
      textarea.value = response.cookie;
      // 显示最新Cookie的来源信息
      if (response.history && response.history.length > 0) {
        const latest = response.history[0];
        sourceDiv.textContent = `来源: ${latest.url} (匹配规则: ${latest.matchKey} [${latest.matchType}])`;
        sourceDiv.className = "cookie-source active";
        timeDiv.textContent = `捕获时间: ${latest.timestamp}`;
        
        // 为Cookie来源URL添加点击展开功能
        sourceDiv.addEventListener("click", function() {
          if (this.classList.contains('expanded')) {
            // 如果已经展开，则收起
            this.textContent = `来源: ${latest.url} (匹配规则: ${latest.matchKey} [${latest.matchType}])`;
            this.classList.remove('expanded');
          } else {
            // 如果未展开，则展开显示完整URL
            this.textContent = `来源: ${latest.url}\n(匹配规则: ${latest.matchKey} [${latest.matchType}])`;
            this.classList.add('expanded');
          }
        });
      }
    } else {
      textarea.value = "未捕获到 Cookie";
      sourceDiv.textContent = "等待捕获 Cookie...";
      sourceDiv.className = "cookie-source";
      timeDiv.textContent = "";
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
          const timeDiv = document.getElementById("cookieTime");
          textarea.value = "未捕获到 Cookie";
          sourceDiv.textContent = "等待捕获 Cookie...";
          sourceDiv.className = "cookie-source";
          timeDiv.textContent = "";
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

  // 设置按钮
  document.getElementById("settingsBtn").addEventListener("click", function () {
    document.getElementById("settingsModal").style.display = "block";
  });

  // 关闭设置弹框
  document.getElementById("closeSettingsBtn").addEventListener("click", function () {
    document.getElementById("settingsModal").style.display = "none";
  });

  // 点击弹框外部关闭
  window.addEventListener("click", function (event) {
    const settingsModal = document.getElementById("settingsModal");
    const importModal = document.getElementById("importModal");
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
    if (event.target === importModal) {
      importModal.style.display = "none";
    }
  });

  // 导出规则按钮
  document.getElementById("exportRulesBtn").addEventListener("click", function () {
    exportRules();
  });

  // 导入规则按钮
  document.getElementById("importRulesBtn").addEventListener("click", function () {
    console.log("导入规则按钮被点击");
    document.getElementById("importModal").style.display = "block";
  });

  // 关闭导入弹框
  document.getElementById("closeImportBtn").addEventListener("click", function () {
    console.log("关闭导入弹框按钮被点击");
    document.getElementById("importModal").style.display = "none";
  });

  // 取消导入
  document.getElementById("cancelImportBtn").addEventListener("click", function () {
    console.log("取消导入按钮被点击");
    document.getElementById("importModal").style.display = "none";
  });

  // 确认导入
  document.getElementById("confirmImportBtn").addEventListener("click", function () {
    console.log("确认导入按钮被点击");
    const importFile = document.getElementById("importFile");
    const importText = document.getElementById("importTextarea").value.trim();
    
    console.log("文件数量:", importFile.files.length);
    console.log("文本内容:", importText);
    
    if (importFile.files.length > 0) {
      // 从文件导入
      const file = importFile.files[0];
      console.log("选择的文件:", file.name);
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonText = e.target.result;
          console.log("文件内容:", jsonText);
          importRules(jsonText);
        } catch (error) {
          console.error("文件读取错误:", error);
          showNotification("❌ 文件读取失败: " + error.message);
        }
      };
      reader.readAsText(file);
    } else if (importText) {
      // 从文本导入
      console.log("从文本导入:", importText);
      importRules(importText);
    } else {
      console.log("没有选择文件或输入文本");
      showNotification("⚠️ 请选择文件或输入JSON内容");
    }
  });

  // 测试按钮点击
  setTimeout(() => {
    const confirmBtn = document.getElementById("confirmImportBtn");
    if (confirmBtn) {
      console.log("确认导入按钮存在:", confirmBtn);
      console.log("按钮样式:", window.getComputedStyle(confirmBtn));
    } else {
      console.log("确认导入按钮不存在");
    }
  }, 1000);

  // 匹配规则管理
  loadMatchRules();
  setupRuleManagement();
  
  // 确保所有事件监听器都已绑定
  console.log("所有事件监听器已绑定");
});

// 初始化设置
function initializeSettings() {
  // 默认启用输入记忆和自动保存
  restoreLastInputs();
  setupRealTimeSave(); // 调用实时保存函数
}

// 恢复上次输入
function restoreLastInputs() {
  chrome.storage.local.get(['lastInputs'], function(result) {
    if (result.lastInputs) {
      const inputs = result.lastInputs;
      if (inputs.ruleKey) document.getElementById("ruleKeyInput").value = inputs.ruleKey;
      if (inputs.ruleValue) document.getElementById("ruleValueInput").value = inputs.ruleValue;
      if (inputs.ruleType) document.getElementById("ruleTypeSelect").value = inputs.ruleType;
      if (inputs.ruleUrl) document.getElementById("ruleUrlInput").value = inputs.ruleUrl;
    }
  });
}

// 保存当前输入
function saveCurrentInputs() {
  const inputs = {
    ruleKey: document.getElementById("ruleKeyInput").value,
    ruleValue: document.getElementById("ruleValueInput").value,
    ruleType: document.getElementById("ruleTypeSelect").value,
    ruleUrl: document.getElementById("ruleUrlInput").value
  };
  
  chrome.storage.local.set({ lastInputs: inputs });
}

// 实时保存输入内容
function setupRealTimeSave() {
  const keyInput = document.getElementById("ruleKeyInput");
  const valueInput = document.getElementById("ruleValueInput");
  const typeSelect = document.getElementById("ruleTypeSelect");
  const urlInput = document.getElementById("ruleUrlInput");
  
  // 为所有输入框添加实时保存
  [keyInput, valueInput, typeSelect, urlInput].forEach(input => {
    input.addEventListener("input", saveCurrentInputs);
    input.addEventListener("change", saveCurrentInputs);
  });
}

// 显示规则快捷按钮
function displayQuickRuleButtons(rules) {
  const quickButtonsContainer = document.getElementById("quickRuleButtons");
  if (!quickButtonsContainer) return;
  
  // 过滤出有URL的规则
  const rulesWithUrl = rules.filter(rule => rule.url && rule.url.trim() !== "");
  
  if (rulesWithUrl.length === 0) {
    quickButtonsContainer.innerHTML = '<div class="no-quick-rules">暂无快捷规则</div>';
    return;
  }
  
  quickButtonsContainer.innerHTML = rulesWithUrl.map(rule => `
    <button class="quick-rule-btn" data-url="${rule.url}" title="${rule.url}">
      ${rule.key}
    </button>
  `).join('');
  
  // 为快捷按钮添加点击事件
  document.querySelectorAll('.quick-rule-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url) {
        chrome.tabs.create({ url: url });
        showNotification(`✅ 已打开: ${this.textContent}`);
      }
    });
  });
}

// 清空规则输入框
function clearRuleInputs() {
  document.getElementById("ruleKeyInput").value = "";
  document.getElementById("ruleValueInput").value = "";
  document.getElementById("ruleUrlInput").value = "";
  // 不清空类型选择，保持默认值
}

// 导出规则
function exportRules() {
  chrome.runtime.sendMessage({ type: "getMatchRules" }, function (response) {
    if (response.rules && response.rules.length > 0) {
      const exportData = {
        version: "1.0",
        exportTime: new Date().toISOString(),
        rules: response.rules
      };
      
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // 创建下载链接
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookie-sniffer-rules-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification("✅ 规则已导出");
    } else {
      showNotification("⚠️ 没有规则可导出");
    }
  });
}

// 导入规则
function importRules(jsonText) {
  try {
    const importData = JSON.parse(jsonText);
    
    if (!importData.rules || !Array.isArray(importData.rules)) {
      showNotification("❌ 无效的规则格式");
      return;
    }
    
    // 验证规则格式
    const validRules = importData.rules.filter(rule => 
      rule.key && rule.value && rule.type
    );
    
    if (validRules.length === 0) {
      showNotification("❌ 没有有效的规则");
      return;
    }
    
    console.log("开始导入规则，规则数量:", validRules.length);
    
    // 设置超时
    const timeout = setTimeout(() => {
      console.error("导入规则超时");
      showNotification("❌ 导入超时，请重试");
    }, 10000); // 10秒超时
    
    chrome.runtime.sendMessage({ 
      type: "importRules", 
      rules: validRules 
    }, function (response) {
      clearTimeout(timeout);
      
      // 检查是否有错误
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error:", chrome.runtime.lastError);
        showNotification("❌ 导入失败: " + chrome.runtime.lastError.message);
        return;
      }
      
      // 检查响应是否存在
      if (!response) {
        console.error("No response received from background script");
        showNotification("❌ 导入失败: 没有收到响应");
        return;
      }
      
      console.log("收到导入响应:", response);
      
      if (response.success) {
        document.getElementById("importModal").style.display = "none";
        document.getElementById("importTextarea").value = "";
        document.getElementById("importFile").value = "";
        loadMatchRules(); // 这会同时更新规则列表和快捷按钮
        showNotification(`✅ 成功导入 ${validRules.length} 条规则`);
      } else {
        showNotification("❌ 导入失败: " + (response.error || "未知错误"));
      }
    });
    
  } catch (error) {
    console.error("Import rules error:", error);
    showNotification("❌ JSON格式错误: " + error.message);
  }
}

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
      displayQuickRuleButtons(response.rules); // 显示快捷按钮
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
      loadMatchRules(); // 这会同时更新规则列表和快捷按钮
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
      // 清空输入框
      clearRuleInputs();
      // 保存当前输入（默认启用输入记忆）
      saveCurrentInputs();
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
          // 清空输入框
          clearRuleInputs();
          // 保存当前输入（默认启用输入记忆）
          saveCurrentInputs();
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
  console.log("开始添加规则:", rule);
  
  // 设置超时
  const timeout = setTimeout(() => {
    console.error("添加规则超时");
    showNotification("❌ 添加规则超时，请重试");
  }, 5000); // 5秒超时
  
  chrome.runtime.sendMessage({ 
    type: "addMatchRule", 
    rule: rule 
  }, function (response) {
    clearTimeout(timeout);
    
    if (chrome.runtime.lastError) {
      console.error("Chrome runtime error:", chrome.runtime.lastError);
      showNotification("❌ 添加规则失败: " + chrome.runtime.lastError.message);
      return;
    }
    
    if (!response) {
      console.error("No response received from background script");
      showNotification("❌ 添加规则失败: 没有收到响应");
      return;
    }
    
    console.log("收到添加规则响应:", response);
    
    if (response.success) {
      loadMatchRules(); // 这会同时更新规则列表和快捷按钮
      showNotification("✅ 匹配规则已添加");
    } else {
      showNotification("❌ 规则名称已存在");
    }
  });
}

// 删除匹配规则
function removeMatchRule(key) {
  if (confirm(`确定要删除规则 "${key}" 吗？`)) {
    console.log("开始删除规则:", key);
    
    // 设置超时
    const timeout = setTimeout(() => {
      console.error("删除规则超时");
      showNotification("❌ 删除规则超时，请重试");
    }, 5000); // 5秒超时
    
    chrome.runtime.sendMessage({ 
      type: "removeMatchRule", 
      key: key 
    }, function (response) {
      clearTimeout(timeout);
      
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error:", chrome.runtime.lastError);
        showNotification("❌ 删除规则失败: " + chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        console.error("No response received from background script");
        showNotification("❌ 删除规则失败: 没有收到响应");
        return;
      }
      
      console.log("收到删除规则响应:", response);
      
      if (response.success) {
        loadMatchRules(); // 这会同时更新规则列表和快捷按钮
        showNotification("🗑️ 规则已删除");
      } else {
        showNotification("❌ 删除规则失败");
      }
    });
  }
} 