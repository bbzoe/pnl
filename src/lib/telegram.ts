/**
 * Telegram Mini-App SDK Wrapper
 * 
 * This module provides a safe wrapper around Telegram WebApp SDK.
 * It works in both TMA and regular web/PWA modes:
 * - In TMA: Full SDK functionality (haptic, theme sync, etc.)
 * - In Web: No-op fallbacks, app works normally
 */

import { writable, derived, type Readable } from 'svelte/store';

// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

// Check if running inside Telegram Mini-App
const checkIsTMA = (): boolean => {
  if (typeof window === 'undefined') return false;
  const tg = window.Telegram?.WebApp;
  // initData is empty string when not in TMA context
  return !!(tg && tg.initData && tg.initData !== '');
};

// Get WebApp instance safely
const getWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
};

// Writable store for TMA detection (can be updated after hydration)
const isTMAStore = writable<boolean>(false);

// Initialize on client side
if (typeof window !== 'undefined') {
  // Small delay to ensure Telegram script is loaded
  setTimeout(() => {
    const detected = checkIsTMA();
    isTMAStore.set(detected);
    
    if (detected) {
      const webApp = getWebApp();
      if (webApp) {
        // Tell Telegram the app is ready
        webApp.ready();
        // Expand to full height
        webApp.expand();
      }
    }
  }, 0);
}

// Export readable store
export const isTMA: Readable<boolean> = { subscribe: isTMAStore.subscribe };

// Theme from Telegram
export const telegramTheme = derived(isTMA, ($isTMA) => {
  if (!$isTMA) return null;
  const webApp = getWebApp();
  return webApp?.colorScheme || null;
});

// Theme params from Telegram
export const telegramThemeParams = derived(isTMA, ($isTMA) => {
  if (!$isTMA) return null;
  const webApp = getWebApp();
  return webApp?.themeParams || null;
});

// Haptic feedback helpers (no-op in web mode)
export const haptic = {
  /**
   * Trigger impact haptic feedback
   * @param style - 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
   */
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      try {
        webApp.HapticFeedback.impactOccurred(style);
      } catch (e) {
        // Silently fail if haptic not supported
      }
    }
  },
  
  /**
   * Trigger notification haptic feedback
   * @param type - 'error' | 'success' | 'warning'
   */
  notification: (type: 'error' | 'success' | 'warning') => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      try {
        webApp.HapticFeedback.notificationOccurred(type);
      } catch (e) {
        // Silently fail if haptic not supported
      }
    }
  },
  
  /**
   * Trigger selection change haptic feedback
   */
  selection: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      try {
        webApp.HapticFeedback.selectionChanged();
      } catch (e) {
        // Silently fail if haptic not supported
      }
    }
  }
};

// Back Button helpers
export const backButton = {
  show: (callback: () => void) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.BackButton.onClick(callback);
      webApp.BackButton.show();
    }
  },
  
  hide: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.BackButton.hide();
    }
  },
  
  onClick: (callback: () => void) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.BackButton.onClick(callback);
    }
  },
  
  offClick: (callback: () => void) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.BackButton.offClick(callback);
    }
  }
};

// Main Button helpers
export const mainButton = {
  show: (text: string, callback: () => void) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(callback);
      webApp.MainButton.show();
    }
  },
  
  hide: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.MainButton.hide();
    }
  },
  
  setText: (text: string) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.MainButton.setText(text);
    }
  },
  
  showProgress: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.MainButton.showProgress();
    }
  },
  
  hideProgress: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.MainButton.hideProgress();
    }
  }
};

// Utility functions
export const telegram = {
  /**
   * Close the Mini-App
   */
  close: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.close();
    }
  },
  
  /**
   * Expand the Mini-App to full height
   */
  expand: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      webApp.expand();
    }
  },
  
  /**
   * Get user data from Telegram
   */
  getUser: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      return webApp.initDataUnsafe.user || null;
    }
    return null;
  },
  
  /**
   * Get platform info
   */
  getPlatform: () => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      return webApp.platform;
    }
    return 'web';
  },
  
  /**
   * Set header color
   */
  setHeaderColor: (color: string) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      try {
        webApp.setHeaderColor(color);
      } catch (e) {
        // Some colors might not be supported
      }
    }
  },
  
  /**
   * Set background color
   */
  setBackgroundColor: (color: string) => {
    const webApp = getWebApp();
    if (webApp && checkIsTMA()) {
      try {
        webApp.setBackgroundColor(color);
      } catch (e) {
        // Some colors might not be supported
      }
    }
  }
};

