// Screen management
const screens = {
  auth: document.getElementById('auth-screen'),
  main: document.getElementById('main-screen'),
  loading: document.getElementById('loading-screen')
};

let currentScreen = null;

function showScreen(screenId) {
  if (currentScreen) {
    screens[currentScreen].style.display = 'none';
  }
  screens[screenId].style.display = 'block';
  currentScreen = screenId;
}

// Auth handling
document.getElementById('start-auth').addEventListener('click', async () => {
  console.log('Popup: Starting authentication...');
  showScreen('loading');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'startAuth' });
    console.log('Popup: Auth response:', response);
    
    if (response.success) {
      console.log('Popup: Authentication successful, loading main screen');
      await loadMainScreen();
    } else {
      console.log('Popup: Auth failed:', response.error);
      throw new Error(response.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Popup: Auth error:', error);
    showError(error.message);
    showScreen('auth');
  }
});

// Main screen handling
async function loadMainScreen() {
  showScreen('loading');
  
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
      // Populate form
      document.getElementById('title').value = pageInfo.title || '';
      document.getElementById('description').value = pageInfo.description || '';
    } catch (error) {
      // If content script is not loaded, use basic tab info
      document.getElementById('title').value = tab.title || '';
      document.getElementById('description').value = '';
    }
    showScreen('main');
  } catch (error) {
    showError(error.message);
  }
}

// Form submission
document.getElementById('save-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showScreen('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let pageInfo;
    try {
      pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
    } catch (error) {
      // If content script fails, use basic tab info
      pageInfo = {
        url: tab.url,
        title: tab.title,
        description: '',
        previewImageUrl: null,
        type: 'OTHER'
      };
    }

    const tags = document.getElementById('tags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => ({ name: tag }));

    // Override with form values
    const link = {
      ...pageInfo,
      title: document.getElementById('title').value || pageInfo.title,
      description: document.getElementById('description').value || pageInfo.description,
      tags
    };

    const response = await chrome.runtime.sendMessage({
      action: 'saveLink',
      link
    });

    if (response.success) {
      showStatus('Link saved successfully!', 'success');
      setTimeout(() => window.close(), 1500);
    } else {
      throw new Error(response.error || 'Failed to save link');
    }
  } catch (error) {
    showError(error.message);
    showScreen('main');
  }
});

// Logout handling
document.getElementById('logout').addEventListener('click', async () => {
  console.log('Popup: Logging out...');
  try {
    await chrome.runtime.sendMessage({ action: 'checkAuth' }); // Force background script to validate token
    await chrome.storage.local.clear();
    console.log('Popup: Storage cleared');
    showScreen('auth');
    document.getElementById('start-auth').style.display = 'block';
  } catch (error) {
    console.error('Popup: Logout error:', error);
    showError('Failed to logout properly');
  }
});

// Status/Error display
function showStatus(message, type = 'error') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

function showError(message) {
  showStatus(message, 'error');
}

// Initial load
async function initializePopup() {
  console.log('Popup: Initializing...');
  showScreen('loading');
  try {
    // Check storage directly first
    const { accessToken, repoName } = await chrome.storage.local.get(['accessToken', 'repoName']);
    console.log('Popup: Storage check:', { hasToken: !!accessToken, repoName });
    
    // Set repo name in input if available
    if (repoName) {
      document.getElementById('repo-name').value = repoName;
    }

    // Wait for response using Promise
    console.log('Popup: Checking auth with background...');
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkAuth' }, resolve);
    });
    
    console.log('Popup: Auth check response:', response);
    
    if (response && response.isAuthenticated) {
      console.log('Popup: User is authenticated, loading main screen');
      await loadMainScreen();
    } else {
      console.log('Popup: User is not authenticated, showing auth screen');
      showScreen('auth');
    }
  } catch (error) {
    console.error('Popup: Initialization error:', error);
    showError(error.message);
    showScreen('auth');
  }
}

// Start initialization when popup opens
// Settings handling
document.getElementById('save-settings').addEventListener('click', async () => {
  const repoName = document.getElementById('repo-name').value.trim();
  if (!repoName) {
    showError('Repository name cannot be empty');
    return;
  }

  try {
    await chrome.storage.local.set({ repoName });
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Popup: Save settings error:', error);
    showError('Failed to save settings');
  }
});

document.addEventListener('DOMContentLoaded', initializePopup);
