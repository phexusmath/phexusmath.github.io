(function() {

    // Determine a unique ID based on the title or a global variable

    const prefix = document.title.replace(/\s+/g, '_') + "_";



    // Create a proxy to intercept storage calls

    const storageProxy = {

        getItem: (key) => window.parent.localStorage.getItem(prefix + key),

        setItem: (key, value) => window.parent.localStorage.setItem(prefix + key, value),

        removeItem: (key) => window.parent.localStorage.removeItem(prefix + key),

        clear: () => {

            // Be careful! Only clear keys starting with this game's prefix

            Object.keys(window.parent.localStorage).forEach(k => {

                if(k.startsWith(prefix)) window.parent.localStorage.removeItem(k);

            });

        }

    };



    // Replace the global localStorage inside the iframe's scope

    Object.defineProperty(window, 'localStorage', {

        get: () => storageProxy

    });

})();
