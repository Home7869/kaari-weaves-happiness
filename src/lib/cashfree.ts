// Lightweight loader for the Cashfree Web Checkout SDK (v3).
// Docs: https://www.cashfree.com/docs/payments/online/web-integration/web-checkout
// Loads sandbox or production script based on env detected from session id prefix is unreliable,
// so we expose `mode` and let caller decide. Production uses "production", else "sandbox".

declare global {
  interface Window {
    Cashfree?: any;
  }
}

let loadingPromise: Promise<any> | null = null;

export function loadCashfree(mode: "sandbox" | "production" = "sandbox"): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.async = true;
    s.onload = () => {
      if (!window.Cashfree) return reject(new Error("Cashfree SDK failed to initialise"));
      try {
        const cf = window.Cashfree({ mode });
        resolve(cf);
      } catch (e) {
        reject(e as Error);
      }
    };
    s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.head.appendChild(s);
  });
  return loadingPromise;
}
