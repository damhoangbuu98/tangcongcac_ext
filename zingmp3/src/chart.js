load('crypto.js');
load('config.js');

// Songs of a chart as a list (query = chart URL or path: /zing-chart, /moi-phat-hanh, /zing-chart-tuan/…/<id>.html).
function execute(query, page) {
    let route = parseRoute(query || "/zing-chart");
    if (!route || ["realtime", "newrelease", "week"].indexOf(route.type) < 0) return Response.error("Không rõ bảng xếp hạng");
    let chart = chartSongs(route);
    if (!chart) return Response.error("Không tải được bảng xếp hạng");
    let items = chart.items.filter(isPlayable).map(function (song, i) {
        let item = songItem(song);
        item.tag = "#" + (i + 1);
        return item;
    });
    return Response.success(uniqueItems(items), "");
}
