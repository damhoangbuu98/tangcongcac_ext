load('config.js');

// One server per HLS quality (best first) plus a page sniff as the last resort.
// Each `data` keeps the watch page so track.js can fetch fresh links once these expire.
function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let sources = hlsSources(extractFlashvars(response.text()));
    let now = Date.now();

    let servers = [];
    for (let i = 0; i < sources.length; i++) {
        let source = sources[i];
        servers.push({
            title: source.quality ? source.quality + "p" : "HLS",
            data: JSON.stringify({ page: url, quality: source.quality, url: source.url, at: now })
        });
    }
    let key = viewKey(url);
    servers.push({
        title: "Tự dò từ trang",
        data: JSON.stringify({ page: url, kind: "auto", embed: key ? BASE_URL + "/embed/" + key : "" })
    });
    return Response.success(servers);
}
