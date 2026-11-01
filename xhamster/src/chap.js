load('config.js');

// Servers: the HLS link, its backup on another CDN, and a page sniff as the last resort.
// Each `data` keeps the watch page so track.js can fetch fresh links once these expire, plus the
// subtitles read from the same page.
function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let state = parseInitials(response.text());
    let streams = pickStreams(state);
    let subtitles = pickSubtitles(state);
    let now = Date.now();

    let servers = [];
    if (streams.primary) {
        servers.push({ title: "HLS", data: JSON.stringify({ page: url, kind: "primary", url: streams.primary, at: now, subs: subtitles }) });
    }
    if (streams.fallback) {
        servers.push({ title: "HLS dự phòng", data: JSON.stringify({ page: url, kind: "fallback", url: streams.fallback, at: now, subs: subtitles }) });
    }
    servers.push({ title: "Tự dò từ trang", data: JSON.stringify({ page: url, kind: "auto", subs: subtitles }) });
    return Response.success(servers);
}
