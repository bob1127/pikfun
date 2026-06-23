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
  hint = "點選常用項目，或直接輸入自訂內容",
}) {
  const isSelected = mode === "lines" ? hasLineItem : hasCommaItem;
  const toggle = mode === "lines" ? toggleLineItem : toggleCommaItem;

  const handlePresetClick = (item) => {
    onChange(toggle(value, item));
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">
        {label}
      </label>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presets.map((item) => {
            const active = isSelected(value, item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => handlePresetClick(item)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-gray-600 hover:border-black hover:text-black bg-white"
                }`}
              >
                {active ? "✓ " : "+ "}
                {item}
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

      <p className="text-[10px] text-gray-400 mt-1.5">{hint}</p>
    </div>
  );
}
