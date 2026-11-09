load('config.js');

// "Bài gợi ý" of one song (query = song key): NCT's similar songs. The app opens the first
// not-yet-played item when the current song ends.
function execute(query, page) {
    let key = String(query || "");
    let route = parseRoute(key);
    if (route && route.type === "song") key = route.key;
    if (!key) return Response.success([], "");
    let data = nctData("/api/v1/song/similar/" + key, { rn: 30 });
    let list = (data && data.list) || [];
    let items = list.filter(function (s) { return isPlayable(s) && s.key !== key; }).map(songItem);
    return Response.success(uniqueItems(items), "");
}
