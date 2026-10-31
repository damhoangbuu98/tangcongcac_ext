load('config.js');

// Servers live in an inline `$wp_servers = { 'AHS': '<embed url>', 'HY': '...' }` map.
// - AHS: the site's own JW Player page; its HLS playlist plays natively (track.js reads it).
// - HY: Abyss/Hydrax, unreachable from Vietnamese ISPs (TLS reset) — skipped.
// - anything else is left to the app's page sniffer.
function execute(url) {
    url = normalizeUrl(url);
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let text = response.text();

    let block = /\$wp_servers\s*=\s*\{([\s\S]*?)\}/.exec(text);
    if (!block) return Response.error("Không tìm thấy server phát của tập này");

    let servers = [];
    let pattern = /['"]([^'"]+)['"]\s*:\s*['"](https?:[^'"]+)['"]/g;
    let match;
    while ((match = pattern.exec(block[1])) !== null) {
        let name = match[1];
        let src = match[2].replace(/\\\//g, "/");
        if (/abyss|hydrax/i.test(src)) continue;
        let kind = src.indexOf("/embed-jw/") > 0 ? "jw" : "auto";
        servers.push({ title: name, data: JSON.stringify({ kind: kind, src: src, page: url }), kind: kind });
    }
    servers.sort(function (a, b) { return (a.kind === "jw" ? 0 : 1) - (b.kind === "jw" ? 0 : 1); });
    if (servers.length === 0) return Response.error("Tập này chưa có server xem được (chỉ còn server Hydrax bị chặn)");
    return Response.success(servers.map(function (server) {
        return { title: server.title, data: server.data };
    }));
}
