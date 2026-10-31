function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/newest", script: "search.js" },
        { title: "Xem nhiều", input: "/most-viewed", script: "search.js" },
        { title: "Đánh giá cao", input: "/best", script: "search.js" },
        { title: "Hay nhất tuần", input: "/best/weekly", script: "search.js" },
        { title: "4K", input: "/4k", script: "search.js" }
    ]);
}
