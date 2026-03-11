// ChemTutor Pro Frontend
// Optimized for Hugging Face Spaces backend deployment

// ============================================
// CONFIGURATION - Update this for your backend
// ============================================
// Replace with your Hugging Face Space URL:
// Example: https://your-username-chem-tutor.hf.space
const DEFAULT_BACKEND_URL = '';

// Try to get from localStorage, or use empty (will show setup prompt)
let API_URL = localStorage.getItem('apiUrl') || DEFAULT_BACKEND_URL;
let conversationHistory = [];
let isWaiting = false;
let isBackendConnected = false;

// ============================================
// DOM Elements
// ============================================
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const apiUrlInput = document.getElementById('apiUrl');
const connectionStatus = document.getElementById('connectionStatus');
const setupPanel = document.getElementById('setupPanel');

// ============================================
// Initialization
// ============================================
function init() {
  apiUrlInput.value = API_URL;
  
  // Show setup if no backend configured
  if (!API_URL) {
    showSetupPanel();
  } else {
    testConnection();
  }
  
  setupEventListeners();
  messageInput.focus();
}

function setupEventListeners() {
  // API URL change
  apiUrlInput.addEventListener('change', (e) => {
    const url = e.target.value.trim();
    if (url) {
      API_URL = url.replace(/\/$/, ''); // Remove trailing slash
      localStorage.setItem('apiUrl', API_URL);
      testConnection();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });

  // Send on Enter (Shift+Enter for new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Quick topic buttons
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      messageInput.value = btn.dataset.topic;
      sendMessage();
    });
  });
}

// ============================================
// Connection & Setup
// ============================================
function showSetupPanel() {
  setupPanel.style.display = 'block';
  connectionStatus.innerHTML = '⚠️ <span>Backend not configured</span>';
  connectionStatus.className = 'status disconnected';
}

function hideSetupPanel() {
  setupPanel.style.display = 'none';
}

async function testConnection() {
  if (!API_URL) {
    showSetupPanel();
    return;
  }
  
  connectionStatus.innerHTML = '🔄 <span>Connecting...</span>';
  connectionStatus.className = 'status connecting';
  
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      isBackendConnected = true;
      connectionStatus.innerHTML = `✅ <span>Connected (${data.env || 'online'})</span>`;
      connectionStatus.className = 'status connected';
      hideSetupPanel();
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    isBackendConnected = false;
    connectionStatus.innerHTML = `❌ <span>Connection failed</span>`;
    connectionStatus.className = 'status disconnected';
    console.error('Connection test failed:', error);
  }
}

// ============================================
// Chat Functions
// ============================================
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || isWaiting) return;
  
  if (!API_URL) {
    showSetupPanel();
    addMessage('ai', '⚠️ Please configure your backend URL first. Enter your Hugging Face Space URL above.', true);
    return;
  }
  
  if (!isBackendConnected) {
    await testConnection();
    if (!isBackendConnected) {
      addMessage('ai', '❌ Cannot connect to backend. Please check your API URL and make sure the Hugging Face Space is running.', true);
      return;
    }
  }

  // Hide welcome message on first chat
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.style.display = 'none';

  // Add user message
  addMessage('user', message);
  messageInput.value = '';
  messageInput.style.height = 'auto';
  
  // Show loading
  isWaiting = true;
  sendBtn.disabled = true;
  const loadingId = addLoading();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: conversationHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // Remove loading
    removeLoading(loadingId);
    
    // Add AI response with source indicator
    const sourceEmoji = {
      'local': '📚',
      'bank': '📚',
      'pubchem': '🧬',
      'local_partial': '⚠️',
      'general': '🤖'
    }[data.context?.source] || '🧪';
    
    const sourceLabel = {
      'local': 'Knowledge Bank',
      'bank': 'Knowledge Bank',
      'pubchem': 'PubChem Database',
      'local_partial': 'Partial Match',
      'general': 'General Knowledge'
    }[data.context?.source] || 'AI';
    
    const sourceInfo = data.context?.confidence > 0.8 
      ? `${sourceEmoji} ${sourceLabel} (high confidence)`
      : `${sourceEmoji} ${sourceLabel}`;
    
    addMessage('ai', data.response, false, sourceInfo);
    
    // Update history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: data.response }
    );
    
    // Keep history manageable (last 10 exchanges)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

  } catch (error) {
    removeLoading(loadingId);
    addMessage('ai', `❌ Error: ${error.message}. Make sure your Hugging Face Space is running and the URL is correct.`, true);
    console.error('Chat error:', error);
    isBackendConnected = false;
    connectionStatus.innerHTML = '❌ <span>Connection lost</span>';
    connectionStatus.className = 'status disconnected';
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
  }
}

function addMessage(role, content, isError = false, sourceInfo = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '👤' : '🧪';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (isError) bubble.classList.add('error');
  
  // Format content (basic markdown)
  let htmlContent = formatContent(content);
  
  // Add source info for AI messages
  if (role === 'ai' && sourceInfo) {
    htmlContent += `<div class="source-info">${sourceInfo}</div>`;
  }
  
  bubble.innerHTML = htmlContent;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  chatContainer.appendChild(messageDiv);
  
  scrollToBottom();
}

function formatContent(text) {
  // Escape HTML
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Code blocks
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

function addLoading() {
  const id = 'loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai';
  loadingDiv.id = id;
  
  loadingDiv.innerHTML = `
    <div class="avatar">🧪</div>
    <div class="bubble loading">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>Thinking...</span>
    </div>
  `;
  
  chatContainer.appendChild(loadingDiv);
  scrollToBottom();
  return id;
}

function removeLoading(id) {
  const loading = document.getElementById(id);
  if (loading) loading.remove();
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ============================================
// Start
// ============================================
document.addEventListener('DOMContentLoaded', init);

// Keyboard shortcut help
console.log('%c ChemTutor Pro ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('Shortcuts:');
console.log('  Enter      → Send message');
console.log('  Shift+Enter→ New line');
console.log('\nSetup:');
console.log('  1. Deploy backend to Hugging Face');
console.log('  2. Copy your Space URL (e.g., https://username-chem-tutor.hf.space)');
console.log('  3. Paste URL in the input at the top');
