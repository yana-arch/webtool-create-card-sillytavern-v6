import React, { useState } from "react";

interface UIPreviewProps {
  name: string;
  htmlCode: string;
  isSelected: boolean;
  onSelect: () => void;
  // FIX: Made onEdit optional to allow usage in contexts where editing is not available.
  onEdit?: () => void;
}

export const UIPreview: React.FC<UIPreviewProps> = ({
  name,
  htmlCode,
  isSelected,
  onSelect,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a full HTML document for the iframe, replacing the data block with a placeholder for preview.
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #1a202c; overflow-x: hidden;">
        ${htmlCode.replace(
          /<DATA_BLOCK>[\s\S]*?<\/DATA_BLOCK>/s,
          `
          <div style="color: #a0aec0; font-family: sans-serif; padding: 1rem; text-align: center; border: 1px dashed #4a5568; margin: 1rem; border-radius: 0.5rem; background-color: rgba(255,255,255,0.05);">
            Đây là dữ liệu mẫu tượng trưng.
            <br>
            <small>Giao diện thực tế sẽ được lồng ghép với dữ liệu thẻ.</small>
          </div>
        `,
        )}
      </body>
    </html>
  `;

  return (
    <div
      className={`relative border-2 rounded-lg transition-all duration-300 ${isSelected ? "border-purple-500 shadow-2xl scale-105" : "border-gray-700 hover:border-purple-700"}`}
    >
      <div className="p-3 bg-gray-900/60 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-purple-300 truncate">{name}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded-md transition-colors"
        >
          {isExpanded ? "Thu gọn" : "Mở rộng"}
        </button>
      </div>
      <iframe
        srcDoc={fullHtml}
        title={`Preview of ${name}`}
        sandbox="allow-scripts"
        className={`w-full bg-gray-800 border-0 transition-all duration-300 ${isExpanded ? "h-[70vh]" : "h-64"}`}
        scrolling={isExpanded ? "auto" : "no"}
      />
      <div className="p-3 bg-gray-900/60 rounded-b-lg flex gap-2">
        <button
          onClick={onSelect}
          disabled={isSelected}
          className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors duration-200
                     bg-purple-600 hover:bg-purple-700
                     disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSelected ? "✓ Đã chọn" : "Chọn Giao diện này"}
        </button>
        {/* FIX: Conditionally render the Edit button only if the onEdit prop is provided. */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 text-sm font-semibold text-white rounded-md transition-colors duration-200 bg-gray-600 hover:bg-gray-700"
            title="Chỉnh sửa giao diện này"
          >
            Chỉnh sửa
          </button>
        )}
      </div>
    </div>
  );
};
