"use client";

/**
 * 開團 / 開課頁共用樣式（crt-*）
 * 版型同 /play/create：手機深藍 Hero + 白色圓角表單、
 * 桌機置中極簡表單 + 資訊面板 + 手機 sticky CTA。
 */
export default function CreatePageStyles() {
  return (
    <style jsx global>{`
      /* ─── layout visibility ───────────────────── */
      .crt-mobile-only {
        display: block;
      }
      .crt-desktop-only {
        display: none !important;
      }
      @media (min-width: 1024px) {
        .crt-mobile-only {
          display: none !important;
        }
        .crt-desktop-only {
          display: block !important;
        }
        .crt-btn-submit.crt-btn-submit-dsk {
          display: flex !important;
        }
      }

      /* ─── page & hero ──────────────────────────── */
      .crt-page {
        min-height: 100vh;
        background: #f0f4f8;
        padding-top: 3.5rem;
      }
      @media (min-width: 1024px) {
        .crt-page {
          padding-top: 6.5rem;
          padding-bottom: 5rem;
          background: #fff;
        }
      }

      .crt-hero {
        background: #0a3d8f;
        padding: 0 1.25rem 2.75rem;
        position: relative;
        overflow: hidden;
        isolation: isolate;
      }

      .crt-hero-topbar {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 0;
      }
      .crt-hero-back,
      .crt-hero-bell {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.2s;
      }
      .crt-hero-back:hover,
      .crt-hero-bell:hover {
        background: rgba(255, 255, 255, 0.22);
      }

      .crt-hero-body {
        position: relative;
        z-index: 1;
      }

      .crt-hero-greeting {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .crt-hero-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 999px;
        object-fit: cover;
        border: 2.5px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }
      .crt-hero-avatar-fallback {
        background: linear-gradient(135deg, #c8f542, #86efac);
        color: #0f172a;
        font-size: 1.125rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .crt-hero-hi {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        font-weight: 500;
      }
      .crt-hero-name {
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
        margin: 0;
      }

      .crt-hero-main {
        margin-bottom: 1.25rem;
      }
      .crt-hero-date {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 0.08em;
        margin: 0 0 0.25rem;
        font-weight: 600;
      }
      .crt-hero-title {
        font-size: 2.5rem;
        font-weight: 900;
        color: #fff;
        line-height: 1.1;
        margin: 0 0 0.375rem;
        letter-spacing: -0.01em;
      }
      .crt-hero-sub {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.75);
        margin: 0;
      }

      .crt-hero-tags {
        display: flex;
        gap: 0.5rem;
      }
      .crt-hero-tag {
        padding: 0.3rem 0.875rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.85);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.08);
      }

      /* ─── desktop brand (THEO) ────────────────── */
      .crt-dsk-brand {
        text-align: center;
        max-width: 28rem;
        margin: 0 auto;
        padding: 0 1.5rem 1.75rem;
      }
      .crt-dsk-logo {
        display: block;
        font-size: 2rem;
        font-weight: 900;
        color: #1a9be8;
        letter-spacing: -0.03em;
        margin-bottom: 1.5rem;
      }
      .crt-dsk-icon {
        color: #1a9be8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }
      .crt-dsk-title {
        font-size: 1.375rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 0.75rem;
        letter-spacing: 0.01em;
      }
      .crt-dsk-sub {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.7;
      }

      .crt-dsk-actions {
        max-width: 28rem;
        margin: 0 auto;
        padding: 0 1.5rem;
        text-align: center;
      }
      .crt-dsk-note {
        font-size: 0.6875rem;
        color: #9ca3af;
        line-height: 1.7;
        margin: 0 0 1.25rem;
      }
      .crt-dsk-footlink {
        display: inline-block;
        margin-top: 1.25rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1a9be8;
        text-decoration: none;
      }
      .crt-dsk-footlink:hover {
        text-decoration: underline;
      }

      .crt-dsk-fl {
        display: block;
        margin-bottom: 1.5rem;
      }
      .crt-dsk-fl-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        margin-bottom: 0.375rem;
      }
      .crt-dsk-time-fields {
        margin-top: 0.25rem;
      }
      .crt-time-hint {
        font-size: 0.6875rem;
        color: #94a3b8;
        margin: -0.5rem 0 0;
        line-height: 1.5;
      }
      @media (min-width: 1024px) {
        .crt-time-hint {
          margin-top: -0.25rem;
        }
      }

      /* ─── bottom sheet / form ─────────────────── */
      .crt-sheet {
        background: #fff;
        border-radius: 2rem 2rem 0 0;
        margin-top: -2rem;
        padding: 1.75rem 1.25rem 1.5rem;
        position: relative;
        min-height: 60vh;
      }
      @media (min-width: 1024px) {
        .crt-sheet {
          max-width: 28rem;
          margin: 0 auto;
          margin-top: 0;
          border-radius: 0;
          padding: 0 1.5rem;
          box-shadow: none;
          border: none;
          min-height: auto;
          background: transparent;
        }
        .crt-dsk-actions {
          margin-top: 0.5rem;
        }
      }

      .crt-form-grid {
        display: block;
      }

      /* ─── section ─────────────────────────────── */
      .crt-section {
        padding-bottom: 1.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .crt-section:last-of-type {
        border-bottom: none;
      }
      @media (min-width: 1024px) {
        .crt-section {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .crt-sec-icon {
          display: none;
        }
        .crt-sec-title {
          margin-bottom: 0.875rem;
          margin-top: 2rem;
        }
        .crt-form-grid > .crt-section:first-child .crt-sec-title {
          margin-top: 0;
        }
        .crt-sec-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
        }
      }

      .crt-sec-title {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-bottom: 1rem;
      }
      .crt-sec-icon {
        width: 2rem;
        height: 2rem;
        border-radius: 0.625rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .crt-sec-label {
        font-size: 0.9375rem;
        font-weight: 800;
        color: #0f172a;
      }

      .crt-field-label {
        font-size: 0.6875rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 0.625rem;
      }
      .crt-field-label-spaced {
        margin-top: 1rem;
      }

      /* ─── input ───────────────────────────────── */
      .crt-input {
        width: 100%;
        background: #f8fafc;
        border: 1.5px solid #e8edf3;
        border-radius: 1rem;
        padding: 0.875rem 1rem;
        font-size: 0.9375rem;
        color: #0f172a;
        outline: none;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
        margin-bottom: 0.625rem;
        display: block;
        font-family: inherit;
      }
      .crt-input::placeholder {
        color: #94a3b8;
      }
      .crt-input:focus {
        border-color: #005caf;
        box-shadow: 0 0 0 3px rgba(0, 92, 175, 0.1);
      }
      .crt-textarea {
        resize: none;
        min-height: 76px;
      }
      @media (min-width: 1024px) {
        .crt-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 0.5rem 0 0.625rem;
          margin-bottom: 0;
          font-size: 0.9375rem;
        }
        .crt-input::placeholder {
          color: #c4c9d0;
        }
        .crt-input:focus {
          border-bottom-color: #1a9be8;
          box-shadow: none;
        }
        .crt-textarea {
          min-height: 72px;
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 0.5rem 0 0.625rem;
          background: transparent;
          margin-top: 0.25rem;
        }
        .crt-textarea:focus {
          border-bottom-color: #1a9be8;
          box-shadow: none;
        }
        .crt-select {
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 0.5rem 1.5rem 0.625rem 0;
          background-color: transparent;
          font-weight: 500;
        }
        .crt-select:focus {
          border-bottom-color: #1a9be8;
          box-shadow: none;
        }
        .crt-court-steps {
          grid-template-columns: 1fr;
          gap: 0;
        }
        .crt-court-field {
          margin-bottom: 1.25rem;
        }
        .crt-court-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: none;
          letter-spacing: 0;
        }
        .crt-court-fchip {
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          background: transparent;
          padding: 0.5rem 0;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #6b7280;
        }
        .crt-court-fchip.active {
          color: #1a9be8;
          background: transparent;
          border-bottom-color: #1a9be8;
          box-shadow: none;
        }
        .crt-court-selected {
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          background: transparent;
          padding: 0.75rem 0;
        }
        .crt-court-sel-icon {
          display: none;
        }
        .crt-court-preview {
          border: none;
          background: transparent;
          padding: 0.5rem 0 0;
        }
        .crt-stepper {
          background: transparent;
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 0.375rem 0 0.625rem;
        }
        .crt-stepper-btn {
          width: 2rem;
          height: 2rem;
          background: #1a9be8;
          box-shadow: none;
        }
        .crt-stepper-num {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .crt-skill-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .crt-skill-card {
          border-radius: 999px;
          padding: 0.5rem 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #e5e7eb;
        }
        .crt-skill-card.active {
          background: #e0f2fe;
          border-color: #7dd3fc;
          color: #0369a1;
        }
        .crt-skill-hint {
          margin: 0.25rem 0 0;
          font-size: 0.6875rem;
          color: #94a3b8;
          line-height: 1.4;
        }
        .crt-skill-custom {
          margin-top: 0.625rem;
        }
        .crt-skill-custom-input {
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
        }
        .crt-fee-row {
          background: transparent;
          border: none;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0;
          padding: 0.375rem 0 0.625rem;
          margin-bottom: 0;
        }
        .crt-field-label {
          text-transform: none;
          letter-spacing: 0;
          font-size: 0.75rem;
          color: #6b7280;
        }
      }

      /* ─── tiles (time display) ───────────────── */
      .crt-tiles {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.625rem;
      }
      @media (max-width: 400px) {
        .crt-tiles {
          grid-template-columns: 1fr 1fr;
        }
        .crt-tile-value {
          font-size: 0.875rem;
        }
        .crt-stepper-num {
          font-size: 1.75rem;
        }
        .crt-stepper-btn {
          width: 2.75rem;
          height: 2.75rem;
        }
        .crt-fee-row {
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }
        .crt-fee-stepper {
          justify-content: center;
        }
      }
      .crt-tile {
        background: #005caf;
        border-radius: 1rem;
        padding: 0.875rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: left;
        border: none;
        cursor: pointer;
        transition:
          opacity 0.15s,
          transform 0.15s;
        position: relative;
        overflow: hidden;
      }
      .crt-tile:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      .crt-tile-wide {
        grid-column: span 2;
      }
      .crt-tile-lime {
        background: #c8f542;
      }
      .crt-tile-label {
        font-size: 0.625rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.75);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .crt-tile-lime .crt-tile-label {
        color: rgba(0, 0, 0, 0.5);
      }
      .crt-tile-value {
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.2;
      }
      .crt-tile-lime .crt-tile-value {
        color: #0f172a;
      }
      .crt-tile-arrow {
        position: absolute;
        top: 0.625rem;
        right: 0.625rem;
        color: rgba(255, 255, 255, 0.6);
      }
      .crt-tile-lime .crt-tile-arrow {
        color: rgba(0, 0, 0, 0.35);
      }

      /* ─── stepper ─────────────────────────────── */
      .crt-stepper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8fafc;
        border: 1.5px solid #e8edf3;
        border-radius: 1.25rem;
        padding: 0.5rem;
      }
      .crt-stepper-btn {
        width: 3rem;
        height: 3rem;
        border-radius: 999px;
        background: #005caf;
        color: #fff;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition:
          opacity 0.2s,
          transform 0.15s;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 92, 175, 0.3);
      }
      .crt-stepper-btn-sm {
        width: 2.25rem;
        height: 2.25rem;
        box-shadow: 0 2px 8px rgba(0, 92, 175, 0.25);
      }
      .crt-stepper-btn:active {
        transform: scale(0.93);
        opacity: 0.85;
      }
      .crt-stepper-display {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
      }
      .crt-stepper-num {
        font-size: 2.25rem;
        font-weight: 900;
        color: #0f172a;
        line-height: 1;
      }
      .crt-stepper-unit {
        font-size: 1rem;
        font-weight: 700;
        color: #64748b;
      }

      /* ─── skill grid ──────────────────────────── */
      .crt-skill-hint {
        margin: 0.375rem 0 0;
        font-size: 0.75rem;
        color: #94a3b8;
        line-height: 1.45;
      }
      .crt-skill-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.625rem;
      }
      @media (min-width: 480px) {
        .crt-skill-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      .crt-skill-card {
        padding: 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 700;
        border: 1.5px solid #e2e8f0;
        background: #fff;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      .crt-skill-card.active {
        background: #e0f2fe;
        border-color: #7dd3fc;
        color: #0369a1;
      }
      .crt-skill-card:active {
        transform: scale(0.97);
      }
      .crt-skill-custom {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.875rem;
      }
      .crt-skill-custom-label {
        font-size: 0.8125rem;
        font-weight: 700;
        color: #64748b;
        white-space: nowrap;
      }
      .crt-skill-custom-input {
        flex: 1;
        min-width: 0;
        border: 1.5px solid #e2e8f0;
        border-radius: 0.875rem;
        padding: 0.75rem 0.875rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;
        background: #fff;
        transition:
          border-color 0.2s,
          background 0.2s;
      }
      .crt-skill-custom-input:focus {
        outline: none;
        border-color: #7dd3fc;
      }
      .crt-skill-custom-input.active {
        background: #e0f2fe;
        border-color: #7dd3fc;
        color: #0369a1;
      }
      .crt-skill-badge-active {
        background: #e0f2fe;
        color: #0369a1;
      }

      /* ─── fee row ─────────────────────────────── */
      .crt-fee-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8fafc;
        border: 1.5px solid #e8edf3;
        border-radius: 1.25rem;
        padding: 1rem 1.25rem;
        margin-bottom: 0.625rem;
      }
      .crt-fee-label {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #0f172a;
      }
      .crt-fee-stepper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .crt-fee-value {
        font-size: 1.125rem;
        font-weight: 800;
        color: #005caf;
        min-width: 5rem;
        text-align: center;
      }
      .crt-fee-detail {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* ─── court search ────────────────────────── */
      .crt-court-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .crt-court-filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .crt-court-fchip {
        padding: 0.375rem 0.875rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        border: 1.5px solid #e2e8f0;
        background: #fff;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
      }
      .crt-court-fchip.active {
        background: #005caf;
        border-color: #005caf;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 92, 175, 0.25);
      }

      .crt-court-search-wrap {
        position: relative;
      }
      .crt-search-row {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .crt-search-icon {
        position: absolute;
        left: 1rem;
        color: #94a3b8;
        pointer-events: none;
      }
      .crt-search-input {
        padding-left: 2.5rem !important;
      }

      .crt-court-list {
        background: #fff;
        border: 1.5px solid #e8edf3;
        border-radius: 1.25rem;
        overflow: hidden;
        margin-top: 0.5rem;
        box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
      }
      .crt-court-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.15s;
      }
      .crt-court-row:last-child {
        border-bottom: none;
      }
      .crt-court-row:hover {
        background: #f8fafc;
      }
      .crt-court-row-icon {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.75rem;
        background: #eef5fb;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #005caf;
        flex-shrink: 0;
      }
      .crt-court-row-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
      }
      .crt-court-row-name {
        font-size: 0.875rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .crt-court-row-addr {
        font-size: 0.75rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .crt-court-row-badge {
        font-size: 0.6875rem;
        font-weight: 700;
        color: #005caf;
        background: #eef5fb;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        flex-shrink: 0;
      }

      .crt-court-selected {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        background: #eef8ff;
        border: 1.5px solid #bfdbfe;
        border-radius: 1.25rem;
        padding: 1rem 1.25rem;
      }
      .crt-court-sel-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.875rem;
        background: #005caf;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }
      .crt-court-sel-info {
        flex: 1;
        min-width: 0;
      }
      .crt-court-sel-name {
        font-size: 0.9375rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 0.125rem;
      }
      .crt-court-sel-addr {
        font-size: 0.75rem;
        color: #64748b;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .crt-court-change {
        font-size: 0.75rem;
        font-weight: 700;
        color: #005caf;
        background: #fff;
        border: 1.5px solid #bfdbfe;
        border-radius: 999px;
        padding: 0.35rem 0.875rem;
        cursor: pointer;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .crt-court-manual {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .crt-court-steps {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      @media (max-width: 480px) {
        .crt-court-steps {
          grid-template-columns: 1fr;
        }
      }
      .crt-court-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .crt-court-label {
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748b;
      }
      .crt-select {
        width: 100%;
        appearance: none;
        background: #fff
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
          no-repeat right 0.875rem center;
        border: 1.5px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.75rem 2.25rem 0.75rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;
        transition: border-color 0.2s;
      }
      .crt-select:focus {
        outline: none;
        border-color: #005caf;
        box-shadow: 0 0 0 3px rgba(0, 92, 175, 0.1);
      }
      .crt-select:disabled {
        background-color: #f8fafc;
        color: #94a3b8;
        cursor: not-allowed;
      }
      .crt-select--court {
        font-weight: 700;
      }
      .crt-court-select-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .crt-court-geo-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .crt-court-geo-btn {
        font-size: 0.75rem;
        font-weight: 700;
        color: #005caf;
        background: #eef5fb;
        border: none;
        border-radius: 999px;
        padding: 0.4rem 0.875rem;
        cursor: pointer;
      }
      .crt-court-geo-btn:disabled {
        opacity: 0.6;
        cursor: wait;
      }
      .crt-court-hint {
        font-size: 0.6875rem;
        color: #94a3b8;
        margin: 0;
      }
      .crt-court-hint--google {
        color: #005caf;
        font-weight: 600;
      }
      .crt-court-preview {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-radius: 0.875rem;
        border: 1px solid #e8edf3;
      }
      .crt-court-preview-addr {
        font-size: 0.75rem;
        color: #64748b;
        line-height: 1.4;
      }

      /* ─── submit button ───────────────────────── */
      .crt-btn-submit.cfb-btn {
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
      .crt-btn-submit {
        display: flex;
        width: 100%;
        padding: 1.0625rem 1.5rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #005caf, #1a3a8a);
        color: #fff;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        border: none;
        box-shadow: 0 8px 28px rgba(0, 92, 175, 0.4);
        cursor: pointer;
        transition:
          opacity 0.2s,
          transform 0.15s;
        margin-top: 1rem;
      }
      .crt-btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .crt-btn-submit:not(:disabled):active {
        transform: scale(0.98);
      }
      .crt-btn-submit-sm {
        padding: 0.875rem 1.25rem;
        font-size: 0.9375rem;
        margin-top: 0;
      }
      .crt-btn-submit-sticky {
        width: auto !important;
        flex-shrink: 0;
        min-width: 7.5rem;
      }
      .crt-btn-submit-dsk {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 1rem 2rem;
        border-radius: 999px;
        background: #1a9be8;
        box-shadow: none;
        font-size: 0.9375rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .crt-btn-submit-dsk:hover {
        opacity: 0.92;
      }

      /* ─── sticky bar (mobile) ─────────────────── */
      .crt-sticky {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
        padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
        background: #fff;
        border-top: 1px solid #e8edf3;
        box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.08);
      }
      .crt-sticky-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.75rem;
        max-width: 32rem;
        margin: 0 auto;
      }
      .crt-sticky-info {
        min-width: 0;
        overflow: hidden;
      }
      .crt-sticky-line {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .crt-sticky-line-sub {
        font-size: 0.6875rem;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 0.125rem;
      }
      .crt-sticky-count {
        font-size: 0.8125rem;
        font-weight: 800;
        color: #005caf;
        flex-shrink: 0;
      }
      .crt-sticky-sep {
        color: #cbd5e1;
        font-size: 0.75rem;
        flex-shrink: 0;
      }
      .crt-sticky-skill {
        font-size: 0.625rem;
        font-weight: 800;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        flex-shrink: 0;
        max-width: 5.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .crt-mobile-spacer {
        height: calc(5.5rem + env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
      }

      /* ─── desktop info panel (THEO) ───────────── */
      .crt-dsk-panel {
        max-width: 54rem;
        margin: 2.5rem auto 0;
        padding: 0 1.5rem;
      }
      .crt-dsk-panel-inner {
        width: 100%;
        background: #fff;
        border: 1px solid #b8d4f0;
        border-radius: 0.75rem;
        padding: 2.5rem 2.75rem 2.25rem;
      }
      .crt-dsk-panel-title {
        text-align: center;
        font-size: 1.125rem;
        font-weight: 700;
        color: #1a9be8;
        margin: 0 0 0.5rem;
      }
      .crt-dsk-panel-lead {
        text-align: center;
        font-size: 0.8125rem;
        color: #6b7280;
        margin: 0 0 2rem;
        line-height: 1.6;
      }
      .crt-dsk-panel-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
        margin-bottom: 2rem;
      }
      .crt-dsk-panel-box {
        border: 1px solid #b8d4f0;
        border-radius: 0.5rem;
        padding: 1.5rem 1.25rem;
        text-align: center;
      }
      .crt-dsk-panel-box-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.75rem;
      }
      .crt-dsk-panel-highlight {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1a9be8;
        margin: 0 0 0.5rem;
      }
      .crt-dsk-panel-highlight em {
        font-style: normal;
        background: linear-gradient(transparent 58%, #fef08a 58%);
      }
      .crt-dsk-panel-sep {
        color: #9ca3af;
        margin: 0 0.25rem;
      }
      .crt-dsk-panel-fee {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a9be8;
        margin: 0 0 0.5rem;
        line-height: 1.2;
      }
      .crt-dsk-panel-fee em {
        font-style: normal;
        background: linear-gradient(transparent 58%, #fef08a 58%);
      }
      .crt-dsk-panel-meta {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0.125rem 0 0;
        line-height: 1.5;
      }
      .crt-dsk-panel-meta--muted {
        color: #9ca3af;
      }
      .crt-dsk-steps {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2.5rem;
        border-top: 1px solid #e5e7eb;
        padding-top: 2rem;
      }
      .crt-dsk-step-heading {
        font-size: 0.875rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1.25rem;
      }
      .crt-dsk-step-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 1.125rem;
      }
      .crt-dsk-step-list li {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        font-size: 0.8125rem;
        color: #4b5563;
        line-height: 1.5;
      }
      .crt-dsk-step-icon {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 999px;
        background: #eef6fc;
        color: #1a9be8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .crt-dsk-tips {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .crt-dsk-tips li {
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.6;
        padding-left: 0.875rem;
        position: relative;
      }
      .crt-dsk-tips li::before {
        content: "·";
        position: absolute;
        left: 0;
        color: #1a9be8;
        font-weight: 900;
      }

      /* ─── datetime drawer ─────────────────────── */
      .crt-drawer-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(15, 23, 42, 0.5);
        display: flex;
        align-items: flex-end;
      }
      .crt-drawer {
        width: 100%;
        background: #fff;
        border-radius: 1.5rem 1.5rem 0 0;
        padding: 1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
      }
      .crt-drawer-handle {
        width: 3rem;
        height: 0.25rem;
        background: #e2e8f0;
        border-radius: 999px;
        margin: 0 auto 1.25rem;
      }
      .crt-drawer-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .crt-drawer-title {
        font-size: 1.0625rem;
        font-weight: 800;
        color: #0f172a;
      }
      .crt-drawer-close {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: #f1f5f9;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #475569;
      }
      .crt-dt-input {
        width: 100%;
        background: #f8fafc;
        border: 1.5px solid #e8edf3;
        border-radius: 1rem;
        padding: 0.875rem 1rem;
        font-size: 1rem;
        color: #0f172a;
        outline: none;
        margin-bottom: 1rem;
      }
      .crt-dt-input:focus {
        border-color: #005caf;
      }
      .crt-drawer-confirm {
        width: 100%;
        padding: 0.9375rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #005caf, #1a3a8a);
        color: #fff;
        font-size: 1rem;
        font-weight: 800;
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0, 92, 175, 0.35);
      }
    `}</style>
  );
}
