load('config.js');

function execute() {
    let response = fetchPage(BASE_URL + "/categories");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let state = parseInitials(response.text());
    let popular = state && state.pageStore && state.pageStore.popular;
    if (!popular) return Response.error("Không đọc được danh sách thể loại");

    let groups = [];
    if (popular.trending && popular.trending.items) groups.push(popular.trending.items);
    let assignable = popular.assignable || [];
    for (let i = 0; i < assignable.length; i++) {
        if (assignable[i] && assignable[i].items) groups.push(assignable[i].items);
    }

    let genres = [];
    let seen = {};
    for (let g = 0; g < groups.length; g++) {
        let items = groups[g];
        for (let j = 0; j < items.length; j++) {
            let item = items[j] || {};
            let path = toPath(item.url);
            if (!item.name || !path || seen[path]) continue;
            seen[path] = true;
            genres.push({ title: decodeEntities(item.name), input: path, script: "search.js" });
        }
    }
    return Response.success(genres);
}
