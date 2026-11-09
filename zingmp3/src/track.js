load('crypto.js');
load('config.js');

// data = song page URL (from chap.js). Fresh 128 kbps link (320 kbps is VIP-only) + timed lyrics.
function execute(data) {
    let m = /\/bai-hat\/[^\/]+\/([A-Za-z0-9]+)\.html/.exec(String(data || "")) || /^([A-Za-z0-9]{6,})$/.exec(String(data || ""));
    if (!m) return Response.error("Thiếu mã bài hát");
    let id = m[1];

    let json = zingApi("/song/get/streaming", { id: id });
    if (json.err !== 0 || !json.data) return Response.error(zingErrorText(json, "Không lấy được link nghe"));
    let link = json.data["128"];
    if (!link || String(link).indexOf("http") !== 0) {
        link = json.data["320"];
        if (!link || String(link).indexOf("http") !== 0) return Response.error("Bài này chỉ dành cho tài khoản VIP của Zing MP3");
    }

    let result = {
        type: "native",
        data: String(link).replace(/^http:/, "https:"),
        host: BASE_URL,
        mimeType: "audio/mpeg",
        headers: { "Referer": BASE_URL + "/", "User-Agent": UserAgent.chrome() }
    };
    let lyrics = lyricSources(id);
    if (lyrics.length) result.lyrics = lyrics;
    return Response.success(result);
}

// Zing gives an .lrc file; without it, rebuild LRC from the word timings (`sentences`).
function lyricSources(id) {
    let lyric = zingData("/lyric/get/lyric", { id: id });
    if (!lyric) return [];
    if (lyric.file && String(lyric.file).indexOf("http") === 0) {
        return [{ data: lyric.file, type: "lrc", label: "Lời bài hát", language: "vi" }];
    }
    let lines = [];
    (lyric.sentences || []).forEach(function (sentence) {
        let words = sentence.words || [];
        if (!words.length) return;
        let text = words.map(function (w) { return w.data; }).join(" ").replace(/\s+/g, " ").trim();
        if (text) lines.push(lrcTime(words[0].startTime) + text);
    });
    if (!lines.length) return [];
    return [{ data: lines.join("\n"), type: "lrc", label: "Lời bài hát", language: "vi" }];
}

function lrcTime(ms) {
    ms = Math.max(0, Number(ms) || 0);
    let min = Math.floor(ms / 60000);
    let sec = Math.floor((ms % 60000) / 1000);
    let cs = Math.floor((ms % 1000) / 10);
    return "[" + pad(min) + ":" + pad(sec) + "." + pad(cs) + "]";
}

function pad(n) {
    return n < 10 ? "0" + n : String(n);
}
