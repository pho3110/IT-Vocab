# Nguồn và phạm vi ngân hàng đề thi

Đọc trực tiếp 23 ảnh và Handout 01 trong thư mục `formde/` người dùng cung cấp. Ảnh/tệp gốc không được sao chép vào public hoặc đưa vào Git; `/formde/` tiếp tục bị bỏ qua. Các mô-đun `exam-*.js` chứa nội dung đã chuyển thành văn bản và đáp án tham khảo để ứng dụng sử dụng.

| Nguồn | Nội dung sử dụng |
| --- | --- |
| Ảnh ở thư mục gốc, tên bắt đầu `1792314323242` | Chỉ có bài Nghe Unit 1; loại hoàn toàn. Không chuyển bài Nghe thành Đọc. |
| Ảnh ở thư mục gốc, tên bắt đầu `1792314383318` | 22 nhóm câu hỏi Nói, gồm các câu hỏi phụ và mô tả thiết bị. |
| Unit2, 4 ảnh | Nối từ, trắc nghiệm, 2 bài đọc đủ văn bản/câu hỏi, 5 câu dịch, 1 đề email. |
| Unit3, 5 ảnh | Nối từ, trắc nghiệm, 2 bài đọc đủ văn bản/câu hỏi, 5 câu dịch, 2 đề email. |
| Unit4, 3 ảnh | Nối từ, trắc nghiệm, 5 câu dịch, 1 đề email. Không có trang bài đọc nên không tự dựng bài đọc Unit 4. |
| Unit5, 3 ảnh | Nối từ, trắc nghiệm, 2 bài đọc đủ văn bản/câu hỏi, 5 câu dịch. Không có đề email nên không tự gán email cho Unit 5. |
| Unit6, 3 ảnh | Nối từ, trắc nghiệm, 2 bài đọc đủ văn bản/câu hỏi, 5 câu dịch, 1 đề email. |
| Unit7, 3 ảnh | Nối từ, trắc nghiệm, 2 bài đọc đủ văn bản/câu hỏi, 5 câu dịch, 1 đề email. Dùng tiêu đề Unit 7, bỏ qua chân trang ghi nhầm Unit 6. |
| Handout 01 | 50 câu dịch đã có trong ứng dụng, bổ sung vào ngân hàng dịch của đề trộn. |

Đã đọc đủ 120 mục từ vựng/ngữ pháp (20 mục mỗi Unit 2–7). Có 117 mục dùng để tạo đề, loại ba trường hợp:

- Unit 2 câu 11: câu hỏi cần “billion” (3,4 tỷ chu kỳ/giây), nhưng bốn lựa chọn là megahertz, gigahertz, kilobytes, terabytes; không có đáp án điền đúng.
- Unit 5 câu 6: “The Basic hosting plan is ___ expensive than the Premier plan.” Cả “more” và “less” đều đúng ngữ pháp; câu này không kèm bảng giá để xác định nghĩa.
- Unit 5 câu 17: “written guarantee” là đáp án dự kiến nhưng “written warranty card” cũng có thể hiểu được; không dùng câu mơ hồ để tính điểm. Nội dung vẫn nằm trong bản chép nguồn, bộ sinh đề lọc ra.

Ngân hàng còn 10 bài đọc với 50 câu hỏi; 30 câu dịch từ Unit 2–7 và 50 câu Handout 01; 6 đề email; 22 nhóm câu Nói. Câu 30–31 trong Handout gần trùng, giữ nguyên bộ luyện dịch nhưng chỉ lấy câu 30 vào ngân hàng tạo đề để tránh đề trộn lặp ý này.

Mỗi đề có 5 mục nối từ đổi thành chọn định nghĩa + 15 câu trắc nghiệm ngôn ngữ từ sáu unit; 1 bài đọc trắc nghiệm và 1 bài đọc đúng/sai từ hai unit khác nhau; 5 câu dịch từ các nhóm nguồn khác nhau; 1 đề email; 3 nhóm câu hỏi Nói. Câu hỏi và phương án được trộn bằng mã seed; bài đọc không bị tách khỏi câu hỏi tương ứng.

Chuẩn hóa xuống dòng, dấu chỗ trống và khoảng trắng để nhập liệu trên điện thoại; không dùng ảnh gốc trong giao diện. Một số hướng dẫn email được trình bày gọn dưới dạng bước nhưng giữ yêu cầu gốc. Bài email dùng menu hệ điều hành theo tài liệu, không phải hướng dẫn cập nhật cho mọi phiên bản hệ điều hành.

Không có tệp đáp án giáo viên trong `formde/`. Khóa trắc nghiệm, bản dịch, bài email mẫu và gợi ý Nói do trợ lý biên soạn, được ghi là tham khảo. Điểm khách quan chỉ tính 30 câu; Viết/Nói không bị gộp thành điểm tổng giả. Phần Nói hỗ trợ micro và lưu bản ghi cục bộ bằng IndexedDB, kèm tải/xóa; không gửi giọng nói ra ngoài và không chấm phát âm bằng AI.
