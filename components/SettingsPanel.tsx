import React from "react";

import { Checkbox } from "./Checkbox";
import { TextInput } from "./TextInput";

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  hyperMode: boolean;
  onHyperModeChange: (checked: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiKey,
  onApiKeyChange,
  hyperMode,
  onHyperModeChange,
}) => {
  return (
    <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl">
      <h2 className="text-xl font-bold font-display text-purple-300 mb-3">
        Cài đặt
        <span title="Cấu hình API Key và chế độ nâng cao">
          <svg
            className="inline-block ml-2 w-4 h-4 cursor-help opacity-70 hover:opacity-100"
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-end">
        <TextInput
          isTextArea={true}
          label="API Key Gemini (cách nhau bởi dấu , hoặc xuống dòng)"
          name="apiKey"
          value={apiKey}
          onChange={onApiKeyChange}
          placeholder="Dán một hoặc nhiều API Key vào đây..."
        />
        <Checkbox
          id="hyperMode"
          label="Hyper Mode (Tăng tốc)"
          checked={hyperMode}
          onChange={onHyperModeChange}
          tooltip="Thực hiện nhiều lệnh gọi API song song để tạo nhiều giao diện nhanh hơn. Có thể tốn nhiều chi phí hơn."
        />
      </div>
    </div>
  );
};
