import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "next-i18next";

const STORAGE_KEY = "PikFun-text-scale";

const FontSizeContext = createContext({
  scale: "standard",
  setScale: () => {},
});

function applyScaleToDocument(scale) {
  const root = document.documentElement;
  root.classList.remove("text-scale-lg", "text-scale-xl");
  if (scale === "lg") root.classList.add("text-scale-lg");
  if (scale === "xl") root.classList.add("text-scale-xl");
}

export function FontSizeProvider({ children }) {
  const [scale, setScaleState] = useState("standard");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "lg" || saved === "xl" || saved === "standard") {
        setScaleState(saved);
        applyScaleToDocument(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setScale = useCallback((next) => {
    setScaleState(next);
    applyScaleToDocument(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <FontSizeContext.Provider value={{ scale, setScale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}

export function FontSizeToolbar() {
  const { scale, setScale } = useFontSize();
  const { t } = useTranslation("blog");

  const options = [
    { id: "standard", label: t("fontToolbar.standard") },
    { id: "lg", label: t("fontToolbar.lg") },
    { id: "xl", label: t("fontToolbar.xl") },
  ];

  return (
    <div
      className="editorial-font-toolbar"
      role="group"
      aria-label={t("fontToolbar.ariaLabel")}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`editorial-font-btn ${scale === opt.id ? "is-active" : ""}`}
          onClick={() => setScale(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
