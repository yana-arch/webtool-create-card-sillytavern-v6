

import { GoogleGenAI, Type, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import type { CardOptions, Feature, UIPreview, SillyTavernCard, KnowledgeFile, LorebookEntry } from '../types';

/**
 * Executes a Gemini API call with automatic retry logic using multiple API keys.
 * If a key fails (e.g., quota exceeded), it automatically tries the next key.
 * @param apiKeysString A string containing API keys separated by commas or newlines.
 * @param request The parameters for the generateContent call.
 * @param startIndex The index of the key to start with, for load balancing.
 * @returns The successful response from the API.
 * @throws An error if all API keys fail.
 */
async function callGeminiWithRetry(apiKeysString: string, request: GenerateContentParameters, startIndex = 0): Promise<GenerateContentResponse> {
    if (!apiKeysString) {
        throw new Error("Vui lòng cung cấp API Key trong phần Cài đặt.");
    }
    const keys = apiKeysString.split(/[\n,]/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("Không tìm thấy API Key hợp lệ trong Cài đặt.");
    }

    const orderedKeys = [...keys.slice(startIndex), ...keys.slice(0, startIndex)];
    let lastError: Error | null = null;

    for (const key of orderedKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            const response = await ai.models.generateContent(request);
            return response; // Success!
        } catch (e) {
            lastError = e as Error;
            // Check for common, retryable API key-related errors.
            if (e instanceof Error && (e.message.includes('API key') || e.message.includes('quota') || e.message.includes('429'))) {
                console.warn(`API key ...${key.slice(-4)} thất bại. Đang thử key tiếp theo. Lỗi: ${e.message}`);
                continue; // Try the next key
            } else {
                // It's a different kind of error (e.g., bad request, server error), so we shouldn't retry.
                throw e;
            }
        }
    }

    // If the loop completes, all keys have failed.
    throw new Error(`Tất cả các API key đều thất bại. Lỗi cuối cùng: ${lastError?.message || 'Lỗi không xác định'}`);
}


const buildKnowledgePromptSection = (library: KnowledgeFile[], referenceId?: string, context: 'create' | 'fix' = 'create'): string => {
    if (library.length === 0) return '';
    let knowledgePrompt = `\n**THƯ VIỆN KIẾN THỨC (Nguồn tham khảo):**\n`;
    const referenceFile = referenceId ? library.find(f => f.id === referenceId) : null;
    
    if (referenceFile) {
        if (context === 'create') {
             knowledgePrompt += `**File Tham Khảo Cụ Thể Được Chọn: "${referenceFile.name}"**
- **YÊU CẦU ƯU TIÊN:** Người dùng muốn thẻ mới có **phong cách, cấu trúc và logic** rất giống với file tham khảo này.
- **NHIỆM VỤ CỦA BẠN:** Hãy phân tích sâu file tham khảo. Sao chép **PHONG CÁCH TRỰC QUAN** (HTML/CSS), **CẤU TRÚC DỮ LIỆU** (cách tổ chức regex, lorebook), và **LOGIC HOẠT ĐỘNG** (cách script xử lý dữ liệu). Tuy nhiên, phải **ĐIỀU CHỈNH NỘI DUNG VÀ CHỨC NĂNG** cho phù hợp với chủ đề của thẻ mới.
- **Nội dung file tham khảo:** \`\`\`json\n${referenceFile.content}\n\`\`\`
`;
        } else { // context === 'fix'
             knowledgePrompt += `**File Tham Khảo Để Sửa lỗi: "${referenceFile.name}"**
- **YÊU CẦU ƯU TIÊN:** Thẻ hiện tại đang bị lỗi. File tham khảo này là một ví dụ **ĐÚNG** về cách một thẻ nên được cấu trúc và hoạt động.
- **NHIỆM VỤ CỦA BẠN:** Hãy so sánh thẻ bị lỗi với file tham khảo này. Sử dụng cấu trúc và mã nguồn từ file tham khảo để **SỬA CHỮA** các phần tương ứng trong thẻ bị lỗi. Ví dụ, nếu bảng trạng thái bị hỏng, hãy xem cách bảng trạng thái được triển khai trong file tham khảo và áp dụng logic tương tự để sửa nó.
- **Nội dung file tham khảo:** \`\`\`json\n${referenceFile.content}\n\`\`\`
`;
        }
    } else {
        knowledgePrompt += `**Nguồn Cảm Hứng Chung:**
- Dưới đây là các thẻ mẫu từ thư viện của người dùng. Hãy sử dụng chúng như một nguồn **CẢM HỨNG** cho các giải pháp và cấu trúc tốt nhất.
- **KHÔNG SAO CHÉP Y HỆT.** Thay vào đó, hãy học hỏi các kỹ thuật, cấu trúc và ý tưởng để tạo ra một thẻ **MỚI** (hoặc sửa chữa thẻ hiện có) một cách độc đáo và chất lượng cao.
- **Danh sách file trong thư viện:**\n${library.map(f => `- ${f.name}`).join('\n')}
`;
    }
    return knowledgePrompt;
}

