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

// Load saved settings
async function loadSettings() {
  const { repoName } = await chrome.storage.local.get(['repoName']);
  if (repoName) {
    document.getElementById('repo-name').value = repoName;
  }
}

// Save settings
document.getElementById('save-settings').addEventListener('click', async () => {
  const repoName = document.getElementById('repo-name').value.trim();
  if (!repoName) {
    showStatus('Repository name cannot be empty', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({ repoName });
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Settings: Save error:', error);
    showStatus('Failed to save settings', 'error');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
