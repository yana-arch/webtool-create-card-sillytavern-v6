

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  generateSillyTavernCard, 
  generateWelcomeScreenPreviews, 
  generateCreatorPreviews, 
  generateStatusPanelPreviews, 
  editUIPreview,
  analyzeLorebookForSuggestions
} from './services/geminiService';
import type { CardOptions, Feature, UIPreview as UIPreviewType, SillyTavernCard, LorebookEntry } from './types';
import { useKnowledgeLibrary } from './hooks/useKnowledgeLibrary';
import { Checkbox } from './components/Checkbox';
import { TextInput } from './components/TextInput';
import { Button } from './components/Button';
import { CodeDisplay } from './components/CodeDisplay';
import { Spinner } from './components/Spinner';
import { UIPreview } from './components/UIPreview';
import { EnhancementModal } from './components/EnhancementModal';
import { KnowledgeLibraryModal } from './components/KnowledgeLibraryModal';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [hyperMode, setHyperMode] = useState<boolean>(() => localStorage.getItem('hyperMode') === 'true');

  useEffect(() => { localStorage.setItem('geminiApiKey', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('hyperMode', String(hyperMode)); }, [hyperMode]);
  
  const apiKeyIndex = useRef(0);
  const getNextKeyStartIndex = useCallback((): number => {
    const keys = apiKey.split(/[\n,]/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return 0;
    const index = apiKeyIndex.current;
    apiKeyIndex.current = (apiKeyIndex.current + 1) % keys.length;
    return index;
  }, [apiKey]);


  const [options, setOptions] = useState<Omit<CardOptions, 'welcomeScreenCode' | 'creatorCode' | 'statusPanelCode'>>({
    name: '',
    theme: '',
    firstMessageIdea: '',
    template: 'default',
    lorebookEntries: 5,
    customLoreRequests: [],
    referenceCardId: '',
  });

  const [features, setFeatures] = useState<Record<Feature, boolean>>({
    welcomeScreen: true,
    characterCreator: true,
    dynamicStatusUI: true,
    progressionSystem: true,
    relationshipSystem: true,
    worldMap: false,
    lorebook: true,
  });

  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [cardObject, setCardObject] = useState<SillyTavernCard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [importedLorebook, setImportedLorebook] = useState<LorebookEntry[] | null>(null);
  const lorebookInputRef = useRef<HTMLInputElement>(null);

  const [isEnhancementModalOpen, setIsEnhancementModalOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  const { knowledgeLibrary, addFilesToLibrary, removeFileFromLibrary } = useKnowledgeLibrary();

  // State for UI Workshops
  const [welcomeUI, setWelcomeUI] = useState({
    isLoading: false, error: '', previews: [] as UIPreviewType[], selectedIndex: null as number | null,
    options: { tone: 'epic' as 'epic' | 'mysterious' | 'friendly' | 'minimalist', length: 'medium' as 'short' | 'medium' | 'long', effects: true, numToGenerate: 2 },
    editingIndex: null as number | null, editRequest: ''
  });
  const [creatorUI, setCreatorUI] = useState({
    isLoading: false, error: '', previews: [] as UIPreviewType[], selectedIndex: null as number | null,
    options: { description: '', numToGenerate: 2 },
    editingIndex: null as number | null, editRequest: ''
  });
  const [statusPanelUI, setStatusPanelUI] = useState({
    isLoading: false, error: '', previews: [] as UIPreviewType[], selectedIndex: null as number | null,
    options: { description: '', numToGenerate: 2 },
    editingIndex: null as number | null, editRequest: ''
  });
  
  const uiStates = { welcomeScreen: welcomeUI, characterCreator: creatorUI, dynamicStatusUI: statusPanelUI };
  const setUiStates = { welcomeScreen: setWelcomeUI, characterCreator: setCreatorUI, dynamicStatusUI: setStatusPanelUI };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOptions(prev => ({ ...prev, [name]: name === 'lorebookEntries' ? (parseInt(value, 10) || 1) : value, }));
  };
  
  const handleFeatureChange = (feature: Feature) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };
  
  const handleAddCustomLoreRequest = () => setOptions(prev => ({ ...prev, customLoreRequests: [...(prev.customLoreRequests || []), ''], }));
  const handleCustomLoreRequestChange = (index: number, value: string) => setOptions(prev => { const reqs = [...(prev.customLoreRequests || [])]; reqs[index] = value; return { ...prev, customLoreRequests: reqs }; });
  const handleRemoveCustomLoreRequest = (index: number) => setOptions(prev => ({ ...prev, customLoreRequests: (prev.customLoreRequests || []).filter((_, i) => i !== index), }));
  
  const handleUIOptionChange = (type: keyof typeof uiStates, field: string, value: any) => {
    setUiStates[type](prev => ({ ...prev, options: { ...prev.options, [field]: value } }));
  };

  const findLorebookEntries = (parsedJson: any): LorebookEntry[] | null => {
    if (Array.isArray(parsedJson)) {
        if (parsedJson.length > 0 && parsedJson[0].keys && parsedJson[0].content) {
            return parsedJson as LorebookEntry[];
        }
    }
    if (typeof parsedJson === 'object' && parsedJson !== null) {
        if (parsedJson.data?.character_book?.entries) return parsedJson.data.character_book.entries;
        if (parsedJson.character_book?.entries) return parsedJson.character_book.entries;
        if (parsedJson.entries && Array.isArray(parsedJson.entries)) return parsedJson.entries;
    }
    return null;
  };

  const handleLorebookFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !apiKey) {
          if(!apiKey) setError("Vui lòng nhập API Key trước khi nhập Sổ tay.");
          return;
      }

      setError('');
      setIsAnalyzing(true);

      try {
          const content = await file.text();
          const parsed = JSON.parse(content);
          const entries = findLorebookEntries(parsed);

          if (!entries || entries.length === 0) {
              throw new Error("Không tìm thấy dữ liệu Sổ tay Thế giới hợp lệ trong tệp JSON.");
          }

          const suggestions = await analyzeLorebookForSuggestions(apiKey, JSON.stringify(entries));
          
          setOptions(prev => ({
              ...prev,
              name: suggestions.name,
              theme: suggestions.theme,
              firstMessageIdea: suggestions.firstMessageIdea,
          }));
          setImportedLorebook(entries);

      } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : "Đã xảy ra lỗi khi xử lý tệp Sổ tay Thế giới.");
      } finally {
          setIsAnalyzing(false);
          if (event.target) event.target.value = '';
      }
  };
  
  const handleClearImportedLorebook = () => {
      setImportedLorebook(null);
  };

  const handleGeneratePreviews = useCallback(async (type: keyof typeof uiStates) => {
    if (!apiKey) {
      setError('Vui lòng nhập API Key của bạn trong phần Cài đặt.');
      return;
    }
    if (!options.theme) {
      setUiStates[type](prev => ({...prev, error: 'Vui lòng nhập "Chủ đề & Từ khóa" trước.'}));
      return;
    }
    setUiStates[type](prev => ({...prev, isLoading: true, error: '', previews: [], selectedIndex: null}));

    try {
      let previews: UIPreviewType[] = [];
      const numToGenerate = (uiStates[type].options as any).numToGenerate || 1;
      
      if (hyperMode && numToGenerate > 1) {
        const promises: Promise<UIPreviewType[]>[] = Array(numToGenerate).fill(null).map(() => {
            const startIndex = getNextKeyStartIndex();
            
            switch (type) {
                case 'welcomeScreen':
                    return generateWelcomeScreenPreviews(apiKey, options.theme, { ...uiStates.welcomeScreen.options, numToGenerate: 1 }, startIndex);
                case 'characterCreator':
                    return generateCreatorPreviews(apiKey, options.theme, uiStates.characterCreator.options.description, 1, startIndex);
                case 'dynamicStatusUI':
                    return generateStatusPanelPreviews(apiKey, options.theme, uiStates.dynamicStatusUI.options.description, 1, startIndex);
            }
        });
        const results = await Promise.all(promises);
        previews = results.flat();
      } else {
        switch (type) {
            case 'welcomeScreen':
              previews = await generateWelcomeScreenPreviews(apiKey, options.theme, uiStates.welcomeScreen.options);
              break;
            case 'characterCreator':
              previews = await generateCreatorPreviews(apiKey, options.theme, uiStates.characterCreator.options.description, numToGenerate);
              break;
            case 'dynamicStatusUI':
              previews = await generateStatusPanelPreviews(apiKey, options.theme, uiStates.dynamicStatusUI.options.description, numToGenerate);
              break;
        }
      }

      setUiStates[type](prev => ({...prev, previews}));
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Tạo giao diện mẫu thất bại. Vui lòng thử lại.';
      setUiStates[type](prev => ({...prev, error: errorMessage}));
    } finally {
      setUiStates[type](prev => ({...prev, isLoading: false}));
    }
  }, [options.theme, hyperMode, uiStates, apiKey, getNextKeyStartIndex]);

  const handleSelectPreview = (type: keyof typeof uiStates, index: number) => {
    setUiStates[type](prev => ({...prev, selectedIndex: index}));
  };

  const handleStartEdit = (type: keyof typeof uiStates, index: number) => {
    setUiStates[type](prev => ({...prev, editingIndex: prev.editingIndex === index ? null : index, editRequest: ''}));
  };
  
  const handlePerformEdit = useCallback(async (type: keyof typeof uiStates) => {
      if (!apiKey) {
        setError('Vui lòng nhập API Key của bạn trong phần Cài đặt.');
        return;
      }
      const state = uiStates[type];
      const setState = setUiStates[type];
      
      if (state.editingIndex === null || !state.editRequest) return;
      
      setState(prev => ({...prev, isLoading: true, error: ''}));
      try {
          const currentCode = state.previews[state.editingIndex].code;
          const updatedCode = await editUIPreview(apiKey, currentCode, state.editRequest);
          
          setState(prev => {
              const newPreviews = [...prev.previews];
              newPreviews[prev.editingIndex!] = { ...newPreviews[prev.editingIndex!], code: updatedCode };
              return { ...prev, previews: newPreviews, editingIndex: null, editRequest: '' };
          });

      } catch (e) {
          console.error(e);
          setState(prev => ({...prev, error: 'Chỉnh sửa giao diện thất bại. Vui lòng thử lại.'}));
      } finally {
          setState(prev => ({...prev, isLoading: false}));
      }
  }, [uiStates, apiKey]);


  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('Vui lòng nhập API Key của bạn trong phần Cài đặt.');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedJson('');
    setCardObject(null);
    try {
      const selectedFeatures = Object.entries(features)
        .filter(([, isSelected]) => isSelected)
        .map(([key]) => key as Feature);
      
      const fullOptions: CardOptions = {
        ...options,
        welcomeScreenCode: (features.welcomeScreen && welcomeUI.selectedIndex !== null) ? welcomeUI.previews[welcomeUI.selectedIndex].code : null,
        creatorCode: (features.characterCreator && creatorUI.selectedIndex !== null) ? creatorUI.previews[creatorUI.selectedIndex].code : null,
        statusPanelCode: (features.dynamicStatusUI && statusPanelUI.selectedIndex !== null) ? statusPanelUI.previews[statusPanelUI.selectedIndex].code : null,
        importedLorebook,
      };

      const result = await generateSillyTavernCard(apiKey, fullOptions, selectedFeatures, knowledgeLibrary);
      setCardObject(result as SillyTavernCard);
      setGeneratedJson(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Tạo thẻ thất bại. Kiểm tra console để biết thêm chi tiết.');
    } finally {
      setIsLoading(false);
    }
  }, [options, features, welcomeUI, creatorUI, statusPanelUI, knowledgeLibrary, apiKey, importedLorebook]);
  
  const handleCardUpdate = (updatedCard: SillyTavernCard) => {
    setCardObject(updatedCard);
    setGeneratedJson(JSON.stringify(updatedCard, null, 2));
  };
  
  const isGenerateDisabled = !options.name || !options.theme || !apiKey || isLoading || isAnalyzing || welcomeUI.isLoading || creatorUI.isLoading || statusPanelUI.isLoading;

  const renderUIWorkshop = (type: keyof typeof uiStates, title: string) => {
    const state = uiStates[type];
    const setState = setUiStates[type];
    const description = (state.options as any).description;
    
    return (
      <div className="mt-6 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
        <h3 className="text-lg font-bold text-purple-200 mb-3">{title}</h3>
        {type === 'welcomeScreen' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
             <div><label className="text-sm">Giọng văn</label><select value={welcomeUI.options.tone} onChange={e => handleUIOptionChange(type, 'tone', e.target.value)} className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"><option value="epic">Sử thi</option><option value="mysterious">Bí ẩn</option><option value="friendly">Thân thiện</option><option value="minimalist">Tối giản</option></select></div>
             <div><label className="text-sm">Độ dài</label><select value={welcomeUI.options.length} onChange={e => handleUIOptionChange(type, 'length', e.target.value)} className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg"><option value="short">Ngắn</option><option value="medium">Vừa</option><option value="long">Dài</option></select></div>
             <div><label className="text-sm">Hiệu ứng</label><div className="mt-2"><Checkbox id="effects" label="Động" checked={welcomeUI.options.effects} onChange={() => handleUIOptionChange(type, 'effects', !welcomeUI.options.effects)} tooltip="Thêm hiệu ứng CSS động."/></div></div>
             <div><label className="text-sm">Số lượng</label><input type="number" value={welcomeUI.options.numToGenerate} onChange={e => handleUIOptionChange(type, 'numToGenerate', parseInt(e.target.value, 10) || 1)} min="1" max="8" className="w-full mt-1 p-2 bg-gray-800/80 border border-gray-600 rounded-lg" /></div>
          </div>
        ) : (
          <textarea value={description} onChange={e => handleUIOptionChange(type, 'description', e.target.value)} rows={3} className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg" placeholder={type === 'characterCreator' ? 'ví dụ: Giao diện cho phép chọn tên, tuổi và phe phái.' : 'ví dụ: Giao diện dạng tab, tab 1 là chỉ số, tab 2 là trang bị.'}></textarea>
        )}
        <div className="flex items-end gap-4 mt-2">
            <Button onClick={() => handleGeneratePreviews(type)} disabled={state.isLoading || !options.theme || !apiKey || (type !== 'welcomeScreen' && !description)} className="w-full py-2">
                {state.isLoading ? <><Spinner /> Đang thiết kế...</> : 'Tạo Giao diện Mẫu'}
            </Button>
            {type !== 'welcomeScreen' && (
                 <div className="flex-shrink-0">
                    <label htmlFor={`${type}-numToGenerate`} className="block text-sm font-medium text-gray-300 mb-1">Số lượng</label>
                    <input id={`${type}-numToGenerate`} type="number" value={(state.options as any).numToGenerate} onChange={e => handleUIOptionChange(type, 'numToGenerate', parseInt(e.target.value) || 1)} min="1" max="8" className="w-20 p-2 bg-gray-800/80 border border-gray-600 rounded-lg text-center" />
                </div>
            )}
        </div>
        
        {state.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
        
        {state.previews.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-bold text-purple-200 mb-3">Chọn một Giao diện</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.previews.map((preview, index) => (
                <div key={index}>
                  <UIPreview name={preview.name} htmlCode={preview.code} isSelected={state.selectedIndex === index} onSelect={() => handleSelectPreview(type, index)} onEdit={() => handleStartEdit(type, index)} />
                   {state.editingIndex === index && (
                      <div className="mt-2 p-3 bg-gray-900/50 border border-purple-500 rounded-lg animate-fadeIn">
                        <textarea value={state.editRequest} onChange={e => setState(prev => ({...prev, editRequest: e.target.value}))} rows={2} className="w-full p-2 bg-gray-700 rounded-md" placeholder="Yêu cầu chỉnh sửa (vd: đổi màu thành xanh)..."></textarea>
                        <Button onClick={() => handlePerformEdit(type)} disabled={state.isLoading || !apiKey} className="w-full text-sm py-1 mt-2">
                          {state.isLoading ? <Spinner /> : "Cập nhật Giao diện"}
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
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Trình tạo Thẻ SillyTavern
            </h1>
            <p className="mt-2 text-lg text-gray-400">Tạo thẻ nhân vật nâng cao, giàu tính năng với sức mạnh của AI.</p>
          </div>
          <Button onClick={() => setIsLibraryOpen(true)} className="mt-4 sm:mt-0 py-2 px-4 text-base">Thư viện Kiến thức</Button>
        </header>

        <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold font-display text-purple-300 mb-3">Cài đặt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <TextInput
                    isTextArea={true}
                    label="API Key Gemini (cách nhau bởi dấu , hoặc xuống dòng)"
                    name="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Dán một hoặc nhiều API Key vào đây..."
                />
                <Checkbox
                    id="hyperMode"
                    label="Hyper Mode (Tăng tốc)"
                    checked={hyperMode}
                    onChange={() => setHyperMode(!hyperMode)}
                    tooltip="Thực hiện nhiều lệnh gọi API song song để tạo nhiều giao diện nhanh hơn. Có thể tốn nhiều chi phí hơn."
                />
            </div>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <div>
              <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">1. Ý tưởng Cốt lõi</h2>
              <div className="space-y-4">
                <TextInput label="Tên Thẻ/Nhân vật" name="name" value={options.name} onChange={handleOptionChange} placeholder="ví dụ: Thám tử Chronos" required />
                <TextInput label="Chủ đề & Từ khóa" name="theme" value={options.theme} onChange={handleOptionChange} placeholder="ví dụ: Cyberpunk, Noir, Du hành thời gian" required />
                <TextInput isTextArea={true} label="Ý tưởng Tin nhắn Đầu tiên" name="firstMessageIdea" value={options.firstMessageIdea} onChange={handleOptionChange} placeholder="ví dụ: Tỉnh dậy trong một con hẻm mưa với chứng mất trí nhớ..." />
                {knowledgeLibrary.length > 0 && (
                  <div>
                    <label htmlFor="referenceCardId" className="block text-sm font-medium text-gray-300 mb-1">File tham khảo (Tùy chọn)</label>
                    <select id="referenceCardId" name="referenceCardId" value={options.referenceCardId} onChange={handleOptionChange} className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg">
                      <option value="">Học hỏi từ toàn bộ thư viện</option>
                      {knowledgeLibrary.map(file => (<option key={file.id} value={file.id}>{file.name}</option>))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2">Chọn file để AI mô phỏng phong cách giao diện. Nếu không, AI sẽ lấy cảm hứng từ tất cả.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">2. Tính năng & Nội dung</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Checkbox id="welcomeScreen" label="Màn hình Chào mừng" checked={features.welcomeScreen} onChange={() => handleFeatureChange('welcomeScreen')} tooltip="Tạo một màn hình giới thiệu đẹp mắt cho tin nhắn đầu tiên." />
                <Checkbox id="characterCreator" label="Trình tạo Nhân vật" checked={features.characterCreator} onChange={() => handleFeatureChange('characterCreator')} tooltip="Thêm một biểu mẫu HTML để người dùng tùy chỉnh nhân vật khi bắt đầu." />
                <Checkbox id="dynamicStatusUI" label="Bảng Trạng thái Động" checked={features.dynamicStatusUI} onChange={() => handleFeatureChange('dynamicStatusUI')} tooltip="Tạo một bảng trạng thái HTML/CSS/JS để hiển thị các biến số một cách trực quan." />
                <Checkbox id="progressionSystem" label="Hệ thống Tiến trình" checked={features.progressionSystem} onChange={() => handleFeatureChange('progressionSystem')} tooltip="Bao gồm hệ thống biến (MVU) để theo dõi các chỉ số như Cấp độ, Máu, Kinh nghiệm." />
                <Checkbox id="relationshipSystem" label="Hệ thống Mối quan hệ" checked={features.relationshipSystem} onChange={() => handleFeatureChange('relationshipSystem')} tooltip="Thêm các biến để theo dõi mức độ thiện cảm và suy nghĩ nội tâm của NPC." />
                <Checkbox id="lorebook" label="Sổ tay Thế giới" checked={features.lorebook} onChange={() => handleFeatureChange('lorebook')} tooltip="Tạo các mục worldbook chi tiết về bối cảnh, quy tắc và nhân vật phụ." />
              </div>
              
              {features.lorebook && (
                 <div className="mt-6 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Spinner />
                      <p className="mt-2 text-gray-300">Đang phân tích Sổ tay Thế giới...</p>
                    </div>
                  ) : importedLorebook ? (
                    <div className="animate-fadeIn text-center">
                      <h4 className="font-bold text-green-400">Đã nhập Sổ tay Thế giới</h4>
                      <p className="text-sm text-gray-300 mt-1">Đã tải thành công {importedLorebook.length} mục. Tên thẻ, chủ đề và ý tưởng đã được tự động đề xuất.</p>
                      <button onClick={handleClearImportedLorebook} className="mt-3 text-xs bg-red-600/50 hover:bg-red-500/50 text-white py-1 px-3 rounded-md">Xóa & Tạo thủ công</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-end gap-4">
                          <div>
                              <label htmlFor="lorebookEntries" className="block text-sm font-medium text-gray-300 mb-1">Số mục Lore (Tự động)</label>
                              <input type="number" id="lorebookEntries" name="lorebookEntries" value={options.lorebookEntries} onChange={handleOptionChange} min="1" max="50" className="w-24 p-2 bg-gray-800/80 border border-gray-600 rounded-lg" />
                          </div>
                          <button type="button" onClick={handleAddCustomLoreRequest} className="py-2 px-3 bg-purple-600/50 hover:bg-purple-500/50 text-white rounded-md text-sm" title="Thêm yêu cầu lore tùy chỉnh">Thêm Yêu cầu</button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">AI sẽ ưu tiên tạo các lore cốt lõi (hướng dẫn) trước, sau đó mới đến lore thế giới.</p>
                      <div className="mt-4 space-y-2">
                          {options.customLoreRequests?.map((request, index) => (
                              <div key={index} className="flex items-center gap-2 animate-fadeIn">
                                  <input type="text" value={request} onChange={(e) => handleCustomLoreRequestChange(index, e.target.value)} placeholder={`Yêu cầu tùy chỉnh #${index + 1}`} className="flex-grow p-2 bg-gray-800/80 border border-gray-600 rounded-lg" />
                                  <button onClick={() => handleRemoveCustomLoreRequest(index)} className="text-xs bg-red-600/50 hover:bg-red-500/50 text-white py-1 px-2 rounded-md">Xóa</button>
                              </div>
                          ))}
                      </div>
                      <div className="border-t border-gray-600 my-4"></div>
                      <div>
                          <input type="file" accept=".json" ref={lorebookInputRef} onChange={handleLorebookFileChange} className="hidden" />
                          <button type="button" onClick={() => lorebookInputRef.current?.click()} disabled={!apiKey} className="w-full text-center py-2 px-3 bg-blue-600/50 hover:bg-blue-500/50 text-white rounded-md text-sm disabled:bg-gray-600 disabled:cursor-not-allowed">
                              ...hoặc Nhập Sổ tay từ File (.json)
                          </button>
                          <p className="text-xs text-gray-400 mt-2 text-center">AI sẽ tự động điền các trường khác dựa trên nội dung tệp của bạn.</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-auto">
              <Button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full">
                {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo Thẻ'}
              </Button>
              {!apiKey && <p className="text-center text-xs text-yellow-400 mt-2">Vui lòng nhập API Key trong Cài đặt để bắt đầu.</p>}
              {error && <p className="mt-3 text-sm text-red-400 text-center">{error}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-bold font-display text-purple-300 mb-4 border-b-2 border-purple-500/30 pb-2">3. Xưởng Thiết kế Giao diện</h2>
              {!features.welcomeScreen && !features.characterCreator && !features.dynamicStatusUI && (
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 text-gray-500 text-center">Bật một tính năng giao diện ở bên trái để bắt đầu thiết kế.</div>
              )}
              {features.welcomeScreen && renderUIWorkshop('welcomeScreen', 'Xưởng Chào mừng')}
              {features.characterCreator && renderUIWorkshop('characterCreator', 'Xưởng Tạo Nhân vật')}
              {features.dynamicStatusUI && renderUIWorkshop('dynamicStatusUI', 'Xưởng Bảng Trạng thái')}
            </div>

            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-display text-purple-300 border-b-2 border-purple-500/30 pb-2">4. Kết quả JSON</h2>
                {cardObject && (<Button onClick={() => setIsEnhancementModalOpen(true)} className="py-2 text-sm">Bổ sung / Sửa lỗi</Button>)}
              </div>

              <div className="flex-grow min-h-[40vh] lg:h-auto">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700">
                    <Spinner /><p className="mt-4 text-gray-300">Đang tạo thẻ của bạn...</p>
                  </div>
                ) : generatedJson ? (
                  <CodeDisplay jsonString={generatedJson} fileName={options.name} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" /></svg>
                    <p>JSON thẻ được tạo của bạn sẽ xuất hiện ở đây.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {isEnhancementModalOpen && cardObject && <EnhancementModal isOpen={isEnhancementModalOpen} onClose={() => setIsEnhancementModalOpen(false)} card={cardObject} onCardUpdate={handleCardUpdate} apiKey={apiKey} knowledgeLibrary={knowledgeLibrary} />}
      <KnowledgeLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} knowledgeLibrary={knowledgeLibrary} onAddFiles={addFilesToLibrary} onRemoveFile={removeFileFromLibrary} />
    </div>
  );
};

export default App;