const generatePreviews = async (apiKeysString: string, prompt: string, count: number, startIndex = 0): Promise<UIPreview[]> => {
    const response = await callGeminiWithRetry(apiKeysString, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    uiPreviews: {
                        type: Type.ARRAY,
                        description: `Một mảng gồm chính xác ${count} đối tượng giao diện.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Tên sáng tạo cho mẫu giao diện." },
                                code: { type: Type.STRING, description: "Mã HTML, CSS, và JS hoàn chỉnh cho giao diện." }
                            },
                            required: ['name', 'code']
                        }
                    }
                },
                required: ['uiPreviews']
            }
        }
    }, startIndex);

    try {
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        return parsed.uiPreviews || [];
    } catch (e) {
        console.error("Lỗi phân tích JSON UI Previews:", response.text, e);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ.");
    }
};

export const generateWelcomeScreenPreviews = async (apiKey: string, theme: string, options: { tone: string; length: string; effects: boolean; numToGenerate: number }, startIndex = 0): Promise<UIPreview[]> => {
    const prompt = `Bạn là một nhà thiết kế UI/UX chuyên nghiệp. Tạo ra **${options.numToGenerate}** màn hình chào mừng HTML độc đáo cho một thẻ nhân vật.
**Chủ đề:** "${theme}"
**Yêu cầu:**
- **QUAN TRỌNG VỀ CHẤT LƯỢNG MÃ:** Toàn bộ mã HTML phải hợp lệ. Mọi thẻ phải được đóng đúng cách. Lỗi cú pháp sẽ làm giao diện không hiển thị.
- **Giọng văn:** ${options.tone}
- **Độ dài nội dung:** ${options.length}
- **Hiệu ứng động:** ${options.effects ? 'Có, sử dụng CSS animations.' : 'Không, giữ tĩnh.'}
- Mỗi mẫu phải là một đoạn mã HTML hoàn chỉnh, bao gồm thẻ \`<style>\`. KHÔNG bao gồm \`<html>\` hoặc \`<body>\`.
- Đặt tên sáng tạo cho mỗi mẫu.
- Trả về kết quả dưới dạng JSON theo schema.`;
    return generatePreviews(apiKey, prompt, options.numToGenerate, startIndex);
};

export const generateCreatorPreviews = async (apiKey: string, theme: string, description: string, count: number, startIndex = 0): Promise<UIPreview[]> => {
    const prompt = `Bạn là một kỹ sư frontend. Tạo ra **${count}** biểu mẫu HTML tạo nhân vật độc đáo.
**Chủ đề:** "${theme}"
**Mô tả của người dùng:** "${description}"
**Yêu cầu:**
- **QUAN TRỌNG VỀ CHẤT LƯỢNG MÃ:** Toàn bộ mã HTML phải hợp lệ. Mọi thẻ phải được đóng đúng cách (ví dụ: \`<option>...\` phải có \`</option>\`). Lỗi cú pháp sẽ làm giao diện không hiển thị.
- Mỗi mẫu phải là một biểu mẫu HTML hoàn chỉnh với các trường nhập liệu, bao gồm thẻ \`<style>\` và \`<script>\`.
- Script phải thu thập dữ liệu từ biểu mẫu và tạo một chuỗi văn bản để gửi cho AI (ví dụ: qua hàm \`triggerSlash(\`/send ...\`)\`).
- KHÔNG bao gồm \`<html>\` hoặc \`<body>\`.
- Đặt tên sáng tạo cho mỗi mẫu.
- Trả về kết quả dưới dạng JSON theo schema.`;
    return generatePreviews(apiKey, prompt, count, startIndex);
};

export const generateStatusPanelPreviews = async (apiKey: string, theme: string, description: string, count: number, startIndex = 0): Promise<UIPreview[]> => {
    const prompt = `Bạn là một kỹ sư frontend. Tạo ra **${count}** bảng trạng thái HTML độc đáo.
**Chủ đề:** "${theme}"
**Mô tả bố cục của người dùng:** "${description}"
**Yêu cầu:**
- **QUAN TRỌNG VỀ CHẤT LƯỢNG MÃ:** Toàn bộ mã HTML phải hợp lệ. Mọi thẻ phải được đóng đúng cách. Lỗi cú pháp sẽ làm giao diện không hiển thị.
- Mỗi mẫu phải là một đoạn mã HTML hoàn chỉnh, bao gồm thẻ \`<style>\` và \`<script>\`.
- **QUAN TRỌNG:** Script PHẢI đọc dữ liệu từ một chuỗi XML được truyền vào dưới dạng \`$1\` (ví dụ: \`const dataBlockContent = \\\`$1\\\`;\`) và điền vào các phần tử HTML. Hãy tạo các thẻ XML mẫu trong JS của bạn để minh họa.
- KHÔNG bao gồm \`<html>\` hoặc \`<body>\`.
- Đặt tên sáng tạo cho mỗi mẫu.
- Trả về kết quả dưới dạng JSON theo schema.`;
    return generatePreviews(apiKey, prompt, count, startIndex);
};

export const generateRegexUIPreviews = async (apiKey: string, description: string, theme: string, count: number, startIndex = 0): Promise<UIPreview[]> => {
    const prompt = `Bạn là một kỹ sư frontend chuyên về SillyTavern. Tạo ra **${count}** mẫu giao diện HTML độc đáo dựa trên yêu cầu sau.
**Chủ đề chung của thẻ:** "${theme}"
**Mô tả chức năng giao diện mới:** "${description}"
**Yêu cầu:**
- **QUAN TRỌNG VỀ CHẤT LƯỢNG MÃ:** Toàn bộ mã HTML phải hợp lệ. Mọi thẻ phải được đóng đúng cách. Lỗi cú pháp sẽ làm giao diện không hiển thị.
- Mỗi mẫu phải là một đoạn mã HTML hoàn chỉnh, bao gồm thẻ \`<style>\` và có thể có \`<script>\` nếu cần.
- Giao diện này sẽ được kích hoạt bằng regex. Hãy thiết kế nó để hiển thị thông tin một cách trực quan.
- Nếu giao diện cần hiển thị dữ liệu động, hãy giả định rằng dữ liệu sẽ được truyền vào qua một cơ chế như \`$1\` trong script hoặc các placeholder trong HTML.
- KHÔNG bao gồm \`<html>\` hoặc \`<body>\`.
- Đặt tên sáng tạo, mô tả cho mỗi mẫu.
- Trả về kết quả dưới dạng JSON theo schema.`;
    return generatePreviews(apiKey, prompt, count, startIndex);
};

export const editUIPreview = async (apiKey: string, currentCode: string, editRequest: string): Promise<string> => {
    const prompt = `Bạn là một kỹ sư frontend. Đây là một đoạn mã HTML/CSS/JS:
\`\`\`html
${currentCode}
\`\`\`
Hãy sửa đổi đoạn mã này dựa trên yêu cầu sau: "${editRequest}".
**QUAN TRỌNG:** Chỉ trả về đoạn mã HTML đã được sửa đổi. KHÔNG thêm bất kỳ giải thích nào. Toàn bộ đầu ra của bạn phải nằm trong một đối tượng JSON duy nhất có khóa là "updatedCode".`;
    
    const response = await callGeminiWithRetry(apiKey, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    updatedCode: { type: Type.STRING, description: "Mã HTML, CSS và JS đã được sửa đổi." }
                },
                required: ['updatedCode']
            }
        }
    });
    
    try {
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        return parsed.updatedCode || currentCode;
    } catch (e) {
        console.error("Lỗi phân tích JSON editUIPreview:", response.text, e);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ khi chỉnh sửa.");
    }
}


