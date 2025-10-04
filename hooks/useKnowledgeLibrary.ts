import { useCallback, useEffect, useState } from "react";

import type { KnowledgeFile } from "../types";

const LIBRARY_STORAGE_KEY = "sillytavern_ai_creator_knowledge_library";

export const useKnowledgeLibrary = () => {
  const [knowledgeLibrary, setKnowledgeLibrary] = useState<KnowledgeFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (storedLibrary) {
        setKnowledgeLibrary(JSON.parse(storedLibrary));
      }
    } catch (error) {
      console.error(
        "Failed to load knowledge library from localStorage",
        error,
      );
      // Clear corrupted data
      localStorage.removeItem(LIBRARY_STORAGE_KEY);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          LIBRARY_STORAGE_KEY,
          JSON.stringify(knowledgeLibrary),
        );
      } catch (error) {
        console.error(
          "Failed to save knowledge library to localStorage",
          error,
        );
      }
    }
  }, [knowledgeLibrary, isLoaded]);

  const addFilesToLibrary = useCallback(
    (files: { name: string; content: string }[]) => {
      setKnowledgeLibrary((prevLibrary) => {
        const libraryMap = new Map(prevLibrary.map((file) => [file.id, file]));
        files.forEach(({ name, content }) => {
          const id = name; // Use filename as ID
          libraryMap.set(id, { id, name, content });
        });
        return Array.from(libraryMap.values());
      });
    },
    [],
  );

  const removeFileFromLibrary = useCallback((id: string) => {
    setKnowledgeLibrary((prevLibrary) =>
      prevLibrary.filter((file) => file.id !== id),
    );
  }, []);

  return {
    knowledgeLibrary,
    addFilesToLibrary,
    removeFileFromLibrary,
  };
};
