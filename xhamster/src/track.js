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
    let subtitles = payload.subs || [];

    if (payload.kind === "auto") {
        return Response.success({ type: "auto", data: page, host: BASE_URL, subtitles: subtitles });
    }

    let stream = payload.url || "";
    if (!stream || !payload.at || Date.now() - payload.at > STREAM_FRESH_MS) {
        let fresh = loadMedia(page);
        if (fresh) {
            let picked = payload.kind === "fallback"
                ? (fresh.streams.fallback || fresh.streams.primary)
                : (fresh.streams.primary || fresh.streams.fallback);
            if (picked) stream = picked;
            if (fresh.subtitles.length > 0) subtitles = fresh.subtitles;
        }
    }

    // Unknown cipher or no h264 stream: let the app sniff the player instead of failing.
    if (!isPlaylistUrl(stream)) {
        return Response.success({ type: "auto", data: page, host: BASE_URL, subtitles: subtitles });
    }
    return Response.success({
        type: "native",
        data: stream,
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: streamHeaders(),
        subtitles: subtitles
    });
}
