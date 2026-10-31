load('config.js');

// Servers: the HLS link, its backup on another CDN, and a page sniff as the last resort.
// Each `data` keeps the watch page so track.js can fetch fresh links once these expire.
function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let streams = pickStreams(parseInitials(response.text()));
    let now = Date.now();

    let servers = [];
    if (streams.primary) {
        servers.push({ title: "HLS", data: JSON.stringify({ page: url, kind: "primary", url: streams.primary, at: now }) });
    }
    if (streams.fallback) {
        servers.push({ title: "HLS dự phòng", data: JSON.stringify({ page: url, kind: "fallback", url: streams.fallback, at: now }) });
    }
    servers.push({ title: "Tự dò từ trang", data: JSON.stringify({ page: url, kind: "auto" }) });
    return Response.success(servers);
}