const MVU_HELPER_SCRIPT = {
    type: "script",
    value: { id: "mvu-beta-script", name: "MVU beta", content: "import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@beta/artifact/bundle.js'", enabled: true }
};

const FULL_CARD_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        spec: { type: Type.STRING, description: "Phải là 'chara_card_v3'." },
        spec_version: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, personality: { type: Type.STRING },
        scenario: { type: Type.STRING }, first_mes: { type: Type.STRING },
        data: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING }, description: { type: Type.STRING }, personality: { type: Type.STRING }, scenario: { type: Type.STRING }, first_mes: { type: Type.STRING },
                alternate_greetings: { type: Type.ARRAY, items: { type: Type.STRING } },
                character_book: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, entries: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keys: { type: Type.ARRAY, items: { type: Type.STRING } }, content: { type: Type.STRING }, comment: { type: Type.STRING }, enabled: { type: Type.BOOLEAN }, insertion_order: { type: Type.INTEGER }, } } } } },
                extensions: { type: Type.OBJECT, properties: { world: { type: Type.STRING }, regex_scripts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, scriptName: { type: Type.STRING }, findRegex: { type: Type.STRING }, replaceString: { type: Type.STRING }, } } }, TavernHelper_scripts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, value: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, content: { type: Type.STRING }, enabled: { type: Type.BOOLEAN } } } } } } } }
            }
        }
    },
    required: ['spec', 'spec_version', 'name', 'first_mes', 'data'],
};

