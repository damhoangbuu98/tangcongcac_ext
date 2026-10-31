function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/video?o=cm", script: "search.js" },
        { title: "Xem nhiều", input: "/video?o=mv", script: "search.js" },
        { title: "Đánh giá cao", input: "/video?o=tr", script: "search.js" },
        { title: "Đang hot", input: "/video?o=ht", script: "search.js" },
        { title: "HD", input: "/hd", script: "search.js" }
    ]);
}
