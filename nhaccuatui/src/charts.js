load('config.js');

// All NCT charts (Top 50 Thịnh Hành, Nhạc Việt, Âu Mỹ, Hàn, Hoa, Remix, Rap, EDM, Billboard…).
function execute(query, page) {
    let charts = nctData("/api/v1/playlist/charts", {});
    if (!charts) return Response.error("Không tải được bảng xếp hạng");
    return Response.success(uniqueItems(charts.map(chartItem)), "");
}