export const analyzeLorebookForSuggestions = async (apiKey: string, lorebookContent: string): Promise<{ name: string; theme: string; firstMessageIdea: string; }> => {
    const prompt = `Bạn là một trợ lý sáng tạo chuyên về SillyTavern. Hãy phân tích các mục Sổ tay Thế giới (lorebook) sau đây. Dựa trên nội dung, hãy đề xuất một tên nhân vật hấp dẫn, một danh sách các chủ đề/từ khóa, và một ý tưởng cho tin nhắn đầu tiên. Mục tiêu là tạo ra một thẻ nhân vật hoàn toàn phù hợp với lore này.
**Nội dung Sổ tay Thế giới:**
\`\`\`json
${lorebookContent}
\`\`\`
**QUAN TRỌNG:** Cung cấp đầu ra dưới dạng một đối tượng JSON duy nhất theo schema.`;

    const response = await callGeminiWithRetry(apiKey, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Tên nhân vật/thẻ được đề xuất." },
                    theme: { type: Type.STRING, description: "Các chủ đề và từ khóa được đề xuất, cách nhau bởi dấu phẩy." },
                    firstMessageIdea: { type: Type.STRING, description: "Ý tưởng cho tin nhắn đầu tiên, phù hợp với lore." }
                },
                required: ['name', 'theme', 'firstMessageIdea']
            }
        }
    });

    try {
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Lỗi phân tích JSON từ analyzeLorebookForSuggestions:", response.text, e);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ cho các đề xuất.");
    }
};

