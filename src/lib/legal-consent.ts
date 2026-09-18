const LEGAL_CONSENT_KEY = "toothpaste-cv:legal-consent";

export function hasLegalConsent() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(LEGAL_CONSENT_KEY));
}

export function saveLegalConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LEGAL_CONSENT_KEY,
    JSON.stringify({ acceptedAt: new Date().toISOString(), version: 1 })
  );
}
