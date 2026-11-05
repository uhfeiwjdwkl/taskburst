import * as React from "react";

import { cn } from "@/lib/utils";

const baseClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type DateKind = "date" | "time" | "datetime-local";

function wantsTypedEntry(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const settings = JSON.parse(localStorage.getItem("appSettings") || "{}");
    if (settings.typedDateTimeOnMobile === false) return false;
  } catch { /* default on */ }
  // Phones only: desktops (even touchscreen ones) keep the native pickers.
  return window.innerWidth < 768 && !!window.matchMedia?.("(pointer: coarse)").matches;
}

/** Native value (YYYY-MM-DD / HH:mm / YYYY-MM-DDTHH:mm) -> typed display (DD/MM/YYYY HH:MM). */
export function toTypedDisplay(kind: DateKind, value: string): string {
  if (!value) return "";
  const [datePart, timePart] = kind === "time" ? ["", value] : value.split("T");
  const date = datePart ? (() => { const [y, m, d] = datePart.split("-"); return `${d}/${m}/${y}`; })() : "";
  const time = (timePart || "").slice(0, 5);
  if (kind === "date") return date;
  if (kind === "time") return time;
  return time ? `${date} ${time}` : date;
}

/** Auto-insert separators while typing digits. */
export function formatTypedDigits(kind: DateKind, raw: string): string {
  const max = kind === "date" ? 8 : kind === "time" ? 4 : 12;
  const digits = raw.replace(/\D/g, "").slice(0, max);
  const parts = kind === "time" ? [[0, 2, ""], [2, 4, ":"]] : [[0, 2, ""], [2, 4, "/"], [4, 8, "/"], [8, 10, " "], [10, 12, ":"]];
  let out = "";
  for (const [start, end, sep] of parts as [number, number, string][]) {
    const chunk = digits.slice(start, end);
    if (!chunk) break;
    out += sep + chunk;
  }
  return out;
}

/** Typed display -> native value, or null while incomplete/invalid. */
export function parseTypedValue(kind: DateKind, text: string): string | null {
  const digits = text.replace(/\D/g, "");
  const time = (h: string, m: string) => (Number(h) < 24 && Number(m) < 60 ? `${h}:${m}` : null);
  if (kind === "time") return digits.length === 4 ? time(digits.slice(0, 2), digits.slice(2, 4)) : null;
  if (digits.length < 8) return null;
  const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
  const check = new Date(Number(y), Number(m) - 1, Number(d));
  if (check.getFullYear() !== Number(y) || check.getMonth() !== Number(m) - 1 || check.getDate() !== Number(d)) return null;
  const date = `${y}-${m}-${d}`;
  if (kind === "date") return digits.length === 8 ? date : null;
  if (digits.length !== 12) return null;
  const t = time(digits.slice(8, 10), digits.slice(10, 12));
  return t ? `${date}T${t}` : null;
}

const TypedDateInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { kind: DateKind }>(
  ({ kind, className, value, defaultValue, onChange, min, max, step, ...props }, ref) => {
    const external = String(value ?? defaultValue ?? "");
    const [text, setText] = React.useState(() => toTypedDisplay(kind, external));
    const lastEmitted = React.useRef(external);
    React.useEffect(() => {
      if (external !== lastEmitted.current) {
        lastEmitted.current = external;
        setText(toTypedDisplay(kind, external));
      }
    }, [external, kind]);
    const emit = (next: string, target: HTMLInputElement) => {
      lastEmitted.current = next;
      onChange?.({ target: { ...target, value: next, name: target.name, id: target.id }, currentTarget: { ...target, value: next } } as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    const placeholder = kind === "date" ? "DD/MM/YYYY" : kind === "time" ? "HH:MM" : "DD/MM/YYYY HH:MM";
    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={props.placeholder || placeholder}
        className={cn(baseClass, className)}
        value={text}
        onChange={(event) => {
          const formatted = formatTypedDigits(kind, event.target.value);
          setText(formatted);
          if (!formatted) { emit("", event.target); return; }
          const parsed = parseTypedValue(kind, formatted);
          if (parsed) emit(parsed, event.target);
        }}
      />
    );
  },
);
TypedDateInput.displayName = "TypedDateInput";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [typed] = React.useState(() => (type === "date" || type === "time" || type === "datetime-local") && wantsTypedEntry());
    if (typed) return <TypedDateInput ref={ref} kind={type as DateKind} className={className} {...props} />;
    return (
      <input
        type={type}
        className={cn(baseClass, className)}
        ref={ref}
        {...props}
        onClick={(event) => {
          props.onClick?.(event);
          const el = event.currentTarget;
          if ((type === "date" || type === "time" || type === "datetime-local") && !el.readOnly && !el.disabled) {
            try { el.showPicker?.(); } catch { /* not allowed in this context */ }
          }
        }}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