export const generateSillyTavernCard = async (
  apiKey: string,
  options: CardOptions,
  features: Feature[],
  knowledgeLibrary: KnowledgeFile[]
): Promise<object> => {
  const knowledgePrompt = buildKnowledgePromptSection(knowledgeLibrary, options.referenceCardId, 'create');
  
  let loreGenerationPrompt = '';
  if (options.importedLorebook && options.importedLorebook.length > 0) {
      loreGenerationPrompt = `
**SỔ TAY THẾ GIỚI BẮT BUỘC (QUAN TRỌNG):**
- Người dùng đã cung cấp một Sổ tay Thế giới hoàn chỉnh.
- **NHIỆM VỤ CỦA BẠN:** Bạn PHẢI sử dụng chính xác mảng 'entries' dưới đây cho trường 'data.character_book.entries' trong đối tượng JSON cuối cùng. KHÔNG thay đổi, thêm, hoặc bớt bất kỳ mục nào.
- Hãy xây dựng phần còn lại của thẻ (tên, mô tả, kịch bản, v.v.) để phù hợp một cách hoàn hảo với nội dung của Sổ tay Thế giới này.
- **Nội dung Sổ tay Thế giới cần đưa vào:**
\`\`\`json
${JSON.stringify(options.importedLorebook, null, 2)}
\`\`\`
`;
  } else {
      let customLorePrompt = (options.customLoreRequests && options.customLoreRequests.filter(req => req.trim() !== '').length > 0) ? `
**Yêu cầu Sổ tay Thế giới Tùy chỉnh:**
- Ngoài số lượng mục được yêu cầu, ngươi PHẢI tạo thêm các mục lorebook dựa trên các yêu cầu cụ thể sau:
${options.customLoreRequests.filter(req => req.trim() !== '').map((req, i) => `  - Yêu cầu ${i + 1}: "${req}"`).join('\n')}` : '';

      loreGenerationPrompt = `
- Số lượng mục Sổ tay Thế giới (Tự động): ${options.lorebookEntries}
**QUY TẮC TẠO SỔ TAY THẾ GIỚI (QUAN TRỌNG):**
1.  **Ưu tiên Hướng dẫn Cốt lõi:** Các mục đầu tiên trong character_book PHẢI là các hướng dẫn kỹ thuật để thẻ hoạt động (hướng dẫn sử dụng MVU, cách điền dữ liệu vào các thẻ giao diện, v.v.).
2.  **Hoàn thành các mục còn lại:** Sau khi tạo xong các hướng dẫn cốt lõi, hãy sử dụng số lượng mục còn lại để xây dựng thế giới.
${customLorePrompt}
`;
  }

  const prompt = `Bạn là một chuyên gia tạo thẻ SillyTavern nâng cao. Nhiệm vụ của bạn là tạo một đối tượng JSON hoàn chỉnh cho một thẻ nhân vật SillyTavern v3.

**Thông tin cơ bản:**
- Tên Thẻ: "${options.name}"
- Chủ đề/Từ khóa: "${options.theme}"
- Ý tưởng Tin nhắn Đầu tiên: "${options.firstMessageIdea}"
${loreGenerationPrompt}
${knowledgePrompt}

**Yêu cầu chung:**
- Đầu ra cuối cùng phải là một đối tượng JSON hợp lệ duy nhất, tuân thủ schema được cung cấp. Không thêm bất kỳ giải thích nào.

Tạo thẻ ngay bây giờ.`;
  
  const response = await callGeminiWithRetry(apiKey, {
    model: 'gemini-2.5-flash', contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: FULL_CARD_SCHEMA,
    }
  });

  const jsonString = response.text.trim();
  try {
    const parsedJson: SillyTavernCard = JSON.parse(jsonString);

    if (!parsedJson.data) parsedJson.data = {} as any;
    if (!parsedJson.data.extensions) parsedJson.data.extensions = {};
    if (!parsedJson.data.extensions.regex_scripts) parsedJson.data.extensions.regex_scripts = [];
    if (!parsedJson.data.extensions.TavernHelper_scripts) parsedJson.data.extensions.TavernHelper_scripts = [];
    if (!parsedJson.data.alternate_greetings) parsedJson.data.alternate_greetings = [];

    const createRegexScript = (id: string, name: string, trigger: string, code: string) => ({
      id, scriptName: name, findRegex: trigger,
      replaceString: `\`\`\`html\n${code}\n\`\`\``,
      placement: [2], disabled: false, markdownOnly: true, promptOnly: false, runOnEdit: true,
      maxDepth: trigger.includes("Bắt đầu") || trigger.includes("Mở đầu") ? 1 : null,
    });

    // 1. Status Panel
    if (options.statusPanelCode) {
      parsedJson.data.extensions.regex_scripts.push(createRegexScript("STATUS_PANEL_V1", "[UI] Bảng Trạng thái", "/<DATA_BLOCK>([\\s\\S]*?)<\\/DATA_BLOCK>/s", options.statusPanelCode));
    }
    // 2. Welcome Screen & Creator (Smart Integration)
    const welcomeTrigger = "【Mở đầu】";
    const creatorTrigger = "【Tạo Nhân vật】";
    if (options.welcomeScreenCode) {
      parsedJson.data.extensions.regex_scripts.push(createRegexScript("WELCOME_SCREEN_V1", "[UI] Màn hình Chào mừng", welcomeTrigger, options.welcomeScreenCode));
    }
    if (options.creatorCode) {
      parsedJson.data.extensions.regex_scripts.push(createRegexScript("CHAR_CREATOR_V1", "[UI] Trình tạo Nhân vật", creatorTrigger, options.creatorCode));
    }

    // Set greetings based on which UIs were created
    if (options.welcomeScreenCode && options.creatorCode) {
      parsedJson.first_mes = welcomeTrigger;
      parsedJson.data.first_mes = welcomeTrigger;
      if (!parsedJson.data.alternate_greetings.includes(creatorTrigger)) {
        parsedJson.data.alternate_greetings.push(creatorTrigger);
      }
    } else if (options.welcomeScreenCode) {
      parsedJson.first_mes = welcomeTrigger;
      parsedJson.data.first_mes = welcomeTrigger;
    } else if (options.creatorCode) {
      parsedJson.first_mes = creatorTrigger;
      parsedJson.data.first_mes = creatorTrigger;
    }

    if (features.includes('progressionSystem')) {
      if (!parsedJson.data.extensions.TavernHelper_scripts.some((s: any) => s.value.id === MVU_HELPER_SCRIPT.value.id)) {
          parsedJson.data.extensions.TavernHelper_scripts.push(MVU_HELPER_SCRIPT);
      }
    }

    return parsedJson;
  } catch (e) {
    console.error("Lỗi phân tích JSON từ Gemini:", jsonString, e);
    throw new Error(`AI đã trả về một định dạng JSON không hợp lệ. Vui lòng thử lại.`);
  }
};


