load('crypto.js');
load('config.js');

// Genre chips = Zing hubs: countries, genres, moods (page/get/hub-home). Each opens hub.js.
function execute() {
    let hub = zingData("/page/get/hub-home", {});
    if (!hub) return Response.error("Không tải được danh sách chủ đề");
    let out = [];
    let seen = {};
    ["nations", "genre", "topic"].forEach(function (key) {
        (hub[key] || []).forEach(function (h) {
            if (!h.encodeId || !h.title || seen[h.encodeId]) return;
            seen[h.encodeId] = true;
            out.push({ title: h.title, input: h.encodeId, script: "hub.js" });
        });
    });
    return Response.success(out);
}
