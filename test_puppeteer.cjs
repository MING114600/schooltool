const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const logs = [];

    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', err => {
        logs.push(`[PAGE ERROR] ${err.toString()}`);
    });

    await page.goto('http://localhost:5174/schooltool', { waitUntil: 'networkidle0' });

    try {
        await page.click('button:has-text("開始體驗")');
        await new Promise(r => setTimeout(r, 500));
    } catch (e) { }

    try {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('回教室'));
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 500));
    } catch (e) { }

    try {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('班級經營'));
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) { }

    console.log('================ LOGS ================');
    console.dir(logs, { maxArrayLength: null });
    await browser.close();
})();
