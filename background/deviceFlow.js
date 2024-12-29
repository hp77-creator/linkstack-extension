import config from '../config.json' assert { type: 'json' };

export class DeviceFlowAuth {
  constructor() {
    this.accessToken = null;
    this.clientId = config.github.deviceFlow.clientId;
    this.clientSecret = config.github.deviceFlow.clientSecret;
  }

  async initialize() {
    console.log('DeviceFlowAuth: Initializing...');
    const { accessToken } = await chrome.storage.local.get('accessToken');
    console.log('DeviceFlowAuth: Loaded token from storage:', { accessToken });
    this.accessToken = accessToken || null;
    return this.accessToken;
  }

  async requestDeviceCode() {
    console.log('DeviceFlowAuth: Requesting device code...');
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.device-flow+json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        scope: 'repo' // For private repos access
      })
    });

    if (!response.ok) {
      throw new Error('Failed to request device code');
    }

    const data = await response.json();
    console.log('DeviceFlowAuth: Received device code:', {
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      interval: data.interval
    });
    return data;
  }

  async pollForToken(deviceCode, interval, maxAttempts = 60) { // 5 minutes max with 5s interval
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      console.log(`DeviceFlowAuth: Polling attempt ${attempts + 1}/${maxAttempts}`);
      const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });

      if (!response.ok) {
        throw new Error('Failed to poll for token');
      }

      const data = await response.json();
      
      if (data.error) {
        console.log('DeviceFlowAuth: Poll response:', data);
        if (data.error === 'authorization_pending') {
          console.log(`DeviceFlowAuth: Authorization pending, waiting ${interval}s before retry`);
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
          attempts++;
          continue;
        }
        if (data.error === 'slow_down') {
          // GitHub asked us to slow down, increase the interval
          interval = data.interval || interval + 5;
          console.log(`DeviceFlowAuth: Slowing down polling to ${interval}s interval`);
          continue;
        }
        throw new Error(data.error);
      }

      console.log('DeviceFlowAuth: Received token response:', { 
        access_token: data.access_token,
        token_type: data.token_type,
        scope: data.scope 
      });
      this.accessToken = data.access_token;
      // Store token in extension storage
      console.log('DeviceFlowAuth: Storing token in chrome.storage...');
      await chrome.storage.local.set({ accessToken: this.accessToken });
      console.log('DeviceFlowAuth: Token stored successfully');
      return this.accessToken;
    }
    
    throw new Error('Polling timed out after 5 minutes');
  }

  async startDeviceFlow() {
    console.log('DeviceFlowAuth: Starting device flow...');
    const response = await this.requestDeviceCode();
    
    const result = {
      verificationUrl: response.verification_uri,
      userCode: response.user_code,
      deviceCode: response.device_code,
      interval: response.interval
    };
    
    console.log('DeviceFlowAuth: Device flow started:', {
      deviceCode: result.deviceCode,
      userCode: result.userCode,
      verificationUrl: result.verificationUrl,
      interval: result.interval
    });
    
    return result;
  }

  getAccessToken() {
    return this.accessToken;
  }

  async clearToken() {
    console.log('DeviceFlowAuth: Clearing token...');
    this.accessToken = null;
    await chrome.storage.local.remove('accessToken');
    console.log('DeviceFlowAuth: Token cleared from storage');
  }

  async validateToken() {
    console.log('DeviceFlowAuth: Validating token...');
    const token = this.getAccessToken();
    if (!token) {
      console.log('DeviceFlowAuth: No token found');
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
      console.log('DeviceFlowAuth: Token validation result:', { isValid });
      
      if (!isValid) {
        console.log('DeviceFlowAuth: Token invalid, clearing...');
        await this.clearToken();
      }
      
      return isValid;
    } catch (error) {
      console.error('DeviceFlowAuth: Token validation error:', error);
      await this.clearToken();
      return false;
    }
  }
}
