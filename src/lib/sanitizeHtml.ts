import DOMPurify from "isomorphic-dompurify";

/** Sanitize untrusted HTML before injecting via dangerouslySetInnerHTML. */
export function sanitizeHtml(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "";
  return DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });
}