import { expect, test } from '../../fixtures/dapplet-runner'
import { Dapplets } from '../../pages/dapplets'
import { Overlay } from '../../pages/overlay'

const devServerUrl = 'http://localhost:3000/dapplet.json'

// ToDo: qase 62

test('should open settings of a disabled published dapplet', async ({ page, skipOnboarding }) => {
  const dappletId = 'twitter-demo-published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()

  await dapplets.openSettingsFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 63

test('should open settings of an enabled published dapplet from Dapplets list', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await dapplets.openSettingsFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 64

test('should open settings of a disabled not published dapplet', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()

  await dapplets.openSettingsFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 65

test('should open settings of an enabled not published dapplet from Dapplets list', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await dapplets.openSettingsFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 70

test('should open an overlay of a published dapplet from Dapplets list', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const dappletTitle = 'Demo Dapplet Published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await dapplets.openOverlayFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})

// ToDo: qase 71

test('should open an overlay of an unpublished dapplet from Dapplets list', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const dappletTitle = 'Demo Dapplet'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await dapplets.openOverlayFromDappletsList(dappletId)
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})

// ToDo: qase 72

test('should open an overlay of a published dapplet from the sidebar', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const dappletTitle = 'Demo Dapplet Published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await overlay.clickToggle()
  await dapplets.openOverlayFromToolbar(dappletTitle)
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})

// ToDo: qase 73

test('should open an overlay of an unpublished dapplet from the sidebar', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const dappletTitle = 'Demo Dapplet'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await overlay.clickToggle()
  await dapplets.openOverlayFromToolbar(dappletTitle)
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})

// ToDo: qase 74

test('should open settings of a enabled published dapplet from the toolbar', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const dappletTitle = 'Demo Dapplet Published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await overlay.clickToggle()
  await dapplets.openSettingsFromToolbar(dappletTitle)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 75

test('should open settings of a enabled not published dapplet from the toolbar', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const dappletTitle = 'Demo Dapplet'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)
  await expect(page.getByTitle('Home')).toBeVisible()

  await overlay.clickToggle()
  await dapplets.openSettingsFromToolbar(dappletTitle)
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 76

test('should open dapplet settings after its overlay opening, published dapplet', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)

  await dapplets.openOverlayFromDappletsList(dappletId)

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Settings]').click()
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 77

test('should open dapplet settings after its overlay opening, unpublished dapplet', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)

  await dapplets.openOverlayFromDappletsList(dappletId)

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Settings]').click()
  await expect(page.getByTestId('dapplet-settings-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-settings-id')).toContainText(dappletId)
})

// ToDo: qase 78

test('should open dapplet settings after its overlay opening and go back to the overlay, published dapplet', async ({
  page,
  skipOnboarding,
}) => {
  const dappletId = 'twitter-demo-published'
  const dappletTitle = 'Demo Dapplet Published'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)

  await dapplets.openOverlayFromDappletsList(dappletId)

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Settings]').click()

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Home]').click()
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})

// ToDo: qase 79

test('should open dapplet settings after its overlay opening and go back to the overlay, unpublished dapplet', async ({
  page,
  skipOnboarding,
  enableDevMode,
  enableDevServer,
}) => {
  const dappletId = 'twitter-demo'
  const dappletTitle = 'Demo Dapplet'
  const overlay = new Overlay(page)
  const dapplets = new Dapplets(page)

  await page.goto('/')
  await overlay.goto()
  await skipOnboarding()
  await enableDevMode()
  await enableDevServer(devServerUrl)
  await overlay.clickToggle()
  await dapplets.activateDapplet(dappletId)

  await dapplets.openOverlayFromDappletsList(dappletId)

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Settings]').click()

  await page.getByTestId('dapplet-overlay-wrapper').locator('[title=Home]').click()
  await expect(page.getByTestId('dapplet-overlay-wrapper')).toBeVisible()
  await expect(page.getByTestId('dapplet-title')).toContainText(dappletTitle)
})
