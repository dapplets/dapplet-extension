import { init } from './injector'

var observer = new MutationObserver(() => {
    if (document.body) {
        init(); //.catch((err) => console.error("[Dapplet Extension] " + err));
        observer.disconnect();
    }
});
observer.observe(document.documentElement, { childList: true });