import React from "react";

import type { Feature, UIPreview as UIPreviewType } from "../types";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Spinner } from "./Spinner";
import { UIPreview } from "./UIPreview";

interface UIWorkshopState {
  isLoading: boolean;
  error: string;
  previews: UIPreviewType[];
  selectedIndex: number | null;
  editingIndex: number | null;
  editRequest: string;
}

interface UIWorkshopProps {
  // Feature flags
  features: Record<Feature, boolean>;

  // Welcome Screen state
  welcomeUI: UIWorkshopState & {
    options: {
      tone: "epic" | "mysterious" | "friendly" | "minimalist";
      length: "short" | "medium" | "long";
      effects: boolean;
      numToGenerate: number;
    };
  };

  // Creator state
  creatorUI: UIWorkshopState & {
    options: { description: string; numToGenerate: number };
  };

  // Status Panel state
  statusPanelUI: UIWorkshopState & {
    options: { description: string; numToGenerate: number };
  };

  // Theme for generation
  theme: string;

  // Event handlers
  onGeneratePreviews: (type: keyof typeof uiStates) => void;
  onSelectPreview: (type: keyof typeof uiStates, index: number) => void;
  onStartEdit: (type: keyof typeof uiStates, index: number) => void;
  onPerformEdit: (type: keyof typeof uiStates) => void;
  onUIOptionChange: (
    type: keyof typeof uiStates,
    field: string,
    value: any,
  ) => void;
  onUIEditRequestChange: (type: keyof typeof uiStates, value: string) => void;

  // Loading states
  apiKey: string;
}

type UIStateKey = "welcomeScreen" | "characterCreator" | "dynamicStatusUI";

const uiStates = {
  welcomeScreen: "welcomeUI" as const,
  characterCreator: "creatorUI" as const,
  dynamicStatusUI: "statusPanelUI" as const,
};

const uiTitles = {
  welcomeScreen: "Xưởng Chào mừng",
  characterCreator: "Xưởng Tạo Nhân vật",
  dynamicStatusUI: "Xưởng Bảng Trạng thái",
} as const;

