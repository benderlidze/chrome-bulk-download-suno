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

    async function testApi() {
        try {
            const response = await chrome.runtime.sendMessage({ type: "getHeaders" });
            const data = response?.data || {};

            console.log('Using headers:', data); // Debug log

            const apiResponse = await fetch("https://studio-api.prod.suno.com/api/feed/v2?page=0", {
                headers: {
                    "accept": "*/*",
                    "accept-language": "en,ru;q=0.9,uk;q=0.8",
                    "affiliate-id": "undefined",
                    "authorization": data.authorization || "",
                    "browser-token": data.browserToken || "",
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

            console.log('API Response status:', apiResponse.status); // Debug log
            const responseData = await apiResponse.json(); // Changed from response to apiResponse

            document.getElementById("apiResponse").innerHTML =
                `<strong>API Response:</strong><br>${JSON.stringify(responseData, null, 2)}`;
        } catch (error) {
            console.error('API Error:', error); // Debug log
            document.getElementById("apiResponse").innerHTML =
                `<strong>Error:</strong><br>${error.message}`;
        }
    }

    document.getElementById('testApiBtn').addEventListener('click', testApi);

    // Update every 2 seconds
    setInterval(updateHeaderDisplay, 2000);
    document.getElementById('refreshBtn').addEventListener('click', updateHeaderDisplay);
    updateHeaderDisplay();
});
