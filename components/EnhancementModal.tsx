

import React, { useState, useCallback } from 'react';
import type { SillyTavernCard, UIPreview as UIPreviewType, KnowledgeFile } from '../types';
import { addLoreEntries, generateRegexUIPreviews, generateAndAddRegex, fixSillyTavernCard } from '../services/geminiService';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { UIPreview } from './UIPreview';

interface EnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: SillyTavernCard;
  onCardUpdate: (updatedCard: SillyTavernCard) => void;
  apiKey: string;
  knowledgeLibrary: KnowledgeFile[];
}

type Mode = 'select' | 'lore' | 'regex' | 'fix';

export const EnhancementModal: React.FC<EnhancementModalProps> = ({ isOpen, onClose, card, onCardUpdate, apiKey, knowledgeLibrary }) => {
  const [mode, setMode] = useState<Mode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Lore state
  const [loreCount, setLoreCount] = useState(3);

  // Regex state
  const [regexDescription, setRegexDescription] = useState('');
  const [numRegexPreviews, setNumRegexPreviews] = useState(2);
  const [regexPreviews, setRegexPreviews] = useState<UIPreviewType[]>([]);
  const [selectedRegexIndex, setSelectedRegexIndex] = useState<number | null>(null);

  // Fix state
  const [fixDescription, setFixDescription] = useState('');
  const [fixReferenceId, setFixReferenceId] = useState('');

  const handleClose = () => {
    // Reset state on close
    setMode('select');
    setIsLoading(false);
    setError('');
    setLoreCount(3);
    setRegexDescription('');
    setRegexPreviews([]);
    setSelectedRegexIndex(null);
    setFixDescription('');
    setFixReferenceId('');
    onClose();
  };

  const handleAddLore = async () => {
    if (!apiKey) {
      setError('Vui lòng cung cấp API Key.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const updatedCard = await addLoreEntries(apiKey, card, loreCount);
      onCardUpdate(updatedCard);
      handleClose();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Thêm lore thất bại.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateRegexPreviews = useCallback(async () => {
    if (!apiKey) {
        setError('Vui lòng cung cấp API Key.');
        return;
    }
    if (!regexDescription) {
        setError('Vui lòng mô tả chức năng của giao diện bạn muốn tạo.');
        return;
    }
    setIsLoading(true);
    setError('');
    setRegexPreviews([]);
    setSelectedRegexIndex(null);
    try {
        const previews = await generateRegexUIPreviews(apiKey, regexDescription, card.description, numRegexPreviews);
        setRegexPreviews(previews);
    } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Tạo giao diện mẫu thất bại.');
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, regexDescription, card.description, numRegexPreviews]);
  
  const handleAddRegexToCard = async () => {
    if (!apiKey) {
        setError('Vui lòng cung cấp API Key.');
        return;
    }
    if (selectedRegexIndex === null) {
        setError('Vui lòng chọn một giao diện mẫu trước.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const selectedUiCode = regexPreviews[selectedRegexIndex].code;
      const updatedCard = await generateAndAddRegex(apiKey, card, regexDescription, selectedUiCode);
      onCardUpdate(updatedCard);
      handleClose();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Thêm regex vào thẻ thất bại.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFixCard = async () => {
    if (!apiKey) {
      setError('Vui lòng cung cấp API Key.');
      return;
    }
     if (!fixDescription) {
        setError('Vui lòng mô tả lỗi bạn đang gặp phải.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const updatedCard = await fixSillyTavernCard(apiKey, card, fixDescription, knowledgeLibrary, fixReferenceId);
      onCardUpdate(updatedCard);
      handleClose();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Sửa thẻ thất bại.');
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  const renderContent = () => {
    switch (mode) {
      case 'lore':
        return (
          <div>
            <h3 className="text-xl font-bold font-display text-purple-300 mb-4">Bổ sung Sổ tay Thế giới</h3>
            <p className="text-gray-400 mb-4">AI sẽ phân tích thẻ hiện tại và tạo ra các mục lore mới để làm phong phú thêm thế giới của bạn.</p>
            <div className="mb-4">
              <label htmlFor="loreCount" className="block text-sm font-medium text-gray-300 mb-1">Số lượng mục lore cần thêm</label>
              <input type="number" id="loreCount" value={loreCount} onChange={(e) => setLoreCount(parseInt(e.target.value, 10))} min="1" max="20" className="w-24 p-2 bg-gray-800/80 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <Button onClick={handleAddLore} disabled={isLoading || !apiKey} className="w-full">
              {isLoading ? <><Spinner /> Đang tạo Lore...</> : 'Bắt đầu'}
            </Button>
          </div>
        );
      case 'regex':
        return (
          <div>
            <h3 className="text-xl font-bold font-display text-purple-300 mb-4">Bổ sung Giao diện Regex</h3>
             <div className="space-y-4">
                <div>
                    <label htmlFor="regexDescription" className="block text-sm font-medium text-gray-300 mb-1">1. Mô tả ý tưởng giao diện</label>
                    <textarea id="regexDescription" value={regexDescription} onChange={(e) => setRegexDescription(e.target.value)} rows={3} className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="ví dụ: Tạo một bảng thông báo nhiệm vụ, có tiêu đề, mô tả và trạng thái (đang làm/hoàn thành)."></textarea>
                </div>
                <div className="flex items-end gap-4">
                    <div>
                         <label htmlFor="numRegexPreviews" className="block text-sm font-medium text-gray-300 mb-1">Số lượng mẫu</label>
                        <input type="number" id="numRegexPreviews" value={numRegexPreviews} onChange={(e) => setNumRegexPreviews(parseInt(e.target.value, 10))} min="1" max="4" className="w-24 p-2 bg-gray-800/80 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <Button onClick={handleGenerateRegexPreviews} disabled={isLoading || !regexDescription || !apiKey} className="py-2 flex-grow">
                        {isLoading && !regexPreviews.length ? <><Spinner /> Đang thiết kế...</> : '2. Tạo Giao diện Mẫu'}
                    </Button>
                </div>
             </div>
             {isLoading && !regexPreviews.length && <p className="text-center mt-4 text-gray-400">AI đang phác thảo ý tưởng...</p>}
             {regexPreviews.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-bold text-purple-200 mb-3">3. Chọn một Giao diện</h4>
                    <div className="grid grid-cols-1 gap-6 max-h-[40vh] overflow-y-auto p-2 bg-black/20 rounded-lg">
                        {regexPreviews.map((preview, index) => (
                            <UIPreview key={index} name={preview.name} htmlCode={preview.code} isSelected={selectedRegexIndex === index} onSelect={() => setSelectedRegexIndex(index)} />
                        ))}
                    </div>
                     <Button onClick={handleAddRegexToCard} disabled={isLoading || selectedRegexIndex === null || !apiKey} className="w-full mt-4">
                        {isLoading ? <><Spinner /> Đang tích hợp...</> : '4. Thêm Regex vào Thẻ'}
                    </Button>
                </div>
             )}
          </div>
        );
      case 'fix':
        return (
           <div>
            <h3 className="text-xl font-bold font-display text-purple-300 mb-4">Sửa lỗi Thẻ</h3>
            <p className="text-gray-400 mb-4">Mô tả vấn đề bạn đang gặp phải. Nếu có thể, hãy chọn một thẻ hoạt động tốt từ thư viện của bạn để AI tham khảo cách sửa lỗi.</p>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="fixDescription" className="block text-sm font-medium text-gray-300 mb-1">Mô tả lỗi</label>
                    <textarea id="fixDescription" value={fixDescription} onChange={(e) => setFixDescription(e.target.value)} rows={3} className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="ví dụ: Bảng trạng thái không hiển thị đúng. Nút bấm trong trình tạo nhân vật không hoạt động. JSON không hợp lệ..."></textarea>
                </div>
                {knowledgeLibrary.length > 0 && (
                  <div>
                    <label htmlFor="fixReferenceId" className="block text-sm font-medium text-gray-300 mb-1">File tham khảo (Rất khuyến khích)</label>
                    <select id="fixReferenceId" name="fixReferenceId" value={fixReferenceId} onChange={(e) => setFixReferenceId(e.target.value)} className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg">
                      <option value="">Không chọn file tham khảo</option>
                      {knowledgeLibrary.map(file => (<option key={file.id} value={file.id}>{file.name}</option>))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2">Chọn file hoạt động tốt để AI học cấu trúc đúng và áp dụng vào thẻ bị lỗi.</p>
                  </div>
                )}
            </div>
            <Button onClick={handleFixCard} disabled={isLoading || !fixDescription || !apiKey} className="w-full mt-6">
              {isLoading ? <><Spinner /> Đang sửa lỗi...</> : 'Bắt đầu Sửa lỗi'}
            </Button>
          </div>
        );
      default: // 'select' mode
        return (
          <div>
            <h3 className="text-xl font-bold font-display text-purple-300 mb-4">Xưởng Nâng cấp Thẻ</h3>
            <p className="text-gray-400 mb-6">Chọn một hành động để bổ sung, sửa lỗi hoặc làm phong phú thêm thẻ nhân vật của bạn.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setMode('lore')} className="p-6 bg-gray-700/50 rounded-lg text-left hover:bg-gray-700 transition-colors border border-gray-600 hover:border-purple-500">
                <h4 className="font-bold text-lg text-purple-300">Bổ sung Lore</h4>
                <p className="text-sm text-gray-400 mt-1">Tự động tạo các mục Sổ tay Thế giới mới để mở rộng bối cảnh.</p>
              </button>
              <button onClick={() => setMode('regex')} className="p-6 bg-gray-700/50 rounded-lg text-left hover:bg-gray-700 transition-colors border border-gray-600 hover:border-purple-500">
                <h4 className="font-bold text-lg text-purple-300">Bổ sung Giao diện Regex</h4>
                <p className="text-sm text-gray-400 mt-1">Tạo một giao diện tùy chỉnh mới và tự động tích hợp nó vào thẻ.</p>
              </button>
            </div>
             <div className="mt-4">
                <button onClick={() => setMode('fix')} className="w-full p-6 bg-yellow-900/30 rounded-lg text-left hover:bg-yellow-900/50 transition-colors border border-yellow-700 hover:border-yellow-500">
                    <h4 className="font-bold text-lg text-yellow-300">Sửa lỗi Thẻ</h4>
                    <p className="text-sm text-gray-400 mt-1">AI sẽ phân tích và sửa các lỗi trong thẻ của bạn, từ lỗi JSON đến giao diện bị hỏng.</p>
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
            {mode !== 'select' && (
                 <button onClick={() => { setMode('select'); setError(''); setRegexPreviews([]); setSelectedRegexIndex(null); }} className="text-gray-400 hover:text-white">&larr; Quay lại</button>
            )}
           <div className="flex-grow"></div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-900/40 text-red-300 border border-red-500/50 rounded-lg">{error}</div>}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};