load('crypto.js');
load('config.js');

// Page 1 = search/multi (songs, playlists/albums, artists). Page n ≥ 2 = songs + playlists page n-1
// (18 each); the app drops items already shown on page 1 (same link).
function execute(query, page) {
    let q = String(query || "").trim();
    if (!q) return Response.success([], "");
    let n = parseInt(page || "1", 10) || 1;

    if (n <= 1) {
        let data = zingData("/search/multi", { q: q });
        if (!data) return Response.error("Không tìm được trên Zing MP3");
        let items = [];
        (data.songs || []).filter(isPlayable).forEach(function (s) { items.push(songItem(s)); });
        (data.playlists || []).forEach(function (pl) { items.push(playlistItem(pl)); });
        (data.artists || []).forEach(function (a) { items.push(artistItem(a)); });
        let counter = data.counter || {};
        let more = (counter.song || 0) > (data.songs || []).length || (counter.playlist || 0) > (data.playlists || []).length;
        return Response.success(uniqueItems(items), more ? "2" : "");
    }

    let size = 18;
    let songs = zingData("/search", { q: q, type: "song", page: n - 1, count: size }) || {};
    let lists = zingData("/search", { q: q, type: "playlist", page: n - 1, count: size }) || {};
    let items = [];
    (songs.items || []).filter(isPlayable).forEach(function (s) { items.push(songItem(s)); });
    (lists.items || []).forEach(function (pl) { items.push(playlistItem(pl)); });
    let more = (n - 1) * size < (songs.total || 0) || (n - 1) * size < (lists.total || 0);
    if (items.length === 0) more = false;
    return Response.success(uniqueItems(items), more ? String(n + 1) : "");
}
