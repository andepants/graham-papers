const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set desktop width
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to print page
    await page.goto('http://localhost:3456/print', { waitUntil: 'networkidle2' });
    
    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capture full page screenshot
    await page.screenshot({ 
      path: '/opt/cursor/artifacts/print-page-desktop.png',
      fullPage: true
    });
    
    console.log('Captured print-page-desktop.png');

  } finally {
    await browser.close();
  }
})();
