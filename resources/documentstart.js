// Near Wallet displays "Unknown App" for transactions with empty HTTP header "referer"
// It's a workaround replacing document.referrer value
if (new URL(document.location.href).searchParams.get('referrer') === 'Dapplets Extension') {
    const script = document.createElement('script');
    script.textContent = `Object.defineProperty(document, "referrer", { value: "https://dapplets-extension/", writable: true, configurable: true });`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}