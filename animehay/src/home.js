function execute() {
    let year = new Date().getFullYear();
    // `/loc-phim/<base64 of [[genres],[years],[...],[...]]>`
    let thisYear = "/loc-phim/" + btoa("[[],[" + year + "],[],[]]");
    return Response.success([
        { title: "Mới cập nhật", input: "/phim-moi-cap-nhap", script: "search.js" },
        { title: "Anime", input: "/the-loai/anime-1.html", script: "search.js" },
        { title: "Hoạt hình Trung", input: "/the-loai/cn-animation-34.html", script: "search.js" },
        { title: "Năm " + year, input: thisYear, script: "search.js" }
    ]);
}
