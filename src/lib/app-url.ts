const configuredUrl = import.meta.env.VITE_APP_URL?.trim();

export function getAppBaseUrl() {
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return window.location.origin;
}