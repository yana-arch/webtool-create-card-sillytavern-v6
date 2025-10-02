<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Trình tạo Thẻ SillyTavern v6 🪄

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=flat-square&logo=github)](https://github.com/yana-arch/webtool-create-card-sillytavern-v6) [![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

Một công cụ web tiên tiến được xây dựng bằng React và TypeScript, sử dụng sức mạnh của Google Gemini AI để tạo ra các thẻ nhân vật SillyTavern chất lượng cao, giàu tính năng một cách tự động. Nhập ý tưởng ban đầu của bạn, chọn các tính năng mong muốn như giao diện người dùng động, hệ thống tiến trình, và sách lore thế giới, và để AI tạo ra tệp thẻ JSON hoàn chỉnh, sẵn sàng sử dụng trong SillyTavern v6.

## ✨ Tính năng nổi bật

### 🤖 Tạo thẻ tự động với AI
- **Sử dụng Google Gemini AI** để sinh ra nội dung thẻ người-phù-hợp và sáng tạo
- **Hỗ trợ nhiều API key** để tăng tốc độ tạo với chế độ Hyper Mode
- **Thư viện kiến thức** để lưu trữ và học hỏi từ các tệp tham khảo
- **Nhập sách lore** từ tệp JSON để tự động điền thông tin

### 🎨 Xưởng thiết kế giao diện động
- **Màn hình chào mừng** với nhiều phong cách (Sử thi, Bí ẩn, Thân thiện, Tối giản)
- **Trình tạo nhân vật** tùy chỉnh biểu mẫu HTML để người dùng input
- **Bảng trạng thái** động với HTML/CSS/JS để hiển thị biến số trực quan
- **Chỉnh sửa real-time** các preview giao diện với yêu cầu ngôn ngữ tự nhiên

### 📚 Hệ thống nội dung nâng cao
- **Sách lore thế giới** với nhiều mục được AI tạo tự động
- **Hệ thống tiến trình** với biến MVU (Message Variables Update)
- **Hệ thống mối quan hệ** theo dõi thiện cảm và suy nghĩ nội tâm
- **Yêu cầu tùy chỉnh** cho từng phần nội dung

### 🔧 Công cụ tiện ích
- **Modal nâng cấp** để sửa lỗi và bổ sung thẻ đã tạo
- **Xuất JSON** định dạng chuẩn SillyTavern v6
- **Lưu trữ local** API key và cài đặt
- **Giao diện responsive** hoạt động trên mọi thiết bị

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **AI**: Google Gemini API
- **UI/UX**: Tailwind CSS (dự đoán từ cách style)
- **Components**: Custom components với hooks
- **Build**: Vite để đóng gói và serve

## 📋 Yêu cầu hệ thống

- **Node.js** (phiên bản 16 trở lên)
- **Trình duyệtweb** hiện đại (Chrome, Firefox, Safari, Edge)
- **API Key** Google Gemini (nhận từ [Google AI Studio](https://aikey.studio))

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone https://github.com/yana-arch/webtool-create-card-sillytavern-v6.git
cd webtool-create-card-sillytavern-v6
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình API Key
Nhận API key từ [Google AI Studio](https://aikey.studio) và thêm vào ứng dụng (trong giao diện Settings).

### 4. Chạy ứng dụng
```bash
npm run dev
```

Truy cập `http://localhost:5173` (hoặc cổng mà Vite chỉ định) để sử dụng ứng dụng.

### 🏗️ Build cho production
```bash
npm run build
npm run preview
```

## 📖 Hướng dẫn sử dụng

1. **Cài đặt API Key**: Nhập API key Gemini vào phần Settings (hỗ trợ nhiều key cách nhau bởi dấu phẩy)

2. **Ý tưởng cốt lõi**: 
   - Nhập tên thẻ/nhân vật
   - Mô tả chủ đề và từ khóa
   - Thêm ý tưởng cho tin nhắn đầu tiên

3. **Chọn tính năng**: Bật/tắt các tính năng như màn hình chào mừng, trình tạo nhân vật, bảng trạng thái, hệ thống tiến trình, quan hệ, sách lore

4. **Xưởng giao diện** (tùy chọn cho các tính năng UI):
   - Mô tả yêu cầu cho AI
   - Tạo preview giao diện
   - Chỉnh sửa nếu cần

5. **Tạo thẻ**: Nhấn "Tạo Thẻ" và chờ AI làm việc

6. **Xuất kết quả**: Sao chép JSON đã tạo và import vào SillyTavern

### 🎯 Mẹo sử dụng
- Để có kết quả tốt nhất, mô tả chủ đề chi tiết và cụ thể
- Sử dụng Hyper Mode để tạo nhiều preview nhanh hơn (tốn chi phí hơn)
- Upload tệp tham khảo vào Thư viện Kiến thức để AI học phong cách
- Nhập sách lore từ tệp JSON để tự động điền thông tin liên quan

## 🖼️ Screenshots

*(Thêm screenshots vào thư mục `./screenshots/` và link các ảnh vào đây)*

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Nếu bạn muốn cải thiện ứng dụng:

1. Fork repository này
2. Tạo nhánh feature: `git checkout -b feature/tinh-nang-moi`
3. Commit thay đổi: `git commit -m 'Thêm tính năng xyz'`
4. Push lên nhánh: `git push origin feature/tinh-nang-moi`
5. Tạo Pull Request

### Coding standards
- Sử dụng TypeScript cho tất cả mã mới
- Tuân thủ ESLint rules
- Viết commit messages rõ ràng bằng tiếng Việt

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📧 Liên hệ & Hỗ trợ

- **GitHub Issues**: [Báo lỗi và yêu cầu tính năng](https://github.com/yana-arch/webtool-create-card-sillytavern-v6/issues)
- **Discord**: [Mã nguồn dựa vào](https://ai.studio/apps/drive/1zCdETByIRQKRigiSZf4nFICnInWJodNb)

---

*Được xây dựng với ❤️ bằng sức mạnh của AI để hỗ trợ cộng đồng Role Playing*

## 🔗 Links hữu ích

- [SillyTavern Official](https://sillytavern.github.io/)
- [Google Gemini AI](https://ai.google.dev/)
- [AI Studio](https://aikey.studio)
