load('crypto.js');
load('config.js');

// data = song page URL (from chap.js). Picks the stream by the QUALITY setting (320 kbps is free on NCT,
// lossless is VIP) and adds timed lyrics: `timedLyric` is an .lrc file encrypted with RC4 (hex), the key
// comes with the same response (`keyDecryptLyric`).
function execute(data) {
    let route = parseRoute(data);
    if (!route || route.type !== "song") return Response.error("Thiếu mã bài hát");

    let json = nctApi("/api/v1/song/detail/" + route.key, {});
    if (!json || json.code !== 0 || !json.data) return Response.error(nctErrorText(json, "Không lấy được link nghe"));
    let stream = pickStream(json.data.streamURL || []);
    if (!stream) return Response.error("Bài này chỉ dành cho tài khoản VIP của NhacCuaTui");

    let result = {
        type: "native",
        data: stream.replace(/^http:/, "https:"),
        host: BASE_URL,
        headers: { "Referer": BASE_URL + "/", "User-Agent": UserAgent.chrome() }
    };
    if (!/\.(mp3|m4a|aac|flac)(\?|$)/i.test(stream)) result.mimeType = "audio/mpeg";
    let lyrics = lyricSources(route.key);
    if (lyrics.length) result.lyrics = lyrics;
    return Response.success(result);
}

function preferredQuality() {
    let value = "";
    try {
        if (typeof QUALITY === "string") value = QUALITY;
    } catch (error) {
    }
    return value.indexOf("128") === 0 ? "128" : "320";
}

function pickStream(streams) {
    let free = streams.filter(function (s) { return s && s.stream && !s.onlyVIP; });
    if (!free.length) return "";
    let want = preferredQuality();
    let exact = free.filter(function (s) { return String(s.type) === want; })[0];
    if (exact) return exact.stream;
    let order = want === "320" ? ["320", "128"] : ["128", "320"];
    for (let i = 0; i < order.length; i++) {
        let hit = free.filter(function (s) { return String(s.type) === order[i]; })[0];
        if (hit) return hit.stream;
    }
    return free[0].stream;
}

function lyricSources(key) {
    let lyric = nctData("/api/v1/song/lyric/detail", { songKey: key });
    if (!lyric) return [];
    if (lyric.timedLyric && String(lyric.timedLyric).indexOf("http") === 0) {
        let res = fetch(lyric.timedLyric, { headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" }, timeout: 20000 });
        if (res.ok) {
            let text = decryptLyric(res.text(), lyric.keyDecryptLyric || "");
            if (/\[\d+:\d+/.test(text)) return [{ data: text, type: "lrc", label: "Lời bài hát", language: "vi" }];
        }
    }
    let plain = String(lyric.content || "").trim();
    if (plain) return [{ data: plain, type: "text", label: "Lời bài hát", language: "vi" }];
    return [];
}

// Hex RC4 ciphertext ⇒ UTF-8 LRC with "\n" line breaks. Plain LRC (not hex) is returned as is.
function decryptLyric(body, key) {
    let raw = String(body || "").trim();
    if (!/^[0-9A-Fa-f]+$/.test(raw) || raw.length % 2 !== 0 || !key) return raw.replace(/\r\n?/g, "\n");
    try {
        let text = CryptoJS.RC4.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(raw) }, CryptoJS.enc.Utf8.parse(key)).toString(CryptoJS.enc.Utf8);
        return text.replace(/\r\n?/g, "\n");
    } catch (error) {
        return "";
    }
}

