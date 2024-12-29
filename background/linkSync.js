import { WebAuthFlow } from './auth.js';

export class LinkSync {
  constructor() {
    this.auth = new WebAuthFlow();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.auth.initialize();
      this.initialized = true;
    }
    return this.auth.getAccessToken();
  }

  async createLink(link) {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Format link data to match Android app structure
    const linkData = {
      id: crypto.randomUUID(),
      url: link.url,
      title: link.title || '',
      description: link.description || '',
      previewImageUrl: link.previewImageUrl || null,
      type: link.type || 'OTHER',
      createdAt: Date.now(),
      reminderTime: null,
      isArchived: false,
      isFavorite: false,
      isCompleted: false,
      completedAt: null,
      notes: null,
      lastSyncedAt: null,
      syncError: null,
      scrollPosition: 0,
      tags: link.tags || []
    };

    try {
      // Get repo content first
      const content = await this.getRepoContent('links.json');
      let links = [];
      
      if (content) {
        // Decode base64 content and parse JSON
        const decoder = new TextDecoder();
        const bytes = Uint8Array.from(atob(content.content), c => c.charCodeAt(0));
        links = JSON.parse(decoder.decode(bytes));
      }

      // Add new link
      links.push(linkData);

      // Update file in repo
      await this.updateRepoFile('links.json', JSON.stringify(links, null, 2), content?.sha);

      return linkData;
    } catch (error) {
      console.error('Failed to sync link:', error);
      throw error;
    }
  }

  async getRepoContent(path) {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const repoName = await this.getRepoName();
    const response = await fetch(`https://api.github.com/repos/${await this.getUsername()}/${repoName}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get repo content');
    }

    return await response.json();
  }

  async updateRepoFile(path, content, sha = null) {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const body = {
      message: 'Update links',
      content: btoa(content)
    };

    if (sha) {
      body.sha = sha;
    }

    const repoName = await this.getRepoName();
    const response = await fetch(`https://api.github.com/repos/${await this.getUsername()}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Failed to update file');
    }

    return await response.json();
  }

  async getUsername() {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return data.login;
  }

  async ensureRepoExists() {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const username = await this.getUsername();
      // Check if repo exists
      const repoName = await this.getRepoName();
      const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        // Create repo if it doesn't exist
        await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            description: 'LinkStack synchronized links',
            private: true
          })
        });
      } else if (!response.ok) {
        throw new Error('Failed to check repo');
      }
    } catch (error) {
      console.error('Failed to ensure repo exists:', error);
      throw error;
    }
  }

  async getRepoName() {
    const { repoName } = await chrome.storage.local.get('repoName');
    return repoName || 'linkstash-sync'; // Default to 'linkstash-sync' if not set
  }
}
