import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const logs = [];

    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
        console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', err => {
        logs.push(`[PAGE ERROR] ${err.toString()}`);
        console.log(`[PAGE ERROR] ${err.toString()}`);
    });

    await page.goto('http://localhost:5174/schooltool', { waitUntil: 'networkidle0' });

    try {
        const startBtn = await page.$('button ::-p-text(開始體驗)');
        if (startBtn) await startBtn.click();
        await new Promise(r => setTimeout(r, 500));
    } catch (e) { console.log(e.message); }

    try {
        const classBtn = await page.$('button ::-p-text(回教室)');
        if (classBtn) await classBtn.click();
        await new Promise(r => setTimeout(r, 500));
    } catch (e) { console.log(e.message); }

    try {
        const btn = await page.$('button ::-p-text(班級經營)');
        if (btn) await btn.click();
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) { console.log(e.message); }

    console.log('================ DONE ================');
    try {
        const viteError = await page.evaluate(() => {
            const overlay = document.querySelector('vite-error-overlay');
            return overlay ? overlay.shadowRoot.innerHTML : null;
        });
        if (viteError) console.log('VITE ERROR OVERLAY:', viteError.substring(0, 1000));
    } catch (e) { }

    await browser.close();
})();
