const storageProxy = {
    getItem: (key) => window.parent.localStorage.getItem(prefix + key),
    setItem: (key, value) => window.parent.localStorage.setItem(prefix + key, value),
    removeItem: (key) => window.parent.localStorage.removeItem(key),
    // Add these for full compatibility:
    get length() { 
        return Object.keys(window.parent.localStorage).filter(k => k.startsWith(prefix)).length; 
    },
    key: (i) => {
        const keys = Object.keys(window.parent.localStorage).filter(k => k.startsWith(prefix));
        return keys[i] ? keys[i].replace(prefix, '') : null;
    },
    clear: () => {
        Object.keys(window.parent.localStorage).forEach(k => {
            if(k.startsWith(prefix)) window.parent.localStorage.removeItem(k);
        });
    }
};