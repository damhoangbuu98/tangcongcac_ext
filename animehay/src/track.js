load('config.js');

function execute(data) {
    let payload;
    try {
        payload = JSON.parse(data);
    } catch (error) {
        return Response.error("Dữ liệu server không hợp lệ");
    }
    let src = String(payload.src || "");
    if (!src) return Response.error("Thiếu link server");

    if (payload.kind === "jw") {
        let response = fetchPage(src, normalizeUrl(payload.page || BASE_URL + "/"));
        if (response.ok) {
            // The JW page names its playlist in `var M3U8_URL = '…/master.m3u8'` (segments are TS named *.png).
            let match = /M3U8_URL\s*=\s*['"](https?:[^'"]+)['"]/.exec(response.text());
            if (match) {
                let origin = /^https?:\/\/[^\/]+/.exec(src)[0];
                return Response.success({
                    type: "native",
                    data: match[1].replace(/\\\//g, "/"),
                    mimeType: "application/x-mpegURL",
                    headers: { "Referer": origin + "/" }
                });
            }
        }
        return Response.success({ type: "webview", data: src, host: BASE_URL });
    }
    return Response.success({ type: "auto", data: src, host: BASE_URL });
}
