export type Template = "default" | "cyberpunk" | "racing" | "framework";

export interface UIPreview {
  name: string;
  code: string;
}

export interface KnowledgeFile {
  id: string; // Using filename or a generated UUID
  name: string;
  content: string; // The full JSON string of the card
}

// Moved this interface to be accessible by CardOptions
export interface LorebookEntry {
  keys: string[];
  content: string;
  comment: string;
  enabled: boolean;
  insertion_order: number;
  [key: string]: any; // for other potential fields
}

export interface CardOptions {
  name: string;
  theme: string;
  firstMessageIdea: string;
  template: Template;
  lorebookEntries: number;
  customLoreRequests?: string[];
  welcomeScreenCode: string | null;
  creatorCode: string | null;
  statusPanelCode: string | null;
  referenceCardId?: string; // ID of a KnowledgeFile
  importedLorebook?: LorebookEntry[] | null;
}

export type Feature =
  | "welcomeScreen"
  | "characterCreator"
  | "dynamicStatusUI"
  | "progressionSystem"
  | "relationshipSystem"
  | "worldMap"
  | "lorebook";

// Detailed type for the SillyTavern card structure
interface RegexScript {
  id: string;
  scriptName: string;
  findRegex: string;
  replaceString: string;
  [key: string]: any; // for other potential fields
}

interface TavernHelperScriptValue {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

interface TavernHelperScript {
  type: string;
  value: TavernHelperScriptValue;
}

export interface SillyTavernCard {
  spec: "chara_card_v3";
  spec_version: string;
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    alternate_greetings: string[];
    character_book?: {
      name: string;
      entries: LorebookEntry[];
    };
    extensions?: {
      world?: string;
      regex_scripts?: RegexScript[];
      TavernHelper_scripts?: TavernHelperScript[];
      [key: string]: any; // For other extensions
    };
  };
}
