load('config.js');

// Genre chips: Bảng xếp hạng, Top 100, then the home page's topic tags (TikTok, Remix, Lofi…).
function execute() {
    let out = [
        { title: "Bảng xếp hạng", input: "", script: "charts.js" },
        { title: "Top 100", input: "", script: "top100.js" }
    ];
    let home = nctData("/api/v6/app/home/index", {});
    ((home && home.list) || []).forEach(function (section) {
        if (section.logPrefix !== "topic") return;
        (section.child || []).forEach(function (c) {
            if (c.key && c.name) out.push({ title: c.name, input: c.key, script: "topic.js" });
        });
    });
    return Response.success(out);
}
