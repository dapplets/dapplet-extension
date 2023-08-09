import { defineConfig } from 'cypress'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export default defineConfig({
  defaultCommandTimeout: 25000,
  e2e: {
    setupNodeEvents(on) {
      on('before:browser:launch', (_, launchOptions) => {
        const extensionDirectory = path.join(__dirname, 'build')
        launchOptions.extensions.push(extensionDirectory)
        return launchOptions
      })
    },
    video: false,
    viewportWidth: 1920,
    viewportHeight: 1080,
  },
  chromeWebSecurity: false,
  includeShadowDom: true,
  ...(process.env.CYPRESS_TOKEN
    ? {
        reporter: 'cypress-multi-reporters',
        reporterOptions: {
          reporterEnabled: 'cypress-mochawesome-reporter, cypress-qase-reporter',
          cypressMochawesomeReporterReporterOptions: {
            charts: true,
          },
          cypressQaseReporterReporterOptions: {
            apiToken: process.env.CYPRESS_TOKEN,
            projectCode: 'DE',
            logging: true,
            screenshotFolder: 'screenshots',
            sendScreenshot: true,
            runComplete: true,
          },
        },
      }
    : {}),
})
