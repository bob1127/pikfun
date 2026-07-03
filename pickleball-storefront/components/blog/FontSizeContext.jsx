import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

  const options = [
    { id: "standard", label: "標準" },
    { id: "lg", label: "大" },
    { id: "xl", label: "特大" },
  ];

  return (
    <div className="editorial-font-toolbar" role="group" aria-label="字級大小">
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
