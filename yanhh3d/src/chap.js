load('config.js');

// Servers of this episode's track ("Thuyết minh · HD"...) plus one entry for the other track when the
// episode exists there too; that one is resolved in track.js. Titles stay the same across episodes so
// the player keeps the user's choice.
function execute(url) {
    url = normalizeUrl(url);
    let parsed = parseEpisodeUrl(url);
    if (!parsed) return Response.error("Link tập không hợp lệ");
    let response = fetchPage(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = parsePage(response.text());

    let version = versionName(parsed.vietsub);
    let result = [];
    let used = {};
    let servers = readServers(doc);
    for (let i = 0; i < servers.length; i++) {
        let server = servers[i];
        let title = version + " · " + server.label;
        if (used[title]) continue;
        used[title] = true;
        result.push({ title: title, data: JSON.stringify({ kind: server.kind, src: server.src, page: url }) });
    }

    let altUrl = episodeUrl(parsed.slug, parsed.episode, !parsed.vietsub);
    let altListed = false;
    doc.select("a.ep-item").forEach(function (el) {
        if (normalizeUrl(absoluteUrl(el.attr("href"))) === altUrl) altListed = true;
    });
    if (altListed) {
        result.push({ title: versionName(!parsed.vietsub) + " · HD", data: JSON.stringify({ kind: "alt", page: altUrl }) });
    }

    if (result.length === 0) return Response.error("Tập này chưa có link phát (có thể mới có trailer)");
    return Response.success(result);
}
