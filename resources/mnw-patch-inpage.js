// Near Wallet displays "Unknown App" for transactions with empty HTTP header "referer"
// It's a workaround replacing document.referrer value
Object.defineProperty(document, 'referrer', {
  value: 'https://dapplets-extension/',
  writable: true,
  configurable: true,
})
