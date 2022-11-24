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
})
