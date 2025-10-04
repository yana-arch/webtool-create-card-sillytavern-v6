import React from "react";

import type { CardOptions, Feature, LorebookEntry } from "../types";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { TextInput } from "./TextInput";

interface FeaturesPanelProps {
  features: Record<Feature, boolean>;
  onFeatureChange: (feature: Feature) => void;
  options: Pick<CardOptions, "lorebookEntries" | "customLoreRequests">;
  onOptionChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onAddCustomLoreRequest: () => void;
  onCustomLoreRequestChange: (index: number, value: string) => void;
  onRemoveCustomLoreRequest: (index: number) => void;
  importedLorebook: LorebookEntry[] | null;
  isAnalyzing: boolean;
  onLorebookFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImportedLorebook: () => void;
}

export const FeaturesPanel: React.FC<FeaturesPanelProps> = ({
  features,
  onFeatureChange,
  options,
  onOptionChange,
  onAddCustomLoreRequest,
  onCustomLoreRequestChange,
  onRemoveCustomLoreRequest,
  importedLorebook,
  isAnalyzing,
  onLorebookFileChange,
  onClearImportedLorebook,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">
        2. Tính năng & Nội dung
        <svg
          className="inline-block ml-2 w-5 h-5 cursor-help opacity-70 hover:opacity-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          title="Chọn các tính năng và nội dung mà thẻ nhân vật sẽ bao gồm"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Checkbox
          id="welcomeScreen"
          label="Màn hình Chào mừng"
          checked={features.welcomeScreen}
          onChange={() => onFeatureChange("welcomeScreen")}
          tooltip="Tạo một màn hình giới thiệu đẹp mắt cho tin nhắn đầu tiên."
        />
        <Checkbox
          id="characterCreator"
          label="Trình tạo Nhân vật"
          checked={features.characterCreator}
          onChange={() => onFeatureChange("characterCreator")}
          tooltip="Thêm một biểu mẫu HTML để người dùng tùy chỉnh nhân vật khi bắt đầu."
        />
        <Checkbox
          id="dynamicStatusUI"
          label="Bảng Trạng thái Động"
          checked={features.dynamicStatusUI}
          onChange={() => onFeatureChange("dynamicStatusUI")}
          tooltip="Tạo một bảng trạng thái HTML/CSS/JS để hiển thị các biến số một cách trực quan."
        />
        <Checkbox
          id="progressionSystem"
          label="Hệ thống Tiến trình"
          checked={features.progressionSystem}
          onChange={() => onFeatureChange("progressionSystem")}
          tooltip="Bao gồm hệ thống biến (MVU) để theo dõi các chỉ số như Cấp độ, Máu, Kinh nghiệm."
        />
        <Checkbox
          id="relationshipSystem"
          label="Hệ thống Mối quan hệ"
          checked={features.relationshipSystem}
          onChange={() => onFeatureChange("relationshipSystem")}
          tooltip="Thêm các biến để theo dõi mức độ thiện cảm và suy nghĩ nội tâm của NPC."
        />
        <Checkbox
          id="lorebook"
          label="Sổ tay Thế giới"
          checked={features.lorebook}
          onChange={() => onFeatureChange("lorebook")}
          tooltip="Tạo các mục worldbook chi tiết về bối cảnh, quy tắc và nhân vật phụ."
        />
      </div>

      {features.lorebook && (
        <div className="mt-6 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="mt-2 text-gray-300">
                Đang phân tích Sổ tay Thế giới...
              </p>
            </div>
          ) : importedLorebook ? (
            <div className="animate-fadeIn text-center">
              <h4 className="font-bold text-green-400">
                Đã nhập Sổ tay Thế giới
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                Đã tải thành công {importedLorebook.length} mục. Tên thẻ, chủ đề
                và ý tưởng đã được tự động đề xuất.
              </p>
              <button
                onClick={onClearImportedLorebook}
                className="mt-3 text-xs bg-red-600/50 hover:bg-red-500/50 text-white py-1 px-3 rounded-md"
              >
                Xóa & Tạo thủ công
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label
                    htmlFor="lorebookEntries"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Số mục Lore (Tự động)
                  </label>
                  <input
                    type="number"
                    id="lorebookEntries"
                    name="lorebookEntries"
                    value={options.lorebookEntries}
                    onChange={onOptionChange}
                    min="1"
                    max="50"
                    className="w-24 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={onAddCustomLoreRequest}
                  className="py-2 px-3 bg-purple-600/50 hover:bg-purple-500/50 text-white rounded-md text-sm"
                  title="Thêm yêu cầu lore tùy chỉnh"
                >
                  Thêm Yêu cầu
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                AI sẽ ưu tiên tạo các lore cốt lõi (hướng dẫn) trước, sau đó mới
                đến lore thế giới.
              </p>
              <div className="mt-4 space-y-2">
                {options.customLoreRequests?.map((request, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 animate-fadeIn"
                  >
                    <input
                      type="text"
                      value={request}
                      onChange={(e) =>
                        onCustomLoreRequestChange(index, e.target.value)
                      }
                      placeholder={`Yêu cầu tùy chỉnh #${index + 1}`}
                      className="flex-grow p-2 bg-gray-800/80 border border-gray-600 rounded-lg"
                    />
                    <button
                      onClick={() => onRemoveCustomLoreRequest(index)}
                      className="text-xs bg-red-600/50 hover:bg-red-500/50 text-white py-1 px-2 rounded-md"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-600 my-4"></div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={onLorebookFileChange}
                  className="hidden"
                  id="lorebookFile"
                />
                <Button
                  type="button"
                  onClick={() =>
                    document.getElementById("lorebookFile")?.click()
                  }
                  className="w-full text-center py-2 px-3 bg-blue-600/50 hover:bg-blue-500/50 text-white rounded-md text-sm"
                >
                  ...hoặc Nhập Sổ tay từ File (.json)
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  AI sẽ tự động điền các trường khác dựa trên nội dung tệp của
                  bạn.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
