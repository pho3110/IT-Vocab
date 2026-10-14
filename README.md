# IT Words — React app học từ vựng tiếng Anh IT

Ứng dụng React dành cho điện thoại và máy tính: **8 unit · 32 lesson · 160 từ chọn lọc** theo cấu trúc *Workbook of English for Information Technology* (2016) bạn cung cấp. Nghĩa tiếng Việt và định nghĩa ngắn được biên soạn cho ứng dụng, không phải đáp án chính thức hay toàn bộ nội dung workbook.

## Chạy dự án

Yêu cầu Node.js 22.12+ hoặc 24+ và npm. Từ thư mục dự án:

```powershell
npm install
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`.

## Tính năng

- Tổng quan, tiến độ theo unit và lesson; giao diện responsive và thanh điều hướng trên điện thoại.
- Flashcard: thử nhớ → lật thẻ → chọn Đã nhớ / Chưa nhớ.
- Quiz bốn lựa chọn, giải thích đáp án, kết quả và luyện lại từ sai.
- Lịch ôn đơn giản: nhớ đúng sau 1, 3, 7, 14, 30 ngày; chưa nhớ sau 10 phút. Nhớ đúng 2 lần liên tiếp được tính là đã ghi nhớ.
- Tìm kiếm tiếng Anh hoặc tiếng Việt không dấu; đánh dấu từ yêu thích.
- Tiến độ lưu trong localStorage; xuất/nhập JSON, kiểm tra dữ liệu nhập và xác nhận trước khi đặt lại.
- PWA: cache toàn bộ giao diện và bộ từ của bản build; dùng được khi offline sau lần tải đầu thành công.
- Không có tài khoản, API ngoài, tracking, font mạng hoặc yêu cầu trả phí.

## Offline trên điện thoại

```powershell
npm run build
npm run preview
```

**PWA chỉ được tạo cho bản build, không bật trong `npm run dev`.** Trên máy tính, `localhost` được hỗ trợ. Trên điện thoại, truy cập IP máy tính bằng HTTP chỉ xem thử giao diện, không bật service worker. Cần một đường dẫn **HTTPS** cho bản build.

Đưa toàn bộ thư mục `dist` lên dịch vụ static hosting có HTTPS; build command là `npm run build`, output directory là `dist`. Có thể dùng GitHub Pages, Cloudflare Pages hoặc dịch vụ tương đương; ứng dụng không cần server backend. Vite dùng base tương đối và service worker theo scope, hỗ trợ thư mục con.

Sites đã được đăng ký với địa chỉ dự kiến `https://it-words.groovysole65.chatgpt.site`. Chỉ dùng địa chỉ này khi thông báo triển khai đã thành công; mã nguồn và bản build vẫn có thể chạy hoặc triển khai độc lập. Sites mặc định riêng tư và có thể yêu cầu đăng nhập khi mở trên điện thoại.

1. Mở URL HTTPS khi có mạng.
2. Android Chrome: menu ⋮ → Cài ứng dụng / Thêm vào màn hình chính. iPhone Safari: Chia sẻ → Thêm vào Màn hình chính.
3. Mở ứng dụng đã cài khi có mạng. Chờ nhãn **Sẵn sàng offline**.
4. Bật chế độ máy bay, đóng và mở lại. Thử flashcard, quiz và tìm kiếm.

Safari, Chrome và ứng dụng đã cài có thể dùng bộ lưu trữ khác nhau. Dữ liệu nằm trên từng thiết bị, chưa có đồng bộ. Xóa dữ liệu trang, chế độ riêng tư hoặc trình duyệt thu hồi bộ nhớ có thể làm mất tiến độ/cache; xuất bản sao định kỳ. Nhập bản sao thay thế tiến độ hiện tại. Cập nhật app giữ tiến độ nếu ID từ vẫn tương thích; chỉ cập nhật khi không ở giữa phiên học.

## Cấu trúc để tự học

```text
src/data.js          Bộ từ: unit → lesson → words (ID ổn định)
src/study.js         Lịch ôn, kiểm tra bản sao, tìm kiếm và đáp án quiz
src/App.jsx          Giao diện, điều hướng, phiên học và lưu tiến độ
src/styles.css       Giao diện desktop/mobile, không dùng thư viện CSS
scripts/build-pwa.mjs Tạo PNG icon và service worker từ asset thực tế của bản build
test/                Kiểm tra dữ liệu, lịch ôn, backup, quiz và cache offline
```

Khi thêm từ, giữ nguyên ID hiện có để bảo toàn tiến độ. Mỗi dòng dữ liệu có dạng `từ|nghĩa tiếng Việt|định nghĩa tiếng Anh`; không dùng ký tự `|` trong nội dung. Khi chỉnh CSS hoặc nội dung, chạy build lại để cập nhật cache version.

## Kiểm tra

```powershell
npm run build
npm test
```

Để chạy kiểm tra trình duyệt trên Windows có Microsoft Edge, giữ `npm run preview -- --port 4173 --strictPort` chạy ở terminal khác rồi chạy `node scripts/browser-check.mjs`. Ảnh kiểm tra được lưu trong thư mục `qa/` (bỏ qua trong Git).

Test kiểm tra dữ liệu, lịch ôn, backup sai định dạng, đáp án quiz và mô phỏng service worker khi mất mạng. Kiểm tra thực tế trên Android/iPhone vẫn cần thực hiện theo các bước trên, bao gồm: tải lại không mất tiến độ; hoàn thành quiz; học lại từ sai; xuất/nhập backup; mở app offline; cập nhật phiên bản không mất dữ liệu.

## Gợi ý bài tập tiếp theo

Tách App thành các component riêng, thêm ví dụ sử dụng từng từ, form tự thêm từ, và lịch ôn theo ngày. Bản hiện tại chưa có phát âm, nhập PDF tự động hoặc bài nghe/đọc từ workbook.
