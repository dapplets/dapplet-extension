import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

export function startTracing() {
    if (EXTENSION_ENV !== "production") return;

    Sentry.init({
        dsn: "https://41ee3f6e2cdc41b89f14b6377d56d1d5@o880231.ingest.sentry.io/5833728",
        integrations: [new Integrations.BrowserTracing()],
        release: `dapplet-extension@${EXTENSION_VERSION}`,
        tracesSampleRate: 1.0,
        ignoreErrors: ['ResizeObserver loop limit exceeded'],
    });
}