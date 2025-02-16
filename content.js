console.log("Content script loaded");

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    let authorizationHeader = null;
    let browserTokenHeader = null;

    for (const header of details.requestHeaders) {
      console.log('heasder', header);
      if (header.name === 'authorization') {
        authorizationHeader = header.value;
      }
      if (header.name === 'browser-token') {
        browserTokenHeader = header.value;
      }
    }

    if (authorizationHeader && browserTokenHeader) {
      chrome.runtime.sendMessage({
        type: "storeHeader",
        data: {
          authorization: authorizationHeader,
          browserToken: browserTokenHeader
        }
      });
    }

    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["https://studio-api.prod.suno.com/api/feed/v2?page*"] },
  ["requestHeaders", "extraHeaders"]
);
