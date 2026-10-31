load('config.js');

function execute() {
    let response = fetchPage(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let genres = [];
    let seenPath = {};
    let seenTitle = {};
    doc.select("a[href*='/the-loai/']").forEach(function (el) {
        let path = toPath(absoluteUrl(el.attr("href")));
        // The footer repeats some genres with stale ids; keep the first (menu) entry per name.
        let title = el.text().replace(/^[^0-9A-Za-zÀ-ỹ\[]+/, "").trim();
        if (!title || !path || seenPath[path] || seenTitle[title.toLowerCase()]) return;
        seenPath[path] = true;
        seenTitle[title.toLowerCase()] = true;
        genres.push({ title: title, input: path, script: "search.js" });
    });
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
