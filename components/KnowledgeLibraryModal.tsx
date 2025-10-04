import React, { useRef, useState } from "react";

import type { KnowledgeFile } from "../types";

interface KnowledgeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeLibrary: KnowledgeFile[];
  onAddFiles: (files: { name: string; content: string }[]) => void;
  onRemoveFile: (id: string) => void;
}

export const KnowledgeLibraryModal: React.FC<KnowledgeLibraryModalProps> = ({
  isOpen,
  onClose,
  knowledgeLibrary,
  onAddFiles,
  onRemoveFile,
}) => {
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError("");
    const newFiles: { name: string; content: string }[] = [];
    const promises: Promise<void>[] = [];
    let fileError = "";

    Array.from(files).forEach((file) => {
      const typedFile = file as File;
      if (!typedFile.name.toLowerCase().endsWith(".json")) {
        fileError = "Vui lòng chỉ tải lên các tệp .json.";
        return;
      }

      const promise = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            // FIX: Use a specific type for the parsed JSON to safely validate its structure,
            // resolving errors from `JSON.parse` returning `unknown` in a strict environment.
            type CardForValidation = {
              name?: string;
              data?: { name?: string };
            };
            const parsed = JSON.parse(content) as CardForValidation;
            if (!parsed.name && !parsed.data?.name) {
              reject(`Tệp '${typedFile.name}' không phải là một thẻ hợp lệ.`);
              return;
            }
            newFiles.push({ name: typedFile.name, content });
            resolve();
          } catch (err) {
            reject(`Không thể phân tích cú pháp tệp '${typedFile.name}'.`);
          }
        };
        reader.onerror = () => {
          reject(`Đã xảy ra lỗi khi đọc tệp '${typedFile.name}'.`);
        };
        reader.readAsText(typedFile);
      });
      promises.push(promise);
    });

    if (fileError) {
      setError(fileError);
      if (event.target) event.target.value = "";
      return;
    }

    Promise.all(promises)
      .then(() => {
        if (newFiles.length > 0) {
          onAddFiles(newFiles);
        }
      })
      .catch((err) => {
        setError(err.toString());
      })
      .finally(() => {
        if (event.target) {
          event.target.value = "";
        }
      });
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold font-display text-purple-300">
            Thư viện Kiến thức
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="mb-4 p-4 bg-gray-900/40 border border-gray-600 rounded-lg">
            <p className="text-gray-300 text-sm">
              Tải lên các file thẻ nhân vật (.json) để AI học hỏi. Các file này
              được lưu trữ cục bộ trong trình duyệt của bạn và sẽ không được gửi
              đi bất cứ đâu trừ khi bạn tạo một thẻ mới.
            </p>
          </div>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <button
            onClick={triggerFileSelect}
            className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Thêm File vào Thư viện
          </button>
          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <h4 className="text-lg font-bold text-purple-200 mb-3 mt-6">
            Các File Hiện có
          </h4>
          <div className="space-y-2">
            {knowledgeLibrary.length > 0 ? (
              knowledgeLibrary.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <span className="text-gray-200 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="text-xs bg-red-600/50 hover:bg-red-500/50 text-white py-1 px-2 rounded-md transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Thư viện của bạn trống.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
