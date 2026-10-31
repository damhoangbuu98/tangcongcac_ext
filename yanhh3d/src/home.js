function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Đang chiếu", input: "/dang-chieu", script: "search.js" },
        { title: "Hoàn thành", input: "/hoan-thanh", script: "search.js" },
        { title: "Phim lẻ / OVA", input: "/phim-le", script: "search.js" }
    ]);
}
