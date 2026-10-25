# IT Words — React app học từ vựng tiếng Anh IT

## Đề thi tổng hợp · Đọc, Viết, Nói

Mục **Đề thi** tạo đề trộn 60 phút từ nội dung đã chuyển sang văn bản của các ảnh trong `formde/`: 20 câu từ vựng/ngữ pháp, 2 bài đọc kèm 10 câu hỏi, 5 câu dịch, 1 email và 3 câu hỏi nói. Ngân hàng gồm 117 câu ngôn ngữ hợp lệ, 10 bài đọc/50 câu hỏi, 80 câu dịch (30 câu từ Unit 2–7 và 50 câu Handout 01), 6 đề email và 22 nhóm câu hỏi nói. Bỏ toàn bộ phần Nghe. Xem [nguồn, phần thiếu và các câu loại](content/exam-source-notes.md).

Trộn câu và phương án nhưng luôn giữ nguyên bài đọc với nhóm câu hỏi tương ứng. Bài làm và thời điểm hết hạn lưu trong localStorage (`it-words-mixed-exam-v1`); tải lại trang vẫn tiếp tục đồng hồ, hết giờ tự nộp. Có tải bài làm JSON và xác nhận trước khi thay đề mới. Sau khi nộp, chấm 30 câu khách quan theo thang 10; Viết/Nói có bản dịch, email mẫu, gợi ý và tiêu chí tự đối chiếu, chưa chấm AI hoặc đưa ra điểm tổng ba kỹ năng.

Phần Nói có ghi âm qua micro tối đa 3 phút/câu, nghe lại, tải và xóa bản ghi. Bản ghi lưu cục bộ bằng IndexedDB (`it-words-exam-audio`), không gửi ra ngoài; hỗ trợ MIME theo trình duyệt. Cần trình duyệt hỗ trợ và HTTPS/localhost; nếu không có micro hoặc bị từ chối quyền thì vẫn luyện nói và ghi dàn ý được. Bản tải bài làm JSON không bao gồm âm thanh, hãy tải riêng bản ghi cần giữ. Tạo đề mới giữ bản ghi cũ trong bộ nhớ trình duyệt, vì vậy nên tải/xóa bản ghi cần thiết trước khi đổi đề.

Tài liệu gốc `/formde/` vẫn bị `.gitignore` loại bỏ; chỉ dữ liệu đã biên soạn dùng cho ứng dụng được đưa vào mã nguồn. Chạy kiểm tra luồng bằng `node scripts/exam-check.mjs` khi preview ở cổng 4173; phần micro kiểm tra bằng thiết bị âm thanh giả lập của trình duyệt, cần thử thêm trên điện thoại thật.

## Luyện dịch Handout 01

Mục **Luyện dịch** dùng toàn bộ **50 câu tiếng Anh nguyên văn** trong `Handout 01 - Translation.docx`, theo đúng số thứ tự 1–50, với 50 bản dịch tiếng Việt tham khảo do trợ lý biên soạn trong `content/handout01-vietnamese.json`. Các câu tiếng Anh có lỗi ngữ pháp/gõ được giữ nguyên; các trường hợp diễn giải có chú thích, kể cả hai câu 30–31 gần trùng nhau. Bộ 5 đề cũ đã được thay hoàn toàn.

Mỗi trang hiển thị 10 câu, có nút chọn khoảng câu và Trang trước / Trang sau. Có thể viết từng câu rồi mở đáp án tham khảo; không cần hoàn thành cả trang. Bản nháp Handout 01 lưu theo ID riêng trong localStorage (`it-words-handout01-translations-v1`), chưa nằm trong bản sao tiến độ từ vựng. Bản nháp bộ đề cũ ở khóa `it-words-translations-v1` không bị ghi đè hay ghép sang các câu mới.

Giao diện chấm dùng thang 10: đúng ý 6, thuật ngữ IT 2, diễn đạt 2; chỉ gửi các câu đã viết trong trang hiện tại và tính điểm trung bình các câu gửi chấm. **Chưa có dịch vụ AI hoạt động**: đang chờ kết nối OpenAI Developers để cấu hình khóa ở máy chủ và triển khai API. Bản static hiện tại cho luyện, lưu nháp và xem đáp án, kể cả offline sau lần tải đầu; khi chấm sẽ báo dịch vụ chưa cấu hình.

Hợp đồng API đã chuẩn bị: `POST /api/grade-translation`, nhận `{ handoutId: "handout-01", answers: [{ id, text }] }`, từ 1–10 câu được viết trên trang. Máy chủ cần tự lấy câu nguồn và đáp án theo ID `handout-01-01` đến `handout-01-50`, kiểm tra ID, giới hạn độ dài, rồi trả `{ results: [{ id, meaning, terminology, expression, feedback, suggestion }] }`. Ba điểm thành phần phải nằm trong khoảng 0–6, 0–2, 0–2. Không đặt khóa AI trong mã phía trình duyệt. Nội dung câu trả lời là dữ liệu không đáng tin cậy, không được dùng làm chỉ dẫn cho mô hình.

