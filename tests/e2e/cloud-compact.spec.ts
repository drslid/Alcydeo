import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';

const catalogs: Record<string, Record<string, string>> = JSON.parse(await readFile('packages/i18n/catalogs.json', 'utf8'));
const original = await readFile('fixtures/media/low.mp4');
const filename = 'Original long lesson — '.repeat(12) + 'source.mp4';

test('compact Cloud keeps providers, file choices, actions and cleanup feedback usable in ten languages', async () => {
  test.setTimeout(90_000);
  const extension = resolve(process.env.ALCYDEO_EXTENSION_PATH ?? process.env.ALCYDEO_TEST_EXTENSION ?? 'apps/extension/.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: [`--load-extension=${extension}`, `--disable-extensions-except=${extension}`, '--no-sandbox', '--test-type']
  });
  const requests: string[] = [], errors: string[] = [];
  await context.route(/^https?:\/\//, route => { requests.push(route.request().url()); return route.abort(); });
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`chrome-extension://${new URL(worker.url()).host}/manager.html#cloud`);
    const composer = page.locator('.cloud-composer'), details = page.locator('.cloud-provider-details');
    const providers = page.locator('.cloud-provider'), summary = details.locator('summary');
    await expect(providers).toHaveCount(5);
    await page.getByLabel(catalogs.en!.cloudChooseFile!, { exact: true }).setInputFiles([
      { name: filename, mimeType: 'video/mp4', buffer: original },
      { name: 'Second original.mp4', mimeType: 'video/mp4', buffer: original }
    ]);
    await expect(page.locator('.selected-cloud-file')).toHaveCount(2);
    for (const [provider, key] of Object.entries({ gofile: 'gofilePublic', megaup: 'cloudMegaupHint', onefichier: 'cloudOnefichierHint', turbobit: 'cloudTurbobitHint', pcloud: 'cloudPcloudHint' })) {
      await page.locator(`[data-provider="${provider}"]`).click();
      await expect(details).not.toHaveAttribute('open');
      await summary.press('Enter');
      await expect(details).toHaveAttribute('open', '');
      await expect(details.getByText(catalogs.en![key]!, { exact: false })).toBeVisible();
      await summary.press('Enter');
    }
    const cleanup = page.locator('.cloud-cleanup'), cleanupButton = cleanup.locator('[data-cloud-cleanup]');
    const evidence = '.local/cloud-cast63/ui';
    await mkdir(evidence, { recursive: true });
    for (const [locale, c] of Object.entries(catalogs)) {
      await test.step(locale, async () => {
        await page.evaluate(language => chrome.storage.local.set({ language }), locale);
        await expect(page.locator('html')).toHaveAttribute('lang', locale.replace('_', '-'));
        await expect(page.locator('html')).toHaveAttribute('dir', ['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr');
        await expect(details).not.toHaveAttribute('open');
        await expect(summary).toContainText(c.cloudProviderDetails!);
        await expect(page.getByLabel(c.cloudPcloudDestination!, { exact: true })).toBeVisible();
        await expect(page.getByLabel(c.cloudPcloudDestination!, { exact: true })).toHaveValue('');
        await expect(page.getByRole('button', { name: c.cloudPcloudSend!, exact: false })).toBeDisabled();
        await expect(page.locator('[data-cloud-all]')).toBeEnabled();
        await expect(page.locator('[data-cloud-all]')).toHaveAccessibleName(c.cloudSendAll!);
        await expect(page.locator('[data-cloud-all]')).toContainText(c.cloudSendAllCompact!);
        await expect(cleanupButton).toHaveAccessibleName(c.cloudClearTemporary!);
        await expect(cleanupButton).toContainText(c.cloudClearTemporaryCompact!);
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const theme of ['light', 'dark']) {
            await page.evaluate(async value => {
              document.documentElement.dataset.theme = value;
              await document.fonts.ready;
              await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            }, theme);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const bounds = await composer.boundingBox();
            expect(bounds!.height).toBeLessThan(width === 390 ? 850 : 650);
            expect(await providers.evaluateAll(nodes => new Set(nodes.map(node => Math.round(node.getBoundingClientRect().top))).size)).toBe(1);
            const name = page.locator('.selected-cloud-file').first();
            await expect(name).toHaveAttribute('title', filename);
            expect(await name.evaluate(element => {
              const style = getComputedStyle(element);
              return style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap' && element.scrollWidth > element.clientWidth;
            })).toBe(true);
            for (const target of [providers.first(), providers.last(), page.locator('[data-cloud-all]'), cleanupButton]) {
              const box = await target.boundingBox();
              expect(box!.x).toBeGreaterThanOrEqual(0);
              expect(box!.x + box!.width).toBeLessThanOrEqual(width);
            }
            await summary.focus();
            await page.keyboard.press('Enter');
            await expect(details.getByText(c.cloudPcloudHint!, { exact: true })).toBeVisible();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Tab');
            await expect(page.locator('[data-cloud-all]')).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(cleanupButton).toBeFocused();
            expect(await cleanupButton.evaluate(element => element.matches(':focus-visible'))).toBe(true);
            if (['fr', 'de', 'ur'].includes(locale)) {
              await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
              await page.screenshot({ path: `${evidence}/${locale}-${theme}-${width}.png`, fullPage: true, animations: 'disabled' });
            }
          }
        }
        await expect(page.locator('.cloud-jobs .task-card')).toHaveCount(0);
        expect(requests).toEqual([]);
      });
    }

    await page.evaluate(async () => {
      await new Promise<void>(entered => {
        void navigator.locks.request('alcydeo:cloud-upload', async () => {
          entered();
          await new Promise<void>(release => { (window as any).__releaseCompactCleanup = release; });
        });
      });
    });
    await cleanupButton.click();
    await expect(cleanup.getByRole('alert')).toHaveText(catalogs.ur!.cloudTemporaryBusy!);
    await expect(page.locator('.selected-cloud-file')).toHaveCount(2);
    await expect(composer.locator(':scope > [role="alert"]')).toHaveCount(0);
    await page.evaluate(() => (window as any).__releaseCompactCleanup());
    await expect.poll(() => page.evaluate(async () => (await navigator.locks.query()).held?.some(lock => lock.name === 'alcydeo:cloud-upload'))).toBe(false);
    await cleanupButton.click();
    await expect(cleanup.getByRole('alert')).toHaveCount(0);
    await expect(cleanup.getByRole('status')).toHaveText(catalogs.ur!.cloudTemporaryCleared!);
    await expect(page.locator('.selected-cloud-file')).toHaveCount(0);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    expect(requests).toEqual([]);
  }
});
