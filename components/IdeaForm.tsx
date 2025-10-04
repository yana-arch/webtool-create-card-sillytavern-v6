import React from "react";

import type { CardOptions } from "../types";

import { TextInput } from "./TextInput";

interface IdeaFormProps {
  options: Pick<
    CardOptions,
    "name" | "theme" | "firstMessageIdea" | "referenceCardId"
  >;
  onOptionChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  knowledgeLibrary: Array<{ id: string; name: string }>;
}

export const IdeaForm: React.FC<IdeaFormProps> = ({
  options,
  onOptionChange,
  knowledgeLibrary,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">
        1. Ý tưởng Cốt lõi
        <span title="Nhập tên nhân vật, chủ đề, và ý tưởng tin nhắn đầu tiên - nền tảng cho việc tạo thẻ">
          <svg
            className="inline-block ml-2 w-5 h-5 cursor-help opacity-70 hover:opacity-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      </h2>
      <div className="space-y-4">
        <TextInput
          label="Tên Thẻ/Nhân vật"
          name="name"
          value={options.name}
          onChange={onOptionChange}
          placeholder="ví dụ: Thám tử Chronos"
          required
        />
        <TextInput
          label="Chủ đề & Từ khóa"
          name="theme"
          value={options.theme}
          onChange={onOptionChange}
          placeholder="ví dụ: Cyberpunk, Noir, Du hành thời gian"
          required
        />
        <TextInput
          isTextArea={true}
          label="Ý tưởng Tin nhắn Đầu tiên"
          name="firstMessageIdea"
          value={options.firstMessageIdea}
          onChange={onOptionChange}
          placeholder="ví dụ: Tỉnh dậy trong một con hẻm mưa với chứng mất trí nhớ..."
        />
        {knowledgeLibrary.length > 0 && (
          <div>
            <label
              htmlFor="referenceCardId"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              File tham khảo (Tùy chọn)
            </label>
            <select
              id="referenceCardId"
              name="referenceCardId"
              value={options.referenceCardId}
              onChange={onOptionChange}
              className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg"
            >
              <option value="">Học hỏi từ toàn bộ thư viện</option>
              {knowledgeLibrary.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Chọn file để AI mô phỏng phong cách giao diện. Nếu không, AI sẽ
              lấy cảm hứng từ tất cả.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
