import { test, expect, chromium, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';

const locales = ['en', 'es', 'fr', 'de', 'zh_CN', 'ar', 'ru', 'pt', 'hi', 'ur'];
const catalogs: Record<string, Record<string, string>> = JSON.parse(await readFile('packages/i18n/catalogs.json', 'utf8'));

async function jobCount(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('alcydeo-cloud', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<number>((resolve, reject) => {
        const request = db.transaction('jobs').objectStore('jobs').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

test('Cloud cleanup is localized, keyboard accessible and remains local in ten languages', async () => {
  test.setTimeout(90_000);
  const extension = resolve(process.env.ALCYDEO_EXTENSION_PATH ?? process.env.ALCYDEO_TEST_EXTENSION ?? 'apps/extension/.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    executablePath: process.env.CHROMIUM_PATH,
    channel: process.env.CHROMIUM_PATH ? undefined : 'chromium',
    headless: true,
    args: [`--load-extension=${extension}`, `--disable-extensions-except=${extension}`, '--no-sandbox', '--test-type']
  });
  const httpsRequests: string[] = [];
  await context.route('https://**/*', route => {
    httpsRequests.push(route.request().url());
    return route.abort();
  });
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const base = `chrome-extension://${new URL(worker.url()).host}`;
    const page = await context.newPage();
    await page.goto(`${base}/manager.html#cloud`);
    let navigations = 0;
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
    expect(await jobCount(page)).toBe(0);
    await page.getByLabel(catalogs.en!.cloudChooseFile!, { exact: true }).setInputFiles('fixtures/media/low.mp4');
    await expect(page.locator('.selected-cloud-file')).toHaveCount(1);
    const cleanup = page.locator('.cloud-cleanup');
    const button = cleanup.locator('[data-cloud-cleanup]');
    const hint = cleanup.locator('p').first();
    await expect(cleanup.getByRole('status')).toHaveCount(0);
    const evidence = 'artifacts/evidence/cloud-cleanup-0.1.58';
    await mkdir(evidence, { recursive: true });

    for (const locale of locales) {
      await test.step(locale, async () => {
        const messages = catalogs[locale]!;
        await page.evaluate(language => chrome.storage.local.set({ language }), locale);
        await expect(page.locator('html')).toHaveAttribute('lang', locale.replace('_', '-'));
        await expect(page.locator('html')).toHaveAttribute('dir', ['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr');
        await expect(button).toBeEnabled();
        await expect(button).toHaveAccessibleName(messages.cloudClearTemporary!);
        await expect(hint).toHaveText(messages.cloudClearTemporaryHint!);

        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 950 });
          for (const theme of ['light', 'dark']) {
            await page.evaluate(async value => {
              document.documentElement.dataset.theme = value;
              await document.fonts.ready;
              await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            }, theme);
            await cleanup.scrollIntoViewIfNeeded();
            await page.locator('[data-cloud-all]').focus();
            await page.keyboard.press('Tab');
            await expect(button).toBeFocused();
            expect(await button.evaluate(element => {
              const style = getComputedStyle(element);
              return element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
            })).toBe(true);
            await expect(hint).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect(await cleanup.evaluate(element => [element, ...element.children].every(child => {
              const bounds = child.getBoundingClientRect();
              return bounds.left >= 0 && bounds.right <= innerWidth && child.scrollWidth <= child.clientWidth + 1;
            }))).toBe(true);
            if (['fr', 'de', 'ur'].includes(locale)) {
              await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
              await page.mouse.move(0, 0);
              await page.screenshot({ path: `${evidence}/${locale}-${theme}-${width}.png`, fullPage: true, animations: 'disabled' });
            }
          }
        }
        await expect(page.locator('.cloud-jobs .task-card')).toHaveCount(0);
        expect(await jobCount(page)).toBe(0);
        expect(httpsRequests).toEqual([]);
      });
    }

    await button.click();
    await expect(cleanup.getByRole('status')).toHaveText(catalogs.ur!.cloudTemporaryCleared!);
    await expect(page.locator('.selected-cloud-file')).toHaveCount(0);
    await page.evaluate(() => chrome.storage.local.set({ language: 'fr' }));
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(cleanup.getByRole('status')).toHaveText(catalogs.fr!.cloudTemporaryCleared!);
    expect(navigations).toBe(0);
    expect(await jobCount(page)).toBe(0);
    expect(httpsRequests).toEqual([]);
  } finally {
    await context.close();
    expect(httpsRequests).toEqual([]);
  }
});
