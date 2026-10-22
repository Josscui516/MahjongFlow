/** Clipboard API requires HTTPS; local LAN previews also need a selection-based fallback. */
export async function copyRegistrationLink(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* Fall back when clipboard permissions or secure context are unavailable. */ }
  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand("copy");
  } catch { return false; }
  finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }
}
