import { Pencil, Loader2, X, Check } from "lucide-react";

export default function CoachEditableSection({
  isOwner,
  sectionId,
  activeSection,
  onEdit,
  onCancel,
  onSave,
  saving,
  label = "編輯",
  className = "",
  children,
  editPanel,
  alwaysShow = false,
}) {
  const editing = isOwner && activeSection === sectionId;
  const showBlock = alwaysShow || children || editing;

  if (!showBlock && !isOwner) return null;

  return (
    <div className={`relative ${className}`}>
      {isOwner && (
        <div className="flex justify-end mb-2 min-h-[28px]">
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black px-2 py-1 rounded border border-gray-200 bg-white"
              >
                <X size={12} /> 取消
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#3157B5] hover:bg-[#2746a0] px-3 py-1 rounded"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                儲存
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(sectionId)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#3157B5] hover:text-[#2746a0] px-2.5 py-1 rounded border border-[#3157B5]/30 bg-white/80 hover:bg-white shadow-sm opacity-80 hover:opacity-100 transition-opacity"
            >
              <Pencil size={12} /> {label}
            </button>
          )}
        </div>
      )}

      {editing ? (
        <div className="p-4 sm:p-5 bg-white border-2 border-[#3157B5]/30 rounded-lg shadow-sm">
          {editPanel}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
