console.log('Popup script loaded');

document.addEventListener('DOMContentLoaded', function () {
    console.log('Popup DOM loaded');

    function updateHeaderDisplay() {
        console.log('Requesting headers');
        chrome.runtime.sendMessage({ type: "getHeaders" }, (response) => {
            console.log('Received response:', response);
            const data = response?.data || {};
            const debug = response?.debug || [];

            // Update headers
            let content = "";
            content += `<p><strong>Authorization:</strong> ${data.authorization || "N/A"}</p>`;
            content += `<p><strong>Browser-Token:</strong> ${data.browserToken || "N/A"}</p>`;
            document.getElementById("headerValues").innerHTML = content;

            // Update debug info
            const debugHtml = debug.map(entry =>
                `<div>[${entry.timestamp}] ${entry.message}</div>`
            ).join('');
            document.getElementById("debugInfo").innerHTML = debugHtml;
        });
    }

    async function fetchPage(headers, page) {
        console.log(`Fetching page ${page}...`);
        const apiResponse = await fetch(`https://studio-api.prod.suno.com/api/feed/v2?page=${page}`, {
            headers: {
                "accept": "*/*",
                "accept-language": "en,ru;q=0.9,uk;q=0.8",
                "affiliate-id": "undefined",
                "authorization": headers.authorization || "",
                "browser-token": headers.browserToken || "",
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
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include"
        });

        const jsonData = await apiResponse.json();
        console.log('Page', page, 'Response:', JSON.stringify(jsonData, null, 2));
        return jsonData;
    }

    async function testApi() {
        try {
            const response = await chrome.runtime.sendMessage({ type: "getHeaders" });
            const data = response?.data || {};

            // Debug headers
            document.getElementById("apiResponse").innerHTML = `<p>Attempting to fetch with headers...</p>`;
            console.log('Using headers:', JSON.stringify(data, null, 2));

            // Get first page to determine total results
            document.getElementById("apiResponse").innerHTML += `<p>Fetching first page...</p>`;
            const firstPageData = await fetchPage(data, 0);

            // Debug first page response
            console.log('First page data:', firstPageData);

            const totalResults = firstPageData.num_total_results;
            const itemsPerPage = 20;
            const totalPages = Math.ceil(totalResults / itemsPerPage);

            // Display pagination info
            document.getElementById("apiResponse").innerHTML += `
                <p>Total results: ${totalResults}</p>
                <p>Items per page: ${itemsPerPage}</p>
                <p>Total pages: ${totalPages}</p>
            `;

            // Array to store all audio URLs
            const audioUrls = [];

            // Process first page
            let firstPageUrls = 0;
            firstPageData.clips?.forEach(clip => {
                if (clip.audio_url) {
                    audioUrls.push(clip.audio_url);
                    firstPageUrls++;
                }
            });

            document.getElementById("apiResponse").innerHTML += `
                <p>Found ${firstPageUrls} URLs on first page</p>
            `;

            // Fetch remaining pages
            for (let page = 1; page < totalPages; page++) {
                document.getElementById("apiResponse").innerHTML += `<p>Fetching page ${page + 1}...</p>`;
                const pageData = await fetchPage(data, page);

                let pageUrls = 0;
                if (pageData.clips && Array.isArray(pageData.clips)) {
                    pageData.clips.forEach(clip => {
                        if (clip.audio_url) {
                            audioUrls.push(clip.audio_url);
                            pageUrls++;
                        }
                    });
                } else {
                    console.error('Invalid page data structure:', pageData);
                }

                document.getElementById("apiResponse").innerHTML += `
                    <p>Found ${pageUrls} URLs on page ${page + 1}</p>
                `;
            }

            // Display final results
            const urlList = audioUrls.map((url, index) =>
                `<li>${index + 1}. <a href="${url}" target="_blank">${url.split('/').pop()}</a></li>`
            ).join('');

            document.getElementById("apiResponse").innerHTML += `
                <hr>
                Results Summary:
                <p>Total URLs found: ${audioUrls.length}</p>
                <button class="download-btn" id="downloadAllBtn">Download All Files</button>
                <ul style="list-style-type: decimal;">
                    ${urlList}
                </ul>
            `;

            // Add click handler for download button
            document.getElementById('downloadAllBtn').addEventListener('click', async () => {
                const totalFiles = audioUrls.length;
                
                function downloadFile(item) {
                    return new Promise((resolve) => {
                        chrome.downloads.download({
                            url: item.url,
                            filename: item.filename,
                            saveAs: false
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('Download failed:', chrome.runtime.lastError);
                            }
                            resolve(downloadId);
                        });
                    });
                }

                for (let i = 0; i < totalFiles; i++) {
                    const url = audioUrls[i];
                    const filename = url.split('/').pop();
                    
                    try {
                        await downloadFile({
                            url: url,
                            filename: filename
                        });
                        
                        // Add a small delay between downloads
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.error(`Failed to download ${filename}:`, error);
                    }
                }
            });

        } catch (error) {
            console.error('API Error:', error);
            document.getElementById("apiResponse").innerHTML = `
                <strong>Error:</strong><br>
                ${error.message}<br>
                <pre>${error.stack}</pre>
            `;
        }
    }

    document.getElementById('testApiBtn').addEventListener('click', testApi);

    // Update every 2 seconds
    setInterval(updateHeaderDisplay, 2000);
    document.getElementById('refreshBtn').addEventListener('click', updateHeaderDisplay);
    updateHeaderDisplay();
});
