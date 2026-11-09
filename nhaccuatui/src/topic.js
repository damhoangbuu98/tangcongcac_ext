load('config.js');

// Playlists of one topic tag (query = tag key, e.g. "tiktok"), 20 per page.
function execute(query, page) {
    let n = parseInt(page || "1", 10) || 1;
    let json = nctApi("/api/v1/topics/playlists/tag", { keys: String(query || ""), pageindex: n, pagesize: 20 });
    if (!json || json.code !== 0) return Response.error(nctErrorText(json, "Không tải được chủ đề"));
    let items = uniqueItems((json.data || []).map(playlistItem));
    return Response.success(items, json.loadmore && items.length ? String(n + 1) : "");
}
