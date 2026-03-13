import type { KeyboardEvent } from "react";

const ALLOWED_KEYS = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];

export function numericInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (
    !/[0-9.,]/.test(e.key) &&
    !ALLOWED_KEYS.includes(e.key) &&
    !e.ctrlKey &&
    !e.metaKey
  ) {
    e.preventDefault();
  }
}

export function parseNumericInput(value: string, max?: number): number {
  const num = Number(value.replace(/[^0-9.,]/g, "").replace(",", "."));
  const safe = isNaN(num) ? 0 : num;
  return max !== undefined ? Math.min(safe, max) : safe;
}
