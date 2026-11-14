import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';

const locales = ['en', 'es', 'fr', 'de', 'zh_CN', 'ar', 'ru', 'pt', 'hi', 'ur'];
const catalogs: Record<string, Record<string, string>> = JSON.parse(await readFile('packages/i18n/catalogs.json', 'utf8'));

test('file concurrency and connections per file are independent persisted settings in ten languages', async () => {
  test.setTimeout(120_000);
  const extension = resolve(process.env.ALCYDEO_EXTENSION_PATH ?? process.env.ALCYDEO_TEST_EXTENSION ?? 'apps/extension/.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    executablePath: process.env.CHROMIUM_PATH,
    channel: process.env.CHROMIUM_PATH ? undefined : 'chromium',
    headless: true,
    args: [`--load-extension=${extension}`, `--disable-extensions-except=${extension}`, '--no-sandbox', '--test-type']
  });
  const networkRequests: string[] = [];
  await context.route(/^https?:\/\//, route => {
    networkRequests.push(route.request().url());
    return route.abort();
  });
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const base = `chrome-extension://${new URL(worker.url()).host}`;
    const page = await context.newPage();
    await page.goto(`${base}/manager.html#settings`);
    const section = page.locator('[data-concurrent-downloads]');
    await expect(section.getByLabel(catalogs.en!.concurrentFiles!, { exact: true })).toHaveValue('1');

    // A stored pre-0.1.60 preference has no file-concurrency field.
    await page.evaluate(async () => {
      const response = await chrome.runtime.sendMessage({ type: 'snapshot' });
      if (!response?.ok) throw new Error('Cannot read settings fixture');
      const settings: Record<string, unknown> = response.data.settings;
      delete settings.maxConcurrentFiles;
      await chrome.storage.local.set({ language: 'en', settings: { ...settings, multipart: true, connections: 2 } });
    });
    expect(await page.evaluate(async () => Object.hasOwn((await chrome.storage.local.get('settings')).settings, 'maxConcurrentFiles'))).toBe(false);
    await page.reload();
    await expect(section.getByLabel(catalogs.en!.concurrentFiles!, { exact: true })).toHaveValue('1');
    await expect(page.getByLabel(catalogs.en!.multipartConnections!, { exact: true })).toHaveValue('2');
    const evidence = 'artifacts/evidence/concurrency-0.1.60';
    await mkdir(evidence, { recursive: true });

    for (const locale of locales) {
      await test.step(locale, async () => {
        const messages = catalogs[locale]!;
        await page.evaluate(language => chrome.storage.local.set({ language }), locale);
        await expect(page.locator('html')).toHaveAttribute('lang', locale.replace('_', '-'));
        await expect(page.locator('html')).toHaveAttribute('dir', ['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr');
        await expect(section.getByRole('heading', { name: messages.concurrentDownloads!, exact: true })).toBeVisible();
        const files = section.getByLabel(messages.concurrentFiles!, { exact: true });
        const multipart = page.locator('.multipart-settings');
        const connections = multipart.getByLabel(messages.multipartConnections!, { exact: true });
        await expect(files).toHaveAccessibleName(messages.concurrentFiles!);
        await expect(files.locator('option')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8']);
        expect(await files.evaluate((select: HTMLSelectElement) => Array.from(select.options, option => option.value))).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
        await expect(section.getByText(messages.concurrentFilesHint!, { exact: true })).toBeVisible();
        await expect(section.getByText(messages.concurrentFilesChangeHint!, { exact: true })).toBeVisible();
        await expect(connections).toHaveAccessibleName(messages.multipartConnections!);
        await expect(connections.locator('option')).toHaveText(['2', '4', '8']);
        expect(await connections.evaluate((select: HTMLSelectElement) => Array.from(select.options, option => option.value))).toEqual(['2', '4', '8']);

        await multipart.getByLabel(messages.multipartEnable!, { exact: true }).check();
        await connections.selectOption('2');
        await files.selectOption('4');
        await expect(connections).toHaveValue('2');
        await connections.selectOption('8');
        await expect(files).toHaveValue('4');
        await page.locator('.settings-savebar').getByRole('button', { name: messages.save!, exact: true }).click();
        await expect(page.locator('.settings-savebar [role="status"]')).toHaveText(messages.saved!);
        await page.reload();
        await expect(files).toHaveValue('4');
        await expect(connections).toHaveValue('8');
        await expect(multipart.getByLabel(messages.multipartEnable!, { exact: true })).toBeChecked();
        expect(await page.evaluate(async () => (await chrome.storage.local.get('settings')).settings)).toMatchObject({ maxConcurrentFiles: 4, connections: 8, multipart: true });

        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1050 });
          for (const theme of ['light', 'dark']) {
            await page.getByLabel(messages.theme!, { exact: true }).selectOption(theme);
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
            await page.evaluate(async () => {
              await document.fonts.ready;
              await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            });
            await files.focus();
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            await expect(files).toBeFocused();
            expect(await files.evaluate(element => {
              const style = getComputedStyle(element);
              return element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
            })).toBe(true);
            await section.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 24, behavior: 'instant' }));
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            for (const panel of [section, multipart]) {
              expect(await panel.evaluate(element => [element, ...element.children].filter(child => !child.matches('.sr-only')).flatMap(child => {
                const bounds = child.getBoundingClientRect();
                return bounds.left >= 0 && bounds.right <= innerWidth && child.scrollWidth <= child.clientWidth + 1
                  ? []
                  : [{ tag: child.tagName, class: child.className, left: bounds.left, right: bounds.right, scrollWidth: child.scrollWidth, clientWidth: child.clientWidth }];
              }))).toEqual([]);
            }
            await expect(files).toBeInViewport();
            await expect(connections).toBeInViewport();
            if (['fr', 'de', 'ur'].includes(locale)) {
              await page.mouse.move(0, 0);
              await page.screenshot({ path: `${evidence}/${locale}-${theme}-${width}.png`, animations: 'disabled' });
            }
          }
        }
        expect(networkRequests).toEqual([]);
      });
    }
  } finally {
    await context.close();
    expect(networkRequests).toEqual([]);
  }
});
