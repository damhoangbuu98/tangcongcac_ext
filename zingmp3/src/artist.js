load('crypto.js');
load('config.js');

// One artist as a list (query = artist alias): "Tất cả bài hát" (plays the artist's songs), singles / EPs,
// albums, compilations, featured-in, hot songs, then similar artists.
function execute(query, page) {
    let alias = String(query || "");
    let m = /zingmp3\.vn\/(?:nghe-si\/)?([^\/?#]+)/.exec(alias);
    if (m) alias = m[1];
    let a = zingData("/page/get/artist", { alias: alias });
    if (!a || !a.id) return Response.error("Không tải được nghệ sĩ");

    let items = [{
        name: "Tất cả bài hát của " + a.name,
        cover: coverOf(a),
        link: artistUrl(alias),
        description: a.name,
        tag: "Nghe hết"
    }];
    let songs = [];
    let artists = [];
    (a.sections || []).forEach(function (section) {
        let type = section.sectionType;
        if (type === "playlist") {
            (section.items || []).forEach(function (pl) {
                let item = playlistItem(pl);
                item.tag = section.title || item.tag;
                items.push(item);
            });
        } else if (type === "song") {
            (section.items || []).filter(isPlayable).forEach(function (s) { songs.push(songItem(s)); });
        } else if (type === "artist") {
            (section.items || []).forEach(function (ar) { artists.push(artistItem(ar)); });
        }
    });
    return Response.success(uniqueItems(items.concat(songs, artists)), "");
}
