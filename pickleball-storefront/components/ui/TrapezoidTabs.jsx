"use client";

/**
 * TrapezoidTabs — 梯形圓角 tab（參考 folder-tab 設計）
 *
 * Props:
 *   items    { key, label }[]
 *   value    string          目前選中的 key
 *   onChange (key) => void
 *   className string
 */
export default function TrapezoidTabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`trap-tabs ${className}`}>
      <div className="trap-tabs-row" role="tablist">
        {items.map((item, i) => {
          const active = value === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.key)}
              className={`trap-tab ${active ? "is-active" : ""}`}
              style={{ zIndex: active ? items.length + 1 : items.length - i }}
            >
              <svg
                className="trap-tab-svg"
                viewBox="0 0 160 52"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className="trap-tab-path"
                  d="M 22 0 H 138 Q 146 0 148 8 L 156 52 H 4 L 12 8 Q 14 0 22 0 Z"
                />
              </svg>
              <span className="trap-tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="trap-tabs-baseline" aria-hidden />

      <style jsx>{`
        .trap-tabs {
          width: 100%;
        }
        .trap-tabs-row {
          display: flex;
          align-items: flex-end;
          width: 100%;
        }
        .trap-tab {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          height: 52px;
          margin-left: -14px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease;
        }
        .trap-tab:first-child {
          margin-left: 0;
        }
        .trap-tab:active:not(.is-active) {
          transform: translateY(1px);
        }
        .trap-tab-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .trap-tab-path {
          fill: #ffffff;
          stroke: #e2e8f0;
          stroke-width: 1;
          transition: fill 0.2s ease, stroke 0.2s ease;
        }
        .trap-tab.is-active .trap-tab-path {
          fill: #0f172a;
          stroke: #0f172a;
        }
        .trap-tab-label {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0 22px 4px;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          white-space: nowrap;
          transition: color 0.2s ease;
          user-select: none;
        }
        .trap-tab.is-active .trap-tab-label {
          color: #ffffff;
        }
        .trap-tabs-baseline {
          height: 2px;
          background: #0f172a;
          width: 100%;
          margin-top: -1px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 640px) {
          .trap-tab {
            height: 48px;
            margin-left: -10px;
          }
          .trap-tab-label {
            font-size: 0.625rem;
            padding: 0 16px 4px;
            letter-spacing: 0.04em;
          }
        }
      `}</style>
    </div>
  );
}
