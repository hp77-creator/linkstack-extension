export class WebAuthFlow {
  constructor() {
    this.accessToken = null;
    this.clientId = null;
    this.clientSecret = null;
  }

  async loadConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      this.clientId = config.github.webFlow.clientId;
      this.clientSecret = config.github.webFlow.clientSecret;
    } catch (error) {
      console.error('Failed to load config:', error);
      throw new Error('Failed to load configuration');
    }
  }

  async initialize() {
    console.log('WebAuthFlow: Initializing...');
    await this.loadConfig();
    const { accessToken } = await chrome.storage.local.get('accessToken');
    console.log('WebAuthFlow: Loaded token from storage:', { accessToken });
    this.accessToken = accessToken || null;
    return this.accessToken;
  }

  async authenticate() {
    console.log('WebAuthFlow: Starting authentication...');
    const redirectURL = chrome.identity.getRedirectURL();
    console.log('WebAuthFlow: Redirect URL:', redirectURL);
    
    const authURL = 
      `https://github.com/login/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectURL)}&` +
      `scope=repo`;

    try {
      console.log('WebAuthFlow: Launching web auth flow...');
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
      });
      
      console.log('WebAuthFlow: Received response URL:', responseUrl);
      const code = new URL(responseUrl).searchParams.get('code');
      if (!code) throw new Error('No code received');

      console.log('WebAuthFlow: Exchanging code for token...');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code
        })
      });

      const data = await tokenResponse.json();
      if (data.error) throw new Error(data.error_description || data.error);

      console.log('WebAuthFlow: Received token response');
      this.accessToken = data.access_token;
      
      console.log('WebAuthFlow: Storing token in chrome.storage...');
      await chrome.storage.local.set({ accessToken: this.accessToken });
      console.log('WebAuthFlow: Token stored successfully');
      
      return this.accessToken;
    } catch (error) {
      console.error('WebAuthFlow: Authentication error:', error);
      throw error;
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  async clearToken() {
    console.log('WebAuthFlow: Clearing token...');
    this.accessToken = null;
    await chrome.storage.local.remove('accessToken');
    console.log('WebAuthFlow: Token cleared from storage');
  }

  async validateToken() {
    console.log('WebAuthFlow: Validating token...');
    const token = this.getAccessToken();
    if (!token) {
      console.log('WebAuthFlow: No token found');
      return false;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const isValid = response.ok;
      console.log('WebAuthFlow: Token validation result:', { isValid });
      
      if (!isValid) {
        console.log('WebAuthFlow: Token invalid, clearing...');
        await this.clearToken();
      }
      
      return isValid;
    } catch (error) {
      console.error('WebAuthFlow: Token validation error:', error);
      await this.clearToken();
      return false;
    }
  }
}