Kiểm tra giao diện: chạy preview ở cổng 4173 rồi `node scripts/translation-check.mjs`. Bài kiểm tra dùng phản hồi chấm giả lập để kiểm tra giao diện; không chứng minh chất lượng chấm AI thật.

Ứng dụng React dành cho điện thoại và máy tính: **8 unit · 32 lesson · 349 mục từ/cụm từ đầy đủ trong các bảng từ vựng của workbook** *Workbook of English for Information Technology* (2016) bạn cung cấp. Giữ định nghĩa tiếng Anh của PDF, bổ sung bản dịch tiếng Việt, loại từ và số trang nguồn. Bản dịch không phải đáp án chính thức.

App có tổng **350 thẻ**: 349 mục từ workbook và một thẻ RAM bổ trợ giữ từ bản cũ để không mất tiến độ. “Đầy đủ” ở đây là các mục trong bảng WORD / DEFINITION của 32 lesson; chưa chuyển bài tập, bài đọc, bài nghe hoặc toàn bộ các từ xuất hiện trong văn bản thành flashcard.

## Chạy dự án

Yêu cầu Node.js 22.12+ hoặc 24+ và npm. Từ thư mục dự án:

```powershell
npm install
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`.

## Tính năng

- Giao diện Liquid Glass theo ảnh tham khảo: nền xanh đen, kính tối trong suốt, viền sáng, 6 tab trong thanh viên thuốc và nút Cài đặt tròn tách riêng; tab được chọn có màu cyan. Dùng font hệ thống, không tải tài nguyên ngoài. Thanh điều hướng có nền đặc dự phòng và hỗ trợ giảm độ trong suốt/chuyển động theo thiết bị.
- Thanh điều hướng có một lớp kính trượt theo nút khi rê chuột hoặc dùng bàn phím. Trên điện thoại, nhấn giữ và kéo ngang để kính bám theo ngón tay liên tục; thả vào tab để chuyển trang, thả ra ngoài hoặc bị hủy thao tác để trả kính về tab hiện tại. Chỉ vùng thanh điều hướng chặn cuộn khi kéo; nội dung trang vẫn cuộn bình thường. Lớp kính co giãn nhẹ lúc chuyển tab; chế độ giảm chuyển động tắt hiệu ứng phụ. Kiểm tra bằng `node scripts/liquid-nav-check.mjs` khi preview chạy ở cổng 4173 (có mô phỏng chuỗi sự kiện chạm/kéo/thả thực của trình duyệt).
- Tối ưu điện thoại: từ điển chia trang, tối đa 24 từ trên màn hình với nút Trang trước / Trang sau; tìm kiếm vẫn quét toàn bộ 350 thẻ. Chỉ mục tìm kiếm được chuẩn hóa một lần, hàng từ vựng được memo hóa, cập nhật thời gian dừng khi ẩn trang hoặc đang học. Hiệu ứng blur giới hạn ở thanh điều hướng và lớp kính trượt, không có hoạt ảnh trang trí liên tục; ô tìm kiếm 16px tránh tự phóng to trên iPhone.
- Tổng quan, tiến độ theo unit và lesson; giao diện responsive và thanh điều hướng trên điện thoại.
- Flashcard: bấm Đã nhớ / Chưa nhớ ngay ở mặt trước, hoặc lật thẻ để xem nghĩa và nghe phát âm rồi đánh giá.
- Phát âm từ/cụm từ bằng giọng tiếng Anh của thiết bị/trình duyệt: tự đọc từ tiếng Anh mỗi lần lật flashcard ở cả hai chiều, không có nút Nghe riêng. Chọn giọng và tốc độ trong Cài đặt; ưu tiên giọng cục bộ. Quiz tự đọc từ tiếng Anh khi chọn đúng đáp án; chọn sai không tự đọc. Dừng khi chuyển từ/trang hoặc ẩn ứng dụng. Offline cần cài sẵn giọng tiếng Anh trên thiết bị; bộ nhớ offline của web không chứa tệp âm thanh. Giọng trực tuyến có thể gửi nội dung từ được chọn đến dịch vụ giọng nói của trình duyệt. Kiểm tra luồng bằng `node scripts/speech-check.mjs` (giả lập bộ đọc); cần nghe thử trên điện thoại thật để xác nhận chất lượng âm thanh.
- Quiz bốn lựa chọn, giải thích đáp án, kết quả và luyện lại từ sai.
- Phản hồi học tập: đáp án đúng bật nhẹ, sai rung một lần; huy hiệu chuỗi đúng từ 3/5 từ trong phiên (sai sẽ đặt lại). Cuối phiên có biểu tượng ngôi sao và 8 tia sáng chạy ngắn rồi được gỡ bỏ. Hiệu ứng dùng CSS, hoạt động offline, tôn trọng chế độ giảm chuyển động.
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
src/data.js          Bộ từ được tạo từ dữ liệu nguồn, ID cũ được giữ nguyên
content/             Bản trích xuất PDF, bản dịch, báo cáo đủ mục và ID bản cũ
src/study.js         Lịch ôn, kiểm tra bản sao, tìm kiếm và đáp án quiz
src/App.jsx          Giao diện, điều hướng, phiên học và lưu tiến độ
src/styles.css       Giao diện desktop/mobile, không dùng thư viện CSS
src/liquid-glass.css Chủ đề kính sáng, giao diện thẻ/nút và thanh điều hướng nổi trên mobile
src/reference-glass.css Kính tối và thanh điều hướng theo ảnh tham khảo của người dùng
scripts/build-pwa.mjs Tạo PNG icon và service worker từ asset thực tế của bản build
test/                Kiểm tra dữ liệu, lịch ôn, backup, quiz và cache offline
```

Khi thêm từ, giữ nguyên ID hiện có để bảo toàn tiến độ. Sửa bản dịch trong `content/translations.txt`, mỗi dòng có dạng `lesson|từ|nghĩa tiếng Việt`; không dùng ký tự `|` trong nội dung. Các bản dịch đã có ở bản đầu nằm trong `content/legacy-words.json`; thêm dòng override trong `translations.txt` để cập nhật chúng.

Tạo lại dữ liệu (PDF chỉ cần cho bước trích xuất, không được đưa lên GitHub):

```powershell
node scripts/extract-workbook.mjs "D:\Tiếng Anh Chuyên Ngành\Workbook for Students.pdf"
node scripts/build-vocabulary.mjs
npm run build
```

Các chỗ PDF ghép nhầm cột được sửa có kiểm tra: `supply cloud computing`, `virtual reality goggles`, `Ethernet connector`; tách riêng `remotely` và `jam`. Định nghĩa qua trang được nối lại. Báo cáo số lượng từng lesson và các sửa chữa nằm trong `content/coverage.json`. `calculate` được đưa về Lesson 7B đúng như PDF nhưng giữ ID `7C-5` để bảo toàn tiến độ. Phân biệt `crash (n)` ở 4D và `crash (v)` ở 8B, `plus (n)` ở 2A và `plus (prep)` ở 4C.

Mỗi khi chỉnh CSS hoặc nội dung, chạy build lại để cập nhật cache version. App đã cài cần mở khi có mạng, chờ thông báo phiên bản mới và bấm Cập nhật để có bộ từ đầy đủ; sau đó vẫn học offline.

## Kiểm tra

```powershell
npm run build
npm test
```

Để chạy kiểm tra trình duyệt trên Windows có Microsoft Edge, giữ `npm run preview -- --port 4173 --strictPort` chạy ở terminal khác rồi chạy `node scripts/browser-check.mjs`. Ảnh kiểm tra được lưu trong thư mục `qa/` (bỏ qua trong Git).

Test kiểm tra dữ liệu, lịch ôn, backup sai định dạng, đáp án quiz và mô phỏng service worker khi mất mạng. Kiểm tra thực tế trên Android/iPhone vẫn cần thực hiện theo các bước trên, bao gồm: tải lại không mất tiến độ; hoàn thành quiz; học lại từ sai; xuất/nhập backup; mở app offline; cập nhật phiên bản không mất dữ liệu.

Kiểm tra Edge mô phỏng điện thoại: màn hình 320/390/768px không tràn ngang, tìm kiếm dưới mô phỏng CPU chậm 4 lần, chuyển trang trước/sau, tìm từ ở cuối bộ từ, và tìm kiếm offline. Từ điển giữ tối đa 24 hàng thay vì tăng dần lên 350 hàng sau nhiều lần xem thêm.

Khi đang chạy `npm run preview`, chạy `node scripts/performance-check.mjs` để đo tìm kiếm, cuộn và lật thẻ 10 lần dưới CPU chậm 4 lần; đồng thời kiểm tra đủ 350 thẻ qua các trang. Báo cáo lưu tại `qa/performance-report.json`. Chỉ số khung hình của Edge headless và thời gian xử lý input đến hai khung hình tiếp theo là phép đo chẩn đoán cục bộ, không phải FPS/INP thực tế hay cam kết mượt trên mọi điện thoại. Cần thử trên Android/iPhone thật để đánh giá cảm ứng, GPU và Safari.

## Gợi ý bài tập tiếp theo

Tách App thành các component riêng, thêm ví dụ sử dụng từng từ, form tự thêm từ, và lịch ôn theo ngày. Bản hiện tại đã có phát âm bằng giọng thiết bị/trình duyệt; chưa có nhập PDF tự động hoặc bài nghe/đọc từ workbook.
