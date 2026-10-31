load('config.js');

function execute(data) {
    let payload;
    try {
        payload = JSON.parse(data);
    } catch (error) {
        payload = { page: data, kind: "primary" };
    }
    let page = normalizeUrl(payload.page || "");
    if (!page) return Response.error("Thiếu trang video");

    if (payload.kind === "auto") {
        return Response.success({ type: "auto", data: page, host: BASE_URL });
    }

    let stream = payload.url || "";
    if (!stream || !payload.at || Date.now() - payload.at > STREAM_FRESH_MS) {
        let fresh = loadStreams(page);
        if (fresh) {
            let picked = payload.kind === "fallback" ? (fresh.fallback || fresh.primary) : (fresh.primary || fresh.fallback);
            if (picked) stream = picked;
        }
    }

    // Unknown cipher or no h264 stream: let the app sniff the player instead of failing.
    if (!isPlaylistUrl(stream)) {
        return Response.success({ type: "auto", data: page, host: BASE_URL });
    }
    return Response.success({
        type: "native",
        data: stream,
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: streamHeaders()
    });
}
