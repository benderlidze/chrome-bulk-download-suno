let capturedBearerToken = null;

chrome.action.onClicked.addListener(async (tab) => {
    // Inject the content script
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "URL_LIST") {
        //processDownloads(message.data);
        fetchAllFeeds();
    }
    // Optionally, trigger the fetchFeed function via message
    if (message.type === "FETCH_FEED") {
        fetchAllFeeds();
    }
});

// New code: Listen for requests matching the API endpoint to capture the bearer token
if (chrome.webRequest && chrome.webRequest.onBeforeSendHeaders) {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            if (details.requestHeaders) {
                for (const header of details.requestHeaders) {
                    if (header.name.toLowerCase() === "authorization") {
                        capturedBearerToken = header.value;
                        console.log("Captured bearer token:", capturedBearerToken);
                        break;
                    }
                }
            } else {
                console.error("No requestHeaders found in details");
            }
        },
        { urls: ["https://studio-api.prod.suno.com/api/feed/v2*"] },
        ["requestHeaders", "extraHeaders"]  // updated listener options
    );
} else {
    console.error("chrome.webRequest.onBeforeSendHeaders is not available.");
}

// New code: Function to perform the fetch call for a given page using the captured token
async function fetchFeedPage(page) {
    // Ensure token is ready
    if (!capturedBearerToken) {
        console.error("Captured bearer token not available. Retrying fetchFeedPage in 2 seconds...");
    }

    const response = await fetch(`https://studio-api.prod.suno.com/api/feed/v2?page=${page}`, {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: {
            "accept": "*/*",
            "accept-language": "en,ru;q=0.9,uk;q=0.8",
            "affiliate-id": "undefined",
            "authorization": capturedBearerToken,
            "browser-token": "{\"token\":\"...\"}", // existing browser-token value
            "cache-control": "no-cache",
            "device-id": "16db85b1-5b89-4610-9e57-2d4e5ba55798",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        referrer: "https://suno.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null
    });
    return response.json();
}

// Updated function: Function to fetch all pages and collect audio URLs from clips array
async function fetchAllFeeds() {
    try {
        // Get first page to determine total pages
        const firstData = await fetchFeedPage(0);
        const totalResults = firstData.num_total_results || 0;
        const clips = firstData.clips || [];
        // Assuming 20 items per page
        const totalPages = Math.ceil(totalResults / 20);
        let audioUrls = clips.map(item => item.audio_url).filter(url => url);

        // Iterate remaining pages (if any)
        for (let page = 1; page < totalPages; page++) {
            const data = await fetchFeedPage(page);
            if (data && data.clips) {
                audioUrls = audioUrls.concat(data.clips.map(item => item.audio_url).filter(url => url));
            }
        }
        console.log("Collected audio URLs:", audioUrls);
        // New: Download all MP3 files using audio URLs
        downloadMP3s(audioUrls);
    } catch (error) {
        console.error("Error in fetchAllFeeds:", error);
    }
}

// New function: Download all MP3 files from the given audio URLs
function downloadMP3s(urls) {
    urls.forEach((url, index) => {
        const filename = `audio_${index + 1}.mp3`;
        console.log(`Starting download: ${filename} from ${url}`);
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download failed:', chrome.runtime.lastError);
            } else {
                console.log(`Download started with ID: ${downloadId}`);
            }
        });
    });
}

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