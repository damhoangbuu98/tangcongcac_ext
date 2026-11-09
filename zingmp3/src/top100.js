load('crypto.js');
load('config.js');

// Every Top 100 playlist (Nổi bật, Việt Nam, Châu Á, Âu Mỹ, Hòa tấu), one page.
function execute(query, page) {
    let groups = zingData("/page/get/top-100", {});
    if (!groups || !groups.length) return Response.error("Không tải được Top 100");
    let items = [];
    groups.forEach(function (group) {
        (group.items || []).forEach(function (pl) {
            let item = playlistItem(pl);
            item.tag = group.title || "";
            items.push(item);
        });
    });
    return Response.success(uniqueItems(items), "");
}
