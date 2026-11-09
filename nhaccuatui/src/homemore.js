load('config.js');

// "Xem thêm" of a home playlist row (query = row key, e.g. 177 "Toàn Là Nhạc Hot").
function execute(query, page) {
    let data = nctData("/api/v1/app/home/" + encodeURIComponent(String(query || "")), {});
    let list = (data && data.list) || [];
    let items = list.filter(function (c) { return c.key && (c.type === "playlist" || !c.type); }).map(function (c) {
        return { name: c.name, cover: bigImage(c.image), link: playlistUrl(c.key), description: c.subName || c.artistName || "" };
    });
    return Response.success(uniqueItems(items), "");
}