export const UIWorkshop: React.FC<UIWorkshopProps> = ({
  features,
  welcomeUI,
  creatorUI,
  statusPanelUI,
  theme,
  onGeneratePreviews,
  onSelectPreview,
  onStartEdit,
  onPerformEdit,
  onUIOptionChange,
  onUIEditRequestChange,
  apiKey,
}) => {
  const uiData = {
    welcomeScreen: welcomeUI,
    characterCreator: creatorUI,
    dynamicStatusUI: statusPanelUI,
  };

  const renderWorkshop = (type: UIStateKey) => {
    const data = uiData[type];
    const isEnabled = features[type];

    if (!isEnabled) return null;

    const handleGenerate = () =>
      onGeneratePreviews(type as keyof typeof uiStates);
    const handleSelect = (index: number) =>
      onSelectPreview(type as keyof typeof uiStates, index);
    const handleStartEditLocal = (index: number) =>
      onStartEdit(type as keyof typeof uiStates, index);
    const handlePerformEditLocal = () =>
      onPerformEdit(type as keyof typeof uiStates);

    const renderOptions = () => {
      if (type === "welcomeScreen") {
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm">Giọng văn</label>
              <select
                value={welcomeUI.options.tone}
                onChange={(e) => onUIOptionChange(type, "tone", e.target.value)}
                className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"
              >
                <option value="epic">Sử thi</option>
                <option value="mysterious">Bí ẩn</option>
                <option value="friendly">Thân thiện</option>
                <option value="minimalist">Tối giản</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Độ dài</label>
              <select
                value={welcomeUI.options.length}
                onChange={(e) =>
                  onUIOptionChange(type, "length", e.target.value)
                }
                className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"
              >
                <option value="short">Ngắn</option>
                <option value="medium">Vừa</option>
                <option value="long">Dài</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Hiệu ứng</label>
              <div className="mt-2">
                <Checkbox
                  id="effects"
                  label="Động"
                  checked={welcomeUI.options.effects}
                  onChange={() =>
                    onUIOptionChange(
                      type,
                      "effects",
                      !welcomeUI.options.effects,
                    )
                  }
                  tooltip="Thêm hiệu ứng CSS động."
                />
              </div>
            </div>
            <div>
              <label className="text-sm">Số lượng</label>
              <input
                type="number"
                value={welcomeUI.options.numToGenerate}
                onChange={(e) =>
                  onUIOptionChange(
                    type,
                    "numToGenerate",
                    parseInt(e.target.value, 10) || 1,
                  )
                }
                min="1"
                max="8"
                className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"
              />
            </div>
          </div>
        );
      } else {
        const descValue =
          type === "characterCreator"
            ? creatorUI.options.description
            : statusPanelUI.options.description;
        return (
          <textarea
            value={descValue}
            onChange={(e) =>
              onUIOptionChange(type, "description", e.target.value)
            }
            rows={3}
            className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg"
            placeholder={
              type === "characterCreator"
                ? "ví dụ: Giao diện cho phép chọn tên, tuổi và phe phái."
                : "ví dụ: Giao diện dạng tab, tab 1 là chỉ số, tab 2 là trang bị."
            }
          />
        );
      }
    };

    return (
      <div className="mt-6 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
        <h3 className="text-lg font-bold text-purple-200 mb-3">
          {uiTitles[type]}
        </h3>

        {renderOptions()}

        <div className="flex items-end gap-4 mt-2">
          <Button
            onClick={handleGenerate}
            disabled={
              data.isLoading ||
              !theme ||
              !apiKey ||
              (type !== "welcomeScreen" && !(data.options as any).description)
            }
            className="w-full py-2"
          >
            {data.isLoading ? (
              <>
                <Spinner /> Đang thiết kế...
              </>
            ) : (
              "Tạo Giao diện Mẫu"
            )}
          </Button>

          {type !== "welcomeScreen" && (
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                value={(data.options as any).numToGenerate}
                onChange={(e) =>
                  onUIOptionChange(
                    type,
                    "numToGenerate",
                    parseInt(e.target.value) || 1,
                  )
                }
                min="1"
                max="8"
                className="w-20 p-2 bg-gray-800/80 border border-gray-600 rounded-lg text-center"
              />
            </div>
          )}
        </div>

        {data.error && (
          <p className="mt-3 text-sm text-red-400">{data.error}</p>
        )}

        {data.previews.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-bold text-purple-200 mb-3">
              Chọn một Giao diện
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.previews.map((preview, index) => (
                <div key={index}>
                  <UIPreview
                    name={preview.name}
                    htmlCode={preview.code}
                    isSelected={data.selectedIndex === index}
                    onSelect={() => handleSelect(index)}
                    onEdit={() => handleStartEditLocal(index)}
                  />
                  {data.editingIndex === index && (
                    <div className="mt-2 p-3 bg-gray-900/50 border border-purple-500 rounded-lg animate-fadeIn">
                      <textarea
                        value={data.editRequest}
                        onChange={(e) =>
                          onUIEditRequestChange(
                            type as keyof typeof uiStates,
                            e.target.value,
                          )
                        }
                        rows={2}
                        className="w-full p-2 bg-gray-700 rounded-md"
                        placeholder="Yêu cầu chỉnh sửa (vd: đổi màu thành xanh)..."
                      />
                      <Button
                        onClick={handlePerformEditLocal}
                        disabled={data.isLoading || !apiKey}
                        className="w-full text-sm py-1 mt-2"
                      >
                        {data.isLoading ? <Spinner /> : "Cập nhật Giao diện"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (
    !features.welcomeScreen &&
    !features.characterCreator &&
    !features.dynamicStatusUI
  ) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 text-gray-500 text-center">
        Bật một tính năng giao diện ở bên trái để bắt đầu thiết kế.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">
        3. Xưởng Thiết kế Giao diện
        <span title="Tạo và tùy chỉnh các giao diện HTML/CSS/JS cho các tính năng đã chọn">
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
      {renderWorkshop("welcomeScreen")}
      {renderWorkshop("characterCreator")}
      {renderWorkshop("dynamicStatusUI")}
    </div>
  );
};
