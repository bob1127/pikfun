import { useTranslation } from "next-i18next";
import {
  toggleLineItem,
  toggleCommaItem,
  hasLineItem,
  hasCommaItem,
} from "@/lib/coachProfileFields";

export default function TagPickerField({
  label,
  value,
  onChange,
  presets = [],
  mode = "lines",
  placeholder,
  rows = 4,
  hint,
}) {
  const { t } = useTranslation("coaching");
  const resolvedHint = hint || t("editor.tag_picker.default_hint");
  const isSelected = mode === "lines" ? hasLineItem : hasCommaItem;
  const toggle = mode === "lines" ? toggleLineItem : toggleCommaItem;

  const handlePresetClick = (item) => {
    const presetValue =
      typeof item === "string" ? item : String(item?.value || "");
    onChange(toggle(value, presetValue));
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">
        {label}
      </label>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presets.map((item) => {
            const presetValue =
              typeof item === "string" ? item : String(item?.value || "");
            const presetLabel =
              typeof item === "string"
                ? item
                : String(item?.label || item?.value || "");
            const active = isSelected(value, presetValue);
            return (
              <button
                key={presetValue}
                type="button"
                onClick={() => handlePresetClick(item)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-gray-600 hover:border-black hover:text-black bg-white"
                }`}
              >
                {active ? "✓ " : "+ "}
                {presetLabel}
              </button>
            );
          })}
        </div>
      )}

      {mode === "lines" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="field resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="field"
        />
      )}

      <p className="text-[10px] text-gray-400 mt-1.5">{resolvedHint}</p>
    </div>
  );
}
