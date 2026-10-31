load('config.js');
load('common.js');

// Trang nhúng https://<host>/e/<id> lấy link phát qua GET <host>/stream?id=<id> → { status: "ok", media: { stream } }.
// Link m3u8 có thời hạn nên luôn gọi lại lúc phát. CDN chỉ nhận Referer là domain trang nhúng (123av.com bị chặn).
function streamOf(embedUrl) {
    var m = String(embedUrl).match(/^(https?:\/\/[^\/?#]+)\/e\/([A-Za-z0-9_]+)/i);
    if (!m) return "";
    var res = null;
    try {
        res = fetch(m[1] + "/stream?id=" + m[2], {
            headers: { "Referer": embedUrl, "Accept": "application/json" },
            timeout: 20000
        });
    } catch (e) {
        res = null;
    }
    if (!res || !res.ok) return "";
    try {
        var json = res.json();
        var stream = json && json.media && json.media.stream;
        return /^https?:\/\//i.test(stream || "") ? String(stream).replace(/\\\//g, "/") : "";
    } catch (e) {
        return "";
    }
}

function execute(data) {
    var url = String(data || "").trim();
    var mode = "";
    if (url.charAt(0) === "{") {
        try {
            var payload = JSON.parse(url);
            url = payload.url || "";
            mode = payload.mode || "";
        } catch (e) {
        }
    }
    if (!url) return Response.error("Thiếu link phát");

    // Nhận cả link trang phim (lấy tập đầu) cho chắc.
    if (isMovieUrl(url)) {
        var html = loadPage(cleanLink(url));
        var eps = html ? parseEpisodes(html) : [];
        if (!eps.length) return Response.error("Không có nguồn phát");
        url = eps[0].url;
    }

    var origin = originOf(url);
    var referer = { "Referer": origin + "/" };

    if (mode === "webview") {
        return Response.success({ type: "webview", data: url, host: origin, headers: referer });
    }

    var stream = streamOf(url);
    if (stream) {
        return Response.success({
            type: "native",
            data: stream,
            host: origin,
            mimeType: "application/x-mpegURL",
            headers: { "Referer": origin + "/", "Origin": origin }
        });
    }

    // Không gọi được API: để app mở trang nhúng ẩn và tự bắt m3u8 (Referer = domain trang nhúng).
    return Response.success({ type: "auto", data: url, host: origin, headers: referer });
}
