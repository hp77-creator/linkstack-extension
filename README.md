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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
