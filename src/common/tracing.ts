import * as Sentry from '@sentry/browser'

export function startTracing() {
  const IS_SERVICE_WORKER = typeof window === 'undefined'

  if (EXTENSION_ENV !== 'production') return
  if (!IS_SERVICE_WORKER && window['DAPPLETS_JSLIB'] === true) return // ToDo: log errors in jslib

  Sentry.init({
    dsn: 'https://41ee3f6e2cdc41b89f14b6377d56d1d5@o880231.ingest.sentry.io/5833728',
    integrations: IS_SERVICE_WORKER ? [] : [new Sentry.BrowserTracing()], // ToDo: split bundles for service worker and content script
    release: `dapplet-extension@${EXTENSION_VERSION}`,
    tracesSampleRate: 1.0,
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
  })
}
