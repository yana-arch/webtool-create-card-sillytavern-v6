import React, { useState } from "react";

interface CodeDisplayProps {
  jsonString: string;
  fileName?: string;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({
  jsonString,
  fileName = "character_card",
}) => {
  const [copyText, setCopyText] = useState("Sao chép JSON");

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopyText("Đã sao chép!");
      setTimeout(() => setCopyText("Sao chép JSON"), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeFileName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    a.download = `${safeFileName || "character"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-center p-3 bg-gray-900/40 rounded-t-xl border-b border-gray-700">
        <span className="text-sm font-medium text-gray-400">Thẻ đã tạo</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs bg-purple-600/50 hover:bg-purple-500/50 text-white py-1 px-3 rounded-md transition-colors"
          >
            {copyText}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs bg-pink-600/50 hover:bg-pink-500/50 text-white py-1 px-3 rounded-md transition-colors"
          >
            Tải xuống JSON
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm overflow-auto flex-grow text-purple-200">
        <code className="whitespace-pre-wrap">{jsonString}</code>
      </pre>
    </div>
  );
};
