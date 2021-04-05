// import * as puppeteer from 'puppeteer';
// import * as assert from 'assert';

// const manifest = require('../manifest.json');

// const extensionPath = 'build';

// let popupPage: puppeteer.Page = null;
// let browser: puppeteer.Browser = null;

// describe('Extension UI Testing', function () {
//   this.timeout(60000); // default is 2 seconds and that may not be enough to boot browsers and pages.
//   before(async function () {
//     await boot();
//   });

//   describe('Popup', async function () {
//     it('Feature activation and deactivation', async function () {

//       // popupPage.on("pageerror", (err) => assert.fail(err.message));
//       // popupPage.on("error", (err) => assert.fail(err.message));

//       await activateAndDeactivateFeatures();
//     })
//   });

//   after(async function () {
//     await browser.close();
//   });
// });

// async function boot() {
//   browser = await puppeteer.launch({
//     headless: false, // extension are allowed only in head-full mode
//     args: [
//       `--disable-extensions-except=${extensionPath}`,
//       `--load-extension=${extensionPath}`,
//       '--no-sandbox',
//       '--disable-setuid-sandbox'
//     ]
//   });

//   const contextPage = await browser.newPage();
//   await contextPage.goto('https://twitter.com/ethernian');
//   await contextPage.waitFor(1000); // arbitrary wait time.

//   const targets = await browser.targets();
//   const extensionTarget = targets.find((t) => {
//     return t['_targetInfo'].title === manifest.name;
//   });

//   const extensionUrl = extensionTarget['_targetInfo'].url || '';
//   const [, , extensionID] = extensionUrl.split('/');
//   const extensionPopupHtml = manifest.browser_action.default_popup;

//   popupPage = await browser.newPage();
//   await popupPage.goto(`chrome-extension://${extensionID}/${extensionPopupHtml}?tabUrl=${contextPage.url()}`);
// }

// async function activateAndDeactivateFeatures() {
//   const buttonsSelector = '#app > div > div > div.ui.segment.internalTab > div.ui.divided.relaxed.list > div > div:nth-child(2) > div > input';
//   await popupPage.waitFor(buttonsSelector);
//   const buttons = await popupPage.$$(buttonsSelector);

//   for (const button of buttons) {
//     await popupPage.waitFor(300);
//     await button.click();
//   }

//   await popupPage.waitForFunction(
//     (selector) => document.querySelectorAll(selector).length === 0,
//     {},
//     '#app > div > div > div.ui.segment.internalTab > div.ui.divided.relaxed.list > div > div:nth-child(2) > div.disabled'
//   );

//   // await popupPage.waitFor(1000);

//   for (const button of buttons) {
//     await popupPage.waitFor(300);
//     await button.click();
//   }

//   await popupPage.waitForFunction(
//     (selector) => document.querySelectorAll(selector).length === 0,
//     {},
//     '#app > div > div > div.ui.segment.internalTab > div.ui.divided.relaxed.list > div > div:nth-child(2) > div.disabled'
//   );

//   const errorsNumber = await popupPage.evaluate(() => document.querySelectorAll('#app > div > div > div.ui.segment.internalTab > div > div > div:nth-child(3) > div.header > div').length);

//   assert.strictEqual(errorsNumber, 0, 'Error labels found in the popup list.');
// }