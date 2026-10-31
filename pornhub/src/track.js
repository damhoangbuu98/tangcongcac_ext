load('config.js');

function execute(data) {
    let payload;
    try {
        payload = JSON.parse(data);
    } catch (error) {
        payload = { page: data, quality: 720 };
    }
    let page = normalizeUrl(payload.page || "");
    if (!page) return Response.error("Thiếu trang video");

    if (payload.kind === "auto") {
        return Response.success({ type: "auto", data: payload.embed || page, host: BASE_URL });
    }

    let stream = payload.url || "";
    if (!stream || !payload.at || Date.now() - payload.at > STREAM_FRESH_MS) {
        let response = fetchPage(page);
        if (response.ok) {
            let picked = pickQuality(hlsSources(extractFlashvars(response.text())), parseInt(payload.quality, 10) || 720);
            if (picked) stream = picked;
        }
    }

    // No HLS on the page (removed, region-locked, changed player): let the app sniff the embed player.
    if (stream.indexOf("http") !== 0) {
        let key = viewKey(page);
        return Response.success({ type: "auto", data: key ? BASE_URL + "/embed/" + key : page, host: BASE_URL });
    }
    return Response.success({
        type: "native",
        data: stream,
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: streamHeaders()
    });
}
