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

    // Update every 2 seconds
    setInterval(updateHeaderDisplay, 2000);
    document.getElementById('refreshBtn').addEventListener('click', updateHeaderDisplay);
    updateHeaderDisplay();
});
