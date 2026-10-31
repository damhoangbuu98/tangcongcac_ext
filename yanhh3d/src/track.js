load('config.js');

function facebookMp4(src, referer) {
    let response = fetchPage(src, referer);
    if (!response.ok) return "";
    let match = /https:\\?\/\\?\/[^"'\s<>]*fbcdn\.net[^"'\s<>]*\.mp4[^"'\s<>]*/.exec(response.text());
    return match ? match[0].replace(/\\\//g, "/").replace(/&amp;/g, "&") : "";
}

// Player pages name their playlist either in a base64 `data-obf` JSON ({sU: encrypted, pU: plain}; only the
// plain one is usable) or in a `cccc = "…"` variable fed to JW Player.
function obfuscatedPlaylist(src, referer) {
    let response = fetchPage(src, referer);
    if (!response.ok) return "";
    let text = response.text();
    let match = /data-obf="([^"]+)"/.exec(text);
    if (match) {
        try {
            return String(JSON.parse(atob(match[1])).pU || "");
        } catch (error) {
        }
    }
    match = /cccc\s*=\s*"(https?:[^"]+)"/.exec(text);
    return match ? match[1].replace(/\\\//g, "/") : "";
}

function embedPlaylist(src) {
    let match = /^(https?:\/\/[^\/]+)\/embed\/([^\/?#]+)/.exec(src);
    return match ? match[1] + "/file/" + match[2] + "/master.m3u8?storage=drive" : "";
}

function resolve(server, page) {
    if (server.kind === "fb") {
        let mp4 = facebookMp4(server.src, page);
        if (!mp4) return Response.error("Không lấy được link phát của server HD");
        return Response.success({ type: "native", data: mp4, mimeType: "video/mp4" });
    }
    if (server.kind === "obf" || server.kind === "embed") {
        let playlist = server.kind === "obf" ? obfuscatedPlaylist(server.src, page) : embedPlaylist(server.src);
        if (!playlist) return Response.success({ type: "webview", data: server.src, host: BASE_URL });
        return Response.success({
            type: "native",
            data: playlist,
            mimeType: "application/x-mpegURL",
            headers: { "Referer": BASE_URL + "/" }
        });
    }
    return Response.success({ type: "auto", data: server.src, host: BASE_URL });
}

function execute(data) {
    let payload;
    try {
        payload = JSON.parse(data);
    } catch (error) {
        return Response.error("Dữ liệu server không hợp lệ");
    }
    let page = normalizeUrl(payload.page || "");

    if (payload.kind === "alt") {
        let response = fetchPage(page);
        let alt = parseEpisodeUrl(page);
        if (response.status === 404) return Response.error("Tập này chưa có bản " + versionName(alt ? alt.vietsub : false));
        if (!response.ok) return Response.error("HTTP " + response.status);
        let servers = readServers(parsePage(response.text()));
        if (servers.length === 0) return Response.error("Tập này chưa có link phát");
        return resolve(servers[0], page);
    }
    return resolve({ kind: payload.kind, src: payload.src }, page);
}
