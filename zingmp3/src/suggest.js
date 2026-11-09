load('crypto.js');
load('config.js');

// "Bài gợi ý" of one song (query = song id): Zing's recommend list (the songs the web plays after it).
// The app opens the first not-yet-played item when the current song ends.
function execute(query, page) {
    let id = String(query || "");
    let m = /\/bai-hat\/[^\/]+\/([A-Za-z0-9]+)\.html/.exec(id);
    if (m) id = m[1];
    if (!id) return Response.success([], "");
    let data = zingData("/recommend/get/songs", { id: id, start: 0, count: 20 });
    let items = ((data && data.items) || []).filter(function (s) {
        return isPlayable(s) && s.encodeId !== id;
    }).map(songItem);
    return Response.success(uniqueItems(items), "");
}
