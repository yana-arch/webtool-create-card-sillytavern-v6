import React, { useState } from "react";

import { Button } from "./Button";

interface Step {
  title: string;
  content: string;
}

const steps: Step[] = [
  {
    title: "Cài đặt API Key",
    content:
      '1. Truy cập trang <a href="https://aikey.studio" target="_blank" class="text-purple-400 underline">aikey.studio</a>.<br>2. Đăng nhập và lấy API Key của bạn.<br>3. Dán API Key vào mục "Cài đặt" ở trên. Bạn có thể thêm nhiều key, cách nhau bởi , hoặc xuống dòng để tăng tốc với Hyper Mode.',
  },
  {
    title: "Nhập Ý tưởng Cốt lõi",
    content:
      "Điền tên thẻ/nhân vật, chủ đề & từ khóa, và ý tưởng cho tin nhắn đầu tiên. Đây là nền tảng để AI xây dựng thẻ phù hợp. Bạn có thể upload tệp tham khảo vào Thư viện Kiến thức để AI học hỏi phong cách.",
  },
  {
    title: "Chọn Tính năng",
    content:
      "Bật tắt các tính năng như màn hình chào mừng, trình tạo nhân vật, bảng trạng thái động, hệ thống tiến trình, quan hệ, sách lore. Nếu bật tính năng giao diện, bạn cần thiết kế chúng bên phải.",
  },
  {
    title: "Thiết kế Giao diện (Tùy chọn)",
    content:
      'Nếu bật một trong ba tính năng: Chào mừng, Tạo nhân vật, Bảng trạng thái.<br>Nơi đây, bạn mô tả yêu cầu cho AI, sau đó nhấn "Tạo Giao diện Mẫu" để xem preview. Chọn một và chỉnh sửa nếu cần.',
  },
  {
    title: "Tạo Thẻ",
    content:
      'Nhấn nút "Tạo Thẻ" màu lớn. Cơm sẽ hiển thị tiến trình. Sử dụng Hyper Mode và nhiều API key để tạo nhanh hơn (chi phí cao hơn).',
  },
  {
    title: "Xuất Kết quả",
    content:
      'JSON sẽ hiện ở phần kết quả. Sao chép toàn bộ, import vào SillyTavern. Nếu cần sửa lỗi, nhấn "Bổ sung / Sửa lỗi" để chỉnh sửa sau.',
  },
];

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const nextStep = () =>
    setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 0));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-purple-300">
              Hướng Dẫn Sử Dụng
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">
              {steps[currentStep].title}
            </h3>
            <p
              className="text-gray-300 mt-2"
              dangerouslySetInnerHTML={{ __html: steps[currentStep].content }}
            ></p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Bước {currentStep + 1} / {steps.length}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="py-2 px-4 text-sm"
            >
              Trước
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="py-2 px-4 text-sm"
            >
              Tiếp
            </Button>
            {currentStep === steps.length - 1 && (
              <Button
                onClick={onClose}
                className="py-2 px-4 text-sm bg-green-600 hover:bg-green-500"
              >
                Hoàn thành
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
