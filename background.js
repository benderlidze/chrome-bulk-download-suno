let headerData = { authorization: null, browserToken: null };
let debugLog = [];

function addDebugLog(message) {
    console.log(message);
    debugLog.unshift({ timestamp: new Date().toISOString(), message });
    if (debugLog.length > 50) debugLog.pop();
}

addDebugLog('Background script loaded');

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        addDebugLog(`Request intercepted: ${details.url}`);

        if (details.requestHeaders) {
            details.requestHeaders.forEach(header => {
                addDebugLog(`Header found: ${header.name}`);
                const name = header.name.toLowerCase();
                if (name === 'authorization') {
                    headerData.authorization = header.value;
                    addDebugLog('Authorization header captured');
                }
                if (name === 'browser-token') {
                    headerData.browserToken = header.value;
                    addDebugLog('Browser-token header captured');
                }
            });
        }
    },
    {
        urls: [
            "*://*.suno.com/*",
            "*://*.prod.suno.com/*",
            "https://studio-api.prod.suno.com/*"
        ]
    },
    ["requestHeaders"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "getHeaders") {
        addDebugLog('Sending headers to popup');
        addDebugLog(`Current headers: ${JSON.stringify(headerData)}`);
        sendResponse({
            data: headerData,
            debug: debugLog
        });
        return true;
    }
});


