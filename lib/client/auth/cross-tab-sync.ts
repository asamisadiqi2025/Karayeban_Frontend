import {
  clearAuth,
  clearLoggedOutFlag,
  hasLoggedOutInOtherTab,
} from "./token-storage";

const REFRESH_TOKEN_KEY = "karayehban_refresh_token";

let onLogoutCallback: (() => void) | null = null;

function handleStorageEvent(event: StorageEvent) {
  if (event.key === REFRESH_TOKEN_KEY && !event.newValue) {
    clearAuth();
    onLogoutCallback?.();
  }
}

export function initCrossTabSync(onLogout: () => void) {
  onLogoutCallback = onLogout;

  window.addEventListener("storage", handleStorageEvent);

  // اگر قبلاً در تب دیگری خروج انجام شده، همین الان اعمال کن
  if (hasLoggedOutInOtherTab()) {
    clearLoggedOutFlag();
    onLogout();
  }
}

export function destroyCrossTabSync() {
  window.removeEventListener("storage", handleStorageEvent);
  onLogoutCallback = null;
}
