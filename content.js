if (!document.querySelector('script[data-injected="true"]')) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.setAttribute('data-injected', 'true'); // Mark this script as injected
    document.body.appendChild(script);
}

// Listen for the data from the injected script
window.addEventListener('message', function (event) {
    if (event.data.type === "FROM_PAGE") {
        chrome.runtime.sendMessage({
            type: "URL_LIST",
            data: event.data.data
        });
    }
});
