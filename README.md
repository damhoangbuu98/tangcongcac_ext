# tangcongcac_ext

Kho tiện ích video và âm thanh cho FreeBook.

Thêm kho trong app bằng link:

```
https://raw.githubusercontent.com/damhoangbuu98/tangcongcac_ext/main/plugin.json
```

| Tiện ích | Thư mục | Nguồn | Nội dung |
|---|---|---|---|
| MissAV | `missav/` | missav.ai | 18+ |
| 123AV | `123av/` | 123av.com | 18+ |
| xHamster | `xhamster/` | xhamster.com | 18+ |
| Pornhub | `pornhub/` | pornhub.com | 18+ |
| YanHH3D | `yanhh3d/` | yanhh3d.plus | Hoạt hình Trung Quốc |
| AnimeHay | `animehay/` | animehay16.site | Anime Vietsub, hoạt hình Trung Quốc |
| Zing MP3 | `zingmp3/` | zingmp3.vn | Âm thanh: nhạc 128 kbps, lời bài hát, bài gợi ý |
| NhacCuaTui | `nhaccuatui/` | nhaccuatui.com | Âm thanh: nhạc tới 320 kbps, lời bài hát, bài gợi ý |

Mỗi thư mục gồm `plugin.json`, `icon.png`, `src/` và file zip để cài (cùng nội dung).

## Tiện ích âm thanh

- **Zing MP3**: API `zingmp3.vn/api/v2` ký `sig` (HMAC-SHA512 theo đường dẫn + SHA256 tham số) bằng khoá lấy từ
  `main.min.js` của web. Zing đổi khoá ⇒ API báo sai chữ ký, tiện ích tự đọc lại khoá từ bundle (lưu `localStorage`).
  Cần cookie `zmp3_rqid` (tự lấy bằng một lần mở trang chủ). Chỉ nghe được 128 kbps (320 kbps là VIP); bài chỉ dành
  cho VIP bị ẩn khỏi danh sách. Nhiều bài chỉ nghe được bằng IP Việt Nam.
- **NhacCuaTui**: API `graph.nhaccuatui.com` (site mới); các API đọc không cần chữ ký `X-sign`. Ô cấu hình
  "Chất lượng nghe" chọn 320 hoặc 128 kbps. Lời có mốc giờ là file `.lrc` mã hoá RC4, khoá trả kèm API.
- Link phát hết hạn (Zing ~48 giờ, NCT ~7 ngày) nên `chap.js` không gọi mạng, `track.js` lấy link mới mỗi lần phát.
- Nhóm đầu của `suggests` ở chi tiết là thứ app phát tiếp khi hết bài / album (Tự phát bài gợi ý): bài lẻ ⇒ "Bài gợi
  ý", playlist ⇒ "Playlist liên quan".
