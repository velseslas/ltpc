/**
 * LOT 5 — Mobile-friendly form error focus helper.
 *
 * Scrolls the first field flagged as invalid into view and focuses it.
 * Zero business logic — purely UX. Safe to call after any submit failure.
 *
 * Usage:
 *   const onError = () => scrollToFirstError();
 *   form.handleSubmit(onSubmit, onError)
 *
 * Detection order:
 *  1. aria-invalid="true"
 *  2. .border-red-700 / .border-destructive (project convention)
 *  3. [data-invalid="true"]
 */
export function scrollToFirstError(root: HTMLElement | Document = document): void {
  const selectors = [
    '[aria-invalid="true"]',
    '[data-invalid="true"]',
    '.border-red-700',
    '.border-destructive',
  ];
  const candidate = root.querySelector<HTMLElement>(selectors.join(","));
  if (!candidate) return;

  candidate.scrollIntoView({ behavior: "smooth", block: "center" });

  // Focus the nearest interactive element for keyboard/screen-reader users.
  const focusTarget =
    candidate.matches("input, select, textarea, button")
      ? candidate
      : candidate.querySelector<HTMLElement>("input, select, textarea, button, [tabindex]");
  focusTarget?.focus({ preventScroll: true });
}
