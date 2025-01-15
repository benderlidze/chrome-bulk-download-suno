chrome.action.onClicked.addListener(async (tab) => {
    // Inject the content script
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "URL_LIST") {
        processDownloads(message.data);
    }
});

async function processDownloads(items) {
    console.log(`Processing downloads:`, items);

    for (const item of items) {
        if (!item.link || !item.name) {
            console.log(`Skipping invalid item:`, item);
            continue;
        }

        const filename = `${item.name}.mp3`; // Assuming these are audio files
        console.log(`Starting download: ${filename}`);
        
        await downloadFile({
            url: item.link,
            filename: filename
        });

        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}


function downloadFile(item) {
    return new Promise((resolve) => {
        chrome.downloads.download({
            url: item.url,
            filename: item.filename,
            saveAs: false  // This will prompt for download location
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download failed:', chrome.runtime.lastError);
            }
            resolve(downloadId);
        });
    });
}