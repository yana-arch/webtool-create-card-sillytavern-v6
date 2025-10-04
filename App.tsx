import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "./components/Button";
import { CodeDisplay } from "./components/CodeDisplay";
import { EnhancementModal } from "./components/EnhancementModal";
import { FeaturesPanel } from "./components/FeaturesPanel";
import { IdeaForm } from "./components/IdeaForm";
import { SettingsPanel } from "./components/SettingsPanel";
import { Spinner } from "./components/Spinner";
import { UIWorkshop } from "./components/UIWorkshop";
import { useKnowledgeLibrary } from "./hooks/useKnowledgeLibrary";
import {
  analyzeLorebookForSuggestions,
  editUIPreview,
  generateCreatorPreviews,
  generateSillyTavernCard,
  generateStatusPanelPreviews,
  generateWelcomeScreenPreviews,
} from "./services/geminiService";
import type {
  CardOptions,
  Feature,
  LorebookEntry,
  SillyTavernCard,
  UIPreview as UIPreviewType,
} from "./types";

// Lazy load modal components for better performance
const GuideModal = React.lazy(() =>
  import("./components/GuideModal").then((module) => ({
    default: module.GuideModal,
  })),
);

const KnowledgeLibraryModal = React.lazy(() =>
  import("./components/KnowledgeLibraryModal").then((module) => ({
    default: module.KnowledgeLibraryModal,
  })),
);

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem("geminiApiKey") || "",
  );
  const [hyperMode, setHyperMode] = useState<boolean>(
    () => localStorage.getItem("hyperMode") === "true",
  );

  useEffect(() => {
    localStorage.setItem("geminiApiKey", apiKey);
  }, [apiKey]);
  useEffect(() => {
    localStorage.setItem("hyperMode", String(hyperMode));
  }, [hyperMode]);

  const apiKeyIndex = useRef(0);
  const getNextKeyStartIndex = useCallback((): number => {
    const keys = apiKey
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length === 0) return 0;
    const index = apiKeyIndex.current;
    apiKeyIndex.current = (apiKeyIndex.current + 1) % keys.length;
    return index;
  }, [apiKey]);

  const [options, setOptions] = useState<
    Omit<CardOptions, "welcomeScreenCode" | "creatorCode" | "statusPanelCode">
  >({
    name: "",
    theme: "",
    firstMessageIdea: "",
    template: "default",
    lorebookEntries: 5,
    customLoreRequests: [],
    referenceCardId: "",
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

  const [generatedJson, setGeneratedJson] = useState<string>("");
  const [cardObject, setCardObject] = useState<SillyTavernCard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [importedLorebook, setImportedLorebook] = useState<
    LorebookEntry[] | null
  >(null);
  const lorebookInputRef = useRef<HTMLInputElement>(null);

  const [isEnhancementModalOpen, setIsEnhancementModalOpen] =
    useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"config" | "result">("config");

  const { knowledgeLibrary, addFilesToLibrary, removeFileFromLibrary } =
    useKnowledgeLibrary();

  // State for UI Workshops
  const [welcomeUI, setWelcomeUI] = useState({
    isLoading: false,
    error: "",
    previews: [] as UIPreviewType[],
    selectedIndex: null as number | null,
    options: {
      tone: "epic" as "epic" | "mysterious" | "friendly" | "minimalist",
      length: "medium" as "short" | "medium" | "long",
      effects: true,
      numToGenerate: 2,
    },
    editingIndex: null as number | null,
    editRequest: "",
  });
  const [creatorUI, setCreatorUI] = useState({
    isLoading: false,
    error: "",
    previews: [] as UIPreviewType[],
    selectedIndex: null as number | null,
    options: { description: "", numToGenerate: 2 },
    editingIndex: null as number | null,
    editRequest: "",
  });
  const [statusPanelUI, setStatusPanelUI] = useState({
    isLoading: false,
    error: "",
    previews: [] as UIPreviewType[],
    selectedIndex: null as number | null,
    options: { description: "", numToGenerate: 2 },
    editingIndex: null as number | null,
    editRequest: "",
  });

  const uiStates = {
    welcomeScreen: welcomeUI,
    characterCreator: creatorUI,
    dynamicStatusUI: statusPanelUI,
  };
  const setUiStates = {
    welcomeScreen: setWelcomeUI,
    characterCreator: setCreatorUI,
    dynamicStatusUI: setStatusPanelUI,
  };

  const handleOptionChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: name === "lorebookEntries" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleFeatureChange = (feature: Feature) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleAddCustomLoreRequest = () =>
    setOptions((prev) => ({
      ...prev,
      customLoreRequests: [...(prev.customLoreRequests || []), ""],
    }));
  const handleCustomLoreRequestChange = (index: number, value: string) =>
    setOptions((prev) => {
      const reqs = [...(prev.customLoreRequests || [])];
      reqs[index] = value;
      return { ...prev, customLoreRequests: reqs };
    });
  const handleRemoveCustomLoreRequest = (index: number) =>
    setOptions((prev) => ({
      ...prev,
      customLoreRequests: (prev.customLoreRequests || []).filter(
        (_, i) => i !== index,
      ),
    }));

  const handleUIOptionChange = (
    type: keyof typeof uiStates,
    field: string,
    value: any,
  ) => {
    setUiStates[type]((prev) => ({
      ...prev,
      options: { ...prev.options, [field]: value },
    }));
  };

  const handleUIEditRequestChange = (
    type: keyof typeof uiStates,
    value: string,
  ) => {
    setUiStates[type]((prev) => ({ ...prev, editRequest: value }));
  };

  const findLorebookEntries = (parsedJson: any): LorebookEntry[] | null => {
    if (Array.isArray(parsedJson)) {
      if (
        parsedJson.length > 0 &&
        parsedJson[0].keys &&
        parsedJson[0].content
      ) {
        return parsedJson as LorebookEntry[];
      }
    }
    if (typeof parsedJson === "object" && parsedJson !== null) {
      if (parsedJson.data?.character_book?.entries)
        return parsedJson.data.character_book.entries;
      if (parsedJson.character_book?.entries)
        return parsedJson.character_book.entries;
      if (parsedJson.entries && Array.isArray(parsedJson.entries))
        return parsedJson.entries;
    }
    return null;
  };

  const handleLorebookFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !apiKey) {
      if (!apiKey) setError("Vui lòng nhập API Key trước khi nhập Sổ tay.");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const entries = findLorebookEntries(parsed);

      if (!entries || entries.length === 0) {
        throw new Error(
          "Không tìm thấy dữ liệu Sổ tay Thế giới hợp lệ trong tệp JSON.",
        );
      }

      const suggestions = await analyzeLorebookForSuggestions(
        apiKey,
        JSON.stringify(entries),
      );

      setOptions((prev) => ({
        ...prev,
        name: suggestions.name,
        theme: suggestions.theme,
        firstMessageIdea: suggestions.firstMessageIdea,
      }));
      setImportedLorebook(entries);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "Đã xảy ra lỗi khi xử lý tệp Sổ tay Thế giới.",
      );
    } finally {
      setIsAnalyzing(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleClearImportedLorebook = () => {
    setImportedLorebook(null);
  };

  const handleGeneratePreviews = useCallback(
    async (type: keyof typeof uiStates) => {
      if (!apiKey) {
        setError("Vui lòng nhập API Key của bạn trong phần Cài đặt.");
        return;
      }
      if (!options.theme) {
        setUiStates[type]((prev) => ({
          ...prev,
          error: 'Vui lòng nhập "Chủ đề & Từ khóa" trước.',
        }));
        return;
      }
      setUiStates[type]((prev) => ({
        ...prev,
        isLoading: true,
        error: "",
        previews: [],
        selectedIndex: null,
      }));

      try {
        let previews: UIPreviewType[] = [];
        const numToGenerate =
          (uiStates[type].options as any).numToGenerate || 1;

        if (hyperMode && numToGenerate > 1) {
          const promises: Promise<UIPreviewType[]>[] = Array(numToGenerate)
            .fill(null)
            .map(() => {
              const startIndex = getNextKeyStartIndex();

              switch (type) {
                case "welcomeScreen":
                  return generateWelcomeScreenPreviews(
                    apiKey,
                    options.theme,
                    { ...uiStates.welcomeScreen.options, numToGenerate: 1 },
                    startIndex,
                  );
                case "characterCreator":
                  return generateCreatorPreviews(
                    apiKey,
                    options.theme,
                    uiStates.characterCreator.options.description,
                    1,
                    startIndex,
                  );
                case "dynamicStatusUI":
                  return generateStatusPanelPreviews(
                    apiKey,
                    options.theme,
                    uiStates.dynamicStatusUI.options.description,
                    1,
                    startIndex,
                  );
              }
            });
          const results = await Promise.all(promises);
          previews = results.flat();
        } else {
          switch (type) {
            case "welcomeScreen":
              previews = await generateWelcomeScreenPreviews(
                apiKey,
                options.theme,
                uiStates.welcomeScreen.options,
              );
              break;
            case "characterCreator":
              previews = await generateCreatorPreviews(
                apiKey,
                options.theme,
                uiStates.characterCreator.options.description,
                numToGenerate,
              );
              break;
            case "dynamicStatusUI":
              previews = await generateStatusPanelPreviews(
                apiKey,
                options.theme,
                uiStates.dynamicStatusUI.options.description,
                numToGenerate,
              );
              break;
          }
        }

        setUiStates[type]((prev) => ({ ...prev, previews }));
      } catch (e) {
        console.error(e);
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Tạo giao diện mẫu thất bại. Vui lòng thử lại.";
        setUiStates[type]((prev) => ({ ...prev, error: errorMessage }));
      } finally {
        setUiStates[type]((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [options.theme, hyperMode, uiStates, apiKey, getNextKeyStartIndex],
  );

  const handleSelectPreview = (type: keyof typeof uiStates, index: number) => {
    setUiStates[type]((prev) => ({ ...prev, selectedIndex: index }));
  };

  const handleStartEdit = (type: keyof typeof uiStates, index: number) => {
    setUiStates[type]((prev) => ({
      ...prev,
      editingIndex: prev.editingIndex === index ? null : index,
      editRequest: "",
    }));
  };

  const handlePerformEdit = useCallback(
    async (type: keyof typeof uiStates) => {
      if (!apiKey) {
        setError("Vui lòng nhập API Key của bạn trong phần Cài đặt.");
        return;
      }
      const state = uiStates[type];
      const setState = setUiStates[type];

      if (state.editingIndex === null || !state.editRequest) return;

      setState((prev) => ({ ...prev, isLoading: true, error: "" }));
      try {
        const currentCode = state.previews[state.editingIndex].code;
        const updatedCode = await editUIPreview(
          apiKey,
          currentCode,
          state.editRequest,
        );

        setState((prev) => {
          const newPreviews = [...prev.previews];
          newPreviews[prev.editingIndex!] = {
            ...newPreviews[prev.editingIndex!],
            code: updatedCode,
          };
          return {
            ...prev,
            previews: newPreviews,
            editingIndex: null,
            editRequest: "",
          };
        });
      } catch (e) {
        console.error(e);
        setState((prev) => ({
          ...prev,
          error: "Chỉnh sửa giao diện thất bại. Vui lòng thử lại.",
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [uiStates, apiKey],
  );

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key của bạn trong phần Cài đặt.");
      return;
    }
    setIsLoading(true);
    setError("");
    setGeneratedJson("");
    setCardObject(null);
    try {
      const selectedFeatures = Object.entries(features)
        .filter(([, isSelected]) => isSelected)
        .map(([key]) => key as Feature);

      const fullOptions: CardOptions = {
        ...options,
        welcomeScreenCode:
          features.welcomeScreen && welcomeUI.selectedIndex !== null
            ? welcomeUI.previews[welcomeUI.selectedIndex].code
            : null,
        creatorCode:
          features.characterCreator && creatorUI.selectedIndex !== null
            ? creatorUI.previews[creatorUI.selectedIndex].code
            : null,
        statusPanelCode:
          features.dynamicStatusUI && statusPanelUI.selectedIndex !== null
            ? statusPanelUI.previews[statusPanelUI.selectedIndex].code
            : null,
        importedLorebook,
      };

      const result = await generateSillyTavernCard(
        apiKey,
        fullOptions,
        selectedFeatures,
        knowledgeLibrary,
      );
      setCardObject(result as SillyTavernCard);
      setGeneratedJson(JSON.stringify(result, null, 2));
      setActiveTab("result");
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "Tạo thẻ thất bại. Kiểm tra console để biết thêm chi tiết.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    options,
    features,
    welcomeUI,
    creatorUI,
    statusPanelUI,
    knowledgeLibrary,
    apiKey,
    importedLorebook,
  ]);

  const handleCardUpdate = (updatedCard: SillyTavernCard) => {
    setCardObject(updatedCard);
    setGeneratedJson(JSON.stringify(updatedCard, null, 2));
  };

  const isGenerateDisabled =
    !options.name ||
    !options.theme ||
    !apiKey ||
    isLoading ||
    isAnalyzing ||
    welcomeUI.isLoading ||
    creatorUI.isLoading ||
    statusPanelUI.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-700">
              Trình tạo Thẻ SillyTavern
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Tạo thẻ nhân vật nâng cao, giàu tính năng với sức mạnh của AI.
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              onClick={() => setIsGuideOpen(true)}
              className="py-2 px-4 text-base"
            >
              Hướng dẫn
            </Button>
            <Button
              onClick={() => setIsLibraryOpen(true)}
              className="py-2 px-4 text-base"
            >
              Thư viện Kiến thức
            </Button>
          </div>
        </header>

        <SettingsPanel
          apiKey={apiKey}
          onApiKeyChange={(e) => setApiKey(e.target.value)}
          hyperMode={hyperMode}
          onHyperModeChange={setHyperMode}
        />

        <main className="flex flex-col">
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition-colors ${
                activeTab === "config"
                  ? "border-b-2 border-blue-500 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              title="Nhập ý tưởng, chọn tính năng và thiết kế giao diện"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Cấu hình
            </button>
            <button
              onClick={() => setActiveTab("result")}
              className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition-colors ${
                activeTab === "result"
                  ? "border-b-2 border-green-500 text-green-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              disabled={!generatedJson && !isLoading}
              title="Xem và tải xuống thẻ JSON đã tạo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Kết quả
            </button>
          </div>

          {activeTab === "config" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl">
                <IdeaForm
                  options={options}
                  onOptionChange={handleOptionChange}
                  knowledgeLibrary={knowledgeLibrary}
                />

                <FeaturesPanel
                  features={features}
                  onFeatureChange={handleFeatureChange}
                  options={options}
                  onOptionChange={handleOptionChange}
                  onAddCustomLoreRequest={handleAddCustomLoreRequest}
                  onCustomLoreRequestChange={handleCustomLoreRequestChange}
                  onRemoveCustomLoreRequest={handleRemoveCustomLoreRequest}
                  importedLorebook={importedLorebook}
                  isAnalyzing={isAnalyzing}
                  onLorebookFileChange={handleLorebookFileChange}
                  onClearImportedLorebook={handleClearImportedLorebook}
                />

                <div className="mt-auto">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Spinner /> Đang tạo...
                      </>
                    ) : (
                      "Tạo Thẻ"
                    )}
                  </Button>
                  {!apiKey && (
                    <p className="text-center text-xs text-yellow-400 mt-2">
                      Vui lòng nhập API Key trong Cài đặt để bắt đầu.
                    </p>
                  )}
                  {error && (
                    <p className="mt-3 text-sm text-red-400 text-center">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl">
                <UIWorkshop
                  features={features}
                  welcomeUI={welcomeUI}
                  creatorUI={creatorUI}
                  statusPanelUI={statusPanelUI}
                  theme={options.theme}
                  onGeneratePreviews={handleGeneratePreviews}
                  onSelectPreview={handleSelectPreview}
                  onStartEdit={handleStartEdit}
                  onPerformEdit={handlePerformEdit}
                  onUIOptionChange={handleUIOptionChange}
                  onUIEditRequestChange={handleUIEditRequestChange}
                  apiKey={apiKey}
                />
              </div>
            </div>
          )}

          {activeTab === "result" && (
            <div className="flex flex-col gap-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl">
              <div className="flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold font-display text-green-300 border-b-2 border-green-500/30 pb-2">
                    Kết quả JSON
                    <span title="Xem, tải về và chỉnh sửa thẻ JSON đã tạo">
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
                  {cardObject && (
                    <Button
                      onClick={() => setIsEnhancementModalOpen(true)}
                      className="py-2 text-sm"
                    >
                      Bổ sung / Sửa lỗi
                    </Button>
                  )}
                </div>

                <div className="flex-grow min-h-[50vh]">
                  {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700">
                      <Spinner />
                      <p className="mt-4 text-gray-300">
                        Đang tạo thẻ của bạn...
                      </p>
                    </div>
                  ) : generatedJson ? (
                    <CodeDisplay
                      jsonString={generatedJson}
                      fileName={options.name}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3"
                        />
                      </svg>
                      <p>Vui lòng tạo thẻ từ tab Cấu hình trước.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {isEnhancementModalOpen && cardObject && (
        <EnhancementModal
          isOpen={isEnhancementModalOpen}
          onClose={() => setIsEnhancementModalOpen(false)}
          card={cardObject}
          onCardUpdate={handleCardUpdate}
          apiKey={apiKey}
          knowledgeLibrary={knowledgeLibrary}
        />
      )}

      {/* Lazy-loaded modals with Suspense */}
      <Suspense fallback={<div className="sr-only">Loading...</div>}>
        <KnowledgeLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          knowledgeLibrary={knowledgeLibrary}
          onAddFiles={addFilesToLibrary}
          onRemoveFile={removeFileFromLibrary}
        />
        <GuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default App;
