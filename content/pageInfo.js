// Content script to extract page information
function extractPageInfo() {
  // Get meta tags
  const metaTags = document.getElementsByTagName('meta');
  const meta = {};
  
  for (const tag of metaTags) {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (name && content) {
      meta[name] = content;
    }
  }

  // Extract preview image
  let previewImageUrl = meta['og:image'] || // Open Graph
                       meta['twitter:image'] || // Twitter Cards
                       document.querySelector('link[rel="image_src"]')?.href; // Image source

  // If no social media preview, try to get first image
  if (!previewImageUrl) {
    const firstImage = document.querySelector('img');
    if (firstImage && firstImage.src) {
      previewImageUrl = firstImage.src;
    }
  }

  // Get page description
  const description = meta['og:description'] || // Open Graph
                     meta['description'] || // Standard meta
                     meta['twitter:description']; // Twitter Cards

  return {
    url: window.location.href,
    title: document.title,
    description: description || '',
    previewImageUrl: previewImageUrl || null,
    type: 'OTHER' // Default type
  };
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    sendResponse(extractPageInfo());
  }
});

// Also expose for direct access if needed
window.extractPageInfo = extractPageInfo;
