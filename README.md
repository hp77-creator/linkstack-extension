# LinkStack Browser Extension

A browser extension that allows you to save and sync links with the LinkStack Android app through GitHub.

## Features

- Save links from any webpage
- Automatically extract page metadata (title, description, preview image)
- Add tags to organize your links
- Sync with GitHub repository
- Compatible with LinkStack Android app
- Uses secure device flow authentication

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Configure GitHub credentials:
   - Create a new OAuth app at https://github.com/settings/developers
   - Copy `config.sample.json` to `config.json`
   - Update `config.json` with your GitHub OAuth app credentials:
     ```json
     {
       "github": {
         "clientId": "your-github-client-id",
         "clientSecret": "your-github-client-secret"
       }
     }
     ```
   - Note: Never commit `config.json` to version control!

3. Build icons:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension directory

## Usage

1. Click the LinkStack extension icon in your browser
2. First time: Authenticate with GitHub using the device flow
3. The extension will automatically extract information from the current page
4. Add any tags and notes
5. Click "Save" to sync the link to your GitHub repository

## Authentication

The extension uses GitHub's device flow authentication, which is secure and doesn't require storing any client secrets. When you first use the extension:

1. Click "Start Authentication"
2. You'll see a device code
3. Click the link to open GitHub
4. Enter the code shown in the extension
5. Authorize the application

Your GitHub access token will be securely stored in the extension's storage.

## Project Structure

```
├── manifest.json           # Extension configuration
├── src/
│   ├── auth/              # Authentication logic
│   ├── github/            # GitHub API integration
│   ├── content/           # Content scripts
│   └── background/        # Background service worker
├── popup/                 # Extension popup UI
├── icons/                 # Extension icons
└── scripts/              # Build scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Publishing to Chrome Web Store

1. Create a production build:
```bash
# Set your production GitHub OAuth credentials
export GITHUB_DEVICE_CLIENT_ID="your-prod-device-client-id"
export GITHUB_DEVICE_CLIENT_SECRET="your-prod-device-client-secret"
export GITHUB_WEB_CLIENT_ID="your-prod-web-client-id"
export GITHUB_WEB_CLIENT_SECRET="your-prod-web-client-secret"

# Build the extension
npm run build
```

This will create `linkstack-extension.zip` in the project root.

2. Create a Chrome Web Store account:
   - Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign up for a developer account
   - Pay one-time registration fee ($5)

3. Create new item:
   - Click "New Item" in the dashboard
   - Upload the generated `linkstack-extension.zip`
   - Fill in store listing details:
     * Description
     * Screenshots
     * Store icon
     * Category (Productivity recommended)
     * Privacy practices
   - Submit for review

The review process typically takes a few business days. Once approved, your extension will be available in the Chrome Web Store!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
