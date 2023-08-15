import { chromium, test as base, Worker, type BrowserContext } from '@playwright/test'
import path from 'path'

export type BrowserOptions = {
  newHeadless: boolean
  context: BrowserContext
  extensionId: string
  background: Worker
}

export const test = base.extend<BrowserOptions>({
  newHeadless: [false, { option: true }],
  context: async ({ newHeadless }, use) => {
    const pathToExtension = path.join(__dirname, '../../../build')
    const args = [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ]

    if (newHeadless) {
      args.push('--headless=new')
    }

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args,
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
  background: async ({ context }, use) => {
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')
    await use(background)
  },
})

export const expect = test.expect