export const addLoreEntries = async (apiKey: string, card: SillyTavernCard, count: number): Promise<SillyTavernCard> => {
    const existingLore = card.data.character_book?.entries.map(e => `- ${e.comment}: ${e.content.substring(0, 100)}...`).join('\n') || 'Không có';
    const prompt = `Bạn là một người xây dựng thế giới tài ba. Dựa trên thẻ nhân vật SillyTavern hiện có, hãy tạo ra **${count}** mục Sổ tay Thế giới (lorebook) mới.
**Bối cảnh Thẻ:** Tên: ${card.name}, Chủ đề: ${card.description}.
**Lore hiện có:**\n${existingLore}
**Yêu cầu:** Tạo ${count} mục lore mới (nhân vật phụ, địa điểm, lịch sử, v.v.). Mỗi mục phải có 'keys', 'content', và 'comment'. Chỉ trả về một mảng JSON chứa các mục mới trong khóa 'new_entries'.`;

    const response = await callGeminiWithRetry(apiKey, {
        model: 'gemini-2.5-flash', contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT, properties: { new_entries: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keys: { type: Type.ARRAY, items: { type: Type.STRING } }, content: { type: Type.STRING }, comment: { type: Type.STRING } }, required: ['keys', 'content'] } } }, required: ['new_entries']
            }
        }
    });

    try {
        const parsed = JSON.parse(response.text.trim());
        const newEntries = parsed.new_entries || [];
        const updatedCard = { ...card };
        if (!updatedCard.data.character_book) updatedCard.data.character_book = { name: `${card.name} Lorebook`, entries: [] };
        let maxOrder = updatedCard.data.character_book.entries.reduce((max, e) => Math.max(max, e.insertion_order || 0), 0);
        newEntries.forEach((entry: any) => {
            updatedCard.data.character_book.entries.push({ ...entry, enabled: true, insertion_order: ++maxOrder });
        });
        return updatedCard;
    } catch (e) {
        console.error("Lỗi phân tích JSON từ addLoreEntries:", response.text);
        throw new Error("AI trả về JSON không hợp lệ cho lore mới.");
    }
}

