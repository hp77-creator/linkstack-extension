import { LinkSync } from './linkSync.js';

// Initialize LinkSync
const linkSync = new LinkSync();

// Initialize on extension load
(async () => {
  console.log('Background: Extension loading...');
  const token = await linkSync.initialize();
  console.log('Background: Initial token state:', { hasToken: !!token });
  if (token) {
    console.log('Background: Validating initial token...');
    const isValid = await linkSync.auth.validateToken();
    console.log('Background: Initial token validation:', { isValid });
  }
})();

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startAuth':
      handleAuth(sendResponse);
      return true; // Keep channel open for async response

    case 'saveLink':
      handleSaveLink(request.link, sendResponse);
      return true;

    case 'checkAuth':
      handleCheckAuth(sendResponse);
      return true;
  }
});

async function handleAuth(sendResponse) {
  try {
    console.log('Background: Starting web auth flow...');
    const token = await linkSync.auth.authenticate();
    if (token) {
      console.log('Background: Token received, ensuring repo exists...');
      await linkSync.ensureRepoExists();
      console.log('Background: Auth process complete');
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Auth error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSaveLink(link, sendResponse) {
  try {
    const savedLink = await linkSync.createLink(link);
    sendResponse({ success: true, link: savedLink });
  } catch (error) {
    console.error('Save error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckAuth(sendResponse) {
  try {
    console.log('Background: Checking auth state...');
    await linkSync.initialize();
    const token = linkSync.auth.getAccessToken();
    console.log('Background: Current token state:', { hasToken: !!token });

    if (token) {
      console.log('Background: Validating existing token...');
      const isValid = await linkSync.auth.validateToken();
      console.log('Background: Token validation result:', { isValid });
      sendResponse({ isAuthenticated: isValid });
    } else {
      console.log('Background: No token found');
      sendResponse({ isAuthenticated: false });
    }
  } catch (error) {
    console.error('Background: Check auth error:', error);
    sendResponse({ isAuthenticated: false });
  }
}

// Log extension lifecycle events
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Extension started');
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Background: Extension installed/updated:', details.reason);
  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({ 
      isFirstRun: true,
      lastSyncTime: null
    });
  }
});
