const configuredUrl = import.meta.env.VITE_APP_URL?.trim();

export function getAppBaseUrl() {
  const currentOrigin = window.location.origin.replace(/\/$/, "");
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // In production, always use the current host to avoid stale preview/deployment URLs.
  if (!isLocalhost) {
    return currentOrigin;
  }

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return currentOrigin;
}