export const generateAndAddRegex = async (apiKey: string, card: SillyTavernCard, description: string, uiCode: string): Promise<SillyTavernCard> => {
    const prompt = `Bạn là một chuyên gia SillyTavern. Nhiệm vụ: tạo một 'regex_script' và một 'lorebook' hướng dẫn để tích hợp một giao diện mới vào thẻ.
**Thẻ:** Tên: ${card.name}, Chủ đề: ${card.description}
**Tính năng mới:**
- **Mô tả:** "${description}"
- **Mã Giao diện:** \`\`\`html\n${uiCode}\n\`\`\`
**Nhiệm vụ:**
1.  **Tạo Regex Trigger:** Nghĩ ra một thẻ XML trigger thông minh (ví dụ: \`<ThongBaoNhiemVu>...</ThongBaoNhiemVu>\`) và tạo \`findRegex\` để bắt nó.
2.  **Tạo Lorebook Hướng dẫn:** Viết một mục lorebook chỉ dẫn cho AI, giải thích thẻ trigger mới và cách sử dụng nó.
3.  **Kết hợp:** Trả về một JSON duy nhất chứa 'regex_script' (scriptName, findRegex) và 'lorebook_entry' (keys, content, comment).`;

    const response = await callGeminiWithRetry(apiKey, {
        model: 'gemini-2.5-flash', contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    regex_script: { type: Type.OBJECT, properties: { scriptName: { type: Type.STRING }, findRegex: { type: Type.STRING } }, required: ['scriptName', 'findRegex'] },
                    lorebook_entry: { type: Type.OBJECT, properties: { keys: { type: Type.ARRAY, items: { type: Type.STRING } }, content: { type: Type.STRING }, comment: { type: Type.STRING } }, required: ['keys', 'content'] }
                },
                required: ['regex_script', 'lorebook_entry']
            }
        }
    });

    try {
        const parsed = JSON.parse(response.text.trim());
        const updatedCard = { ...card };
        if (!updatedCard.data.extensions) updatedCard.data.extensions = {};
        if (!updatedCard.data.extensions.regex_scripts) updatedCard.data.extensions.regex_scripts = [];
        if (!updatedCard.data.character_book) updatedCard.data.character_book = { name: `${card.name} Lorebook`, entries: [] };

        const newRegexScript = {
            id: `CUSTOM_REGEX_${Date.now()}`, scriptName: `[CUSTOM] ${parsed.regex_script.scriptName}`, findRegex: parsed.regex_script.findRegex,
            replaceString: `\`\`\`html\n${uiCode}\n\`\`\``,
            placement: [2], disabled: false, promptOnly: false, runOnEdit: true,
        };
        updatedCard.data.extensions.regex_scripts.push(newRegexScript);
        
        let maxOrder = updatedCard.data.character_book.entries.reduce((max, e) => Math.max(max, e.insertion_order || 0), 0);
        const newLoreEntry = { ...parsed.lorebook_entry, enabled: true, insertion_order: maxOrder + 1 };
        updatedCard.data.character_book.entries.push(newLoreEntry);

        return updatedCard;
    } catch (e) {
        console.error("Lỗi phân tích JSON từ generateAndAddRegex:", response.text);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ.");
    }
}


export const fixSillyTavernCard = async (
    apiKey: string,
    brokenCard: SillyTavernCard,
    errorDescription: string,
    knowledgeLibrary: KnowledgeFile[],
    referenceId?: string
): Promise<SillyTavernCard> => {
    const knowledgePrompt = buildKnowledgePromptSection(knowledgeLibrary, referenceId, 'fix');
    const prompt = `Bạn là một chuyên gia gỡ lỗi thẻ SillyTavern. Nhiệm vụ của bạn là sửa một thẻ bị lỗi.

**1. Thẻ Bị Lỗi:**
\`\`\`json
${JSON.stringify(brokenCard, null, 2)}
\`\`\`

**2. Mô tả lỗi của người dùng:**
"${errorDescription}"

${knowledgePrompt}

**Nhiệm vụ của bạn:**
1.  Phân tích kỹ thẻ bị lỗi và mô tả của người dùng.
2.  Nếu có file tham khảo, hãy sử dụng nó như một hình mẫu về cấu trúc và mã nguồn đúng.
3.  Sửa đổi JSON của thẻ bị lỗi để khắc phục vấn đề. Điều này có thể bao gồm việc sửa lỗi cú pháp JSON, viết lại mã HTML/CSS/JS trong regex_scripts, điều chỉnh cấu trúc lorebook, hoặc sửa các giá trị không hợp lệ.
4.  **QUAN TRỌNG:** Trả về **toàn bộ đối tượng JSON của thẻ đã được sửa chữa**. Đầu ra của bạn phải là một đối tượng JSON hợp lệ duy nhất, tuân thủ schema được cung cấp và không có bất kỳ giải thích nào.

Sửa thẻ ngay bây giờ.`;
  
    const response = await callGeminiWithRetry(apiKey, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: FULL_CARD_SCHEMA,
        }
    });

    try {
        const jsonString = response.text.trim();
        const parsedJson: SillyTavernCard = JSON.parse(jsonString);
        return parsedJson;
    } catch (e) {
        console.error("Lỗi phân tích JSON từ fixSillyTavernCard:", response.text, e);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ sau khi sửa lỗi.");
    }
};