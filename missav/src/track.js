load('config.js');
load('common.js');

var UUID_RE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

// Mã hoá chỉ số thành khoá của packer Dean Edwards (cơ số a, chữ số 0-9a-zA-Z).
function packerKey(c, radix) {
    var head = c < radix ? "" : packerKey(Math.floor(c / radix), radix);
    var d = c % radix;
    return head + (d > 35 ? String.fromCharCode(d + 29) : d.toString(36));
}

// Giải các khối eval(function(p,a,c,k,e,d){...}('payload',a,c,'k0|k1|...'.split('|'),...) mà không dùng eval.
function unpackAll(source) {
    var out = [];
    var re = /\}\s*\(\s*'((?:[^'\\]|\\[\s\S])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\[\s\S])*)'\s*\.split\(\s*'\|'\s*\)/g;
    var m;
    while ((m = re.exec(source)) !== null) {
        var payload = m[1].replace(/\\([\s\S])/g, "$1");
        var radix = parseInt(m[2], 10);
        var count = parseInt(m[3], 10);
        var words = m[4].split("|");
        var dict = {};
        for (var c = count - 1; c >= 0; c--) {
            var key = packerKey(c, radix);
            dict[key] = words[c] || key;
        }
        out.push(payload.replace(/\b\w+\b/g, function (w) {
            return Object.prototype.hasOwnProperty.call(dict, w) ? dict[w] : w;
        }));
    }
    return out;
}

function cleanMediaUrl(u) {
    return String(u || "").replace(/\\\//g, "/").replace(/\\/g, "").trim();
}

// Link HLS chính (playlist.m3u8 nhiều chất lượng) của trang phim.
function findPlaylist(html) {
    var blocks = unpackAll(html);
    for (var i = 0; i < blocks.length; i++) {
        var hit = blocks[i].match(/https?:\/\/[^'"\s;]+\/playlist\.m3u8/);
        if (hit) return cleanMediaUrl(hit[0]);
    }
    var uuid = html.match(new RegExp("surrit\\.com\\\\?\\/(" + UUID_RE + ")"));
    if (uuid) return STREAM_CDN + "/" + uuid[1] + "/playlist.m3u8";
    for (var j = 0; j < blocks.length; j++) {
        var any = blocks[j].match(/https?:\/\/[^'"\s;]+\.m3u8/);
        if (any) return cleanMediaUrl(any[0]);
    }
    var raw = html.match(/https?:\\?\/\\?\/[^'"\s<>]+?\.m3u8/);
    return raw ? cleanMediaUrl(raw[0]) : "";
}

function execute(data) {
    var url = String(data || "").trim();
    var mode = "";
    if (url.charAt(0) === "{") {
        try {
            var payload = JSON.parse(url);
            url = payload.url || "";
            mode = payload.mode || "";
        } catch (e) {
        }
    }
    url = cleanLink(url);
    if (!url) return Response.error("Thiếu link phim");

    var origin = originOf(url);
    var referer = { "Referer": origin + "/" };

    if (mode === "webview") {
        return Response.success({ type: "webview", data: url, host: origin, headers: referer });
    }

    var html = loadPage(url);
    var m3u8 = html ? findPlaylist(html) : "";
    if (m3u8) {
        return Response.success({
            type: "native",
            data: m3u8,
            host: origin,
            mimeType: "application/x-mpegURL",
            headers: { "Referer": origin + "/", "Origin": origin }
        });
    }

    // Không tìm được link: để app mở trang phim ẩn và tự bắt m3u8.
    return Response.success({ type: "auto", data: url, host: origin, headers: referer });
}
