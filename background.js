let headerData = { authorization: null, browserToken: null };
let debugLog = [];

function addDebugLog(message) {
    console.log('[Background]', message);
    debugLog.unshift({ timestamp: new Date().toISOString(), message });
    if (debugLog.length > 50) debugLog.pop();
}

addDebugLog('Background script loaded');

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        addDebugLog(`Request intercepted: ${details.url}`);
        console.log('Full request details:', details);

        if (details.requestHeaders) {
            details.requestHeaders.forEach(header => {
                const name = header.name.toLowerCase();
                if (name === 'authorization') {
                    headerData.authorization = header.value;
                    addDebugLog(`Authorization header captured: ${header.value.substring(0, 20)}...`);
                }
                if (name === 'browser-token') {
                    headerData.browserToken = header.value;
                    addDebugLog(`Browser-token header captured: ${header.value.substring(0, 20)}...`);
                }
            });
        }
        return { requestHeaders: details.requestHeaders };
    },
    {
        urls: ["*://*.suno.com/*"]
    },
    ["requestHeaders"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    addDebugLog(`Message received: ${JSON.stringify(message)}`);
    if (message.type === "getHeaders") {
        addDebugLog(`Sending headers to popup: ${JSON.stringify(headerData)}`);
        sendResponse({
            data: headerData,
            debug: debugLog
        });
        return true;
    }
});


