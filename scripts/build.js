import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('🏗️  Building extension...');

    // Create build directory
    await fs.rm('build', { recursive: true, force: true });
    await fs.mkdir('build');

    // Copy necessary files
    const filesToCopy = [
      'manifest.json',
      'background',
      'content',
      'popup',
      'options',
      'icons'
    ];

    for (const file of filesToCopy) {
      const source = path.join(process.cwd(), file);
      const dest = path.join(process.cwd(), 'build', file);
      
      const stats = await fs.stat(source);
      if (stats.isDirectory()) {
        await execAsync(`cp -R "${source}" "${dest}"`);
      } else {
        await fs.copyFile(source, dest);
      }
    }

    // Create production config.json
    const prodConfig = {
      github: {
        deviceFlow: {
          clientId: process.env.GITHUB_DEVICE_CLIENT_ID || 'your-device-flow-client-id',
          clientSecret: process.env.GITHUB_DEVICE_CLIENT_SECRET || 'your-device-flow-client-secret'
        },
        webFlow: {
          clientId: process.env.GITHUB_WEB_CLIENT_ID || 'your-web-flow-client-id',
          clientSecret: process.env.GITHUB_WEB_CLIENT_SECRET || 'your-web-flow-client-secret'
        }
      }
    };

    await fs.writeFile(
      path.join(process.cwd(), 'build', 'config.json'),
      JSON.stringify(prodConfig, null, 2)
    );

    // Create ZIP file
    await execAsync('cd build && zip -r ../linkstack-extension.zip .');
    
    console.log('✅ Build complete! Extension package created: linkstack-extension.zip');
    console.log('\nTo publish to Chrome Web Store:');
    console.log('1. Go to https://chrome.google.com/webstore/devconsole');
    console.log('2. Click "New Item"');
    console.log('3. Upload linkstack-extension.zip');
    console.log('4. Fill in store listing details');
    console.log('5. Pay one-time developer registration fee ($5) if not already done');
    console.log('6. Submit for review\n');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
