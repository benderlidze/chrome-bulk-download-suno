(function() {
    // Check if the script has already been injected
    let injectedScript = document.querySelector('script[data-injected="true"]');
    
    if (!injectedScript) {
        // Create and inject the script if not already injected
        injectedScript = document.createElement('script');
        injectedScript.src = chrome.runtime.getURL('inject.js');
        injectedScript.setAttribute('data-injected', 'true');
        document.body.appendChild(injectedScript);
    }

    // Define the event listener function
    const handleMessage = (event) => {
        if (event.data.type === "FROM_PAGE") {
            chrome.runtime.sendMessage({
                type: "URL_LIST",
                data: event.data.data
            });

            // Cleanup: Remove injected script and event listener
            injectedScript.remove();
            window.removeEventListener('message', handleMessage);
        }
    };

    // Listen for the data from the injected script
    window.addEventListener('message', handleMessage);
})();
