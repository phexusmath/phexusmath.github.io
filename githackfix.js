(function() {
    const base = document.querySelector('base')?.href;
    if (!base) return;

    // 1. Fix Fetch API
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string' && input.startsWith('/')) {
            // Remove the leading slash and join with base
            input = base + input.slice(1);
        }
        return originalFetch(input, init);
    };

    // 2. Fix XMLHttpRequest (for older games/engines)
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && url.startsWith('/')) {
            url = base + url.slice(1);
        }
        return originalOpen.apply(this, arguments);
    };
})();