import { defineConfig } from 'cypress'
import path from 'path'

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('before:browser:launch', (_, launchOptions) => {
        const extensionDirectory = path.join(__dirname, 'build')
        launchOptions.extensions.push(extensionDirectory)
        return launchOptions
      })
    },
    video: false,
  },
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'cypress-mochawesome-reporter, cypress-qase-reporter',
    cypressMochawesomeReporterReporterOptions: {
      charts: true,
    },
    cypressQaseReporterReporterOptions: {
      apiToken: '1daa8793fe74e3780aebb625a35d76c84c18cbaf',
      projectCode: 'DE',
      logging: true,
      // basePath: "https://api.qase.io/v1",
      screenshotFolder: 'screenshots',
      sendScreenshot: true,
      runComplete: true,
      // environmentId: 1,
      // rootSuiteTitle: "Cypress tests",
    },
  },
})
