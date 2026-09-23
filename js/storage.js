/**
 * EventPort UI Customizer - Storage Service
 * chrome.storage.local のラッパー（テスト環境でのlocalStorageフォールバック付き）
 */
window.EP_Storage = {
  /**
   * 設定値を取得する
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const defaults = window.EP_CONFIG.DEFAULT_SETTINGS;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([window.EP_CONFIG.STORAGE_KEYS.SETTINGS], (result) => {
            const saved = result[window.EP_CONFIG.STORAGE_KEYS.SETTINGS] || {};
            resolve({ ...defaults, ...saved });
          });
        });
      } else {
        const raw = localStorage.getItem(window.EP_CONFIG.STORAGE_KEYS.SETTINGS);
        return { ...defaults, ...(raw ? JSON.parse(raw) : {}) };
      }
    } catch (e) {
      console.warn('[EventPort UI] Failed to load settings from storage:', e);
      return { ...defaults };
    }
  },

  /**
   * 設定値を保存する
   * @param {Object} newSettings
   * @returns {Promise<void>}
   */
  async saveSettings(newSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [window.EP_CONFIG.STORAGE_KEYS.SETTINGS]: updated }, resolve);
        });
      } else {
        localStorage.setItem(window.EP_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[EventPort UI] Failed to save settings to storage:', e);
    }
  },

  /**
   * 任意のデータを取得する
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => resolve(result[key]));
        });
      } else {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {
      console.warn(`[EventPort UI] Failed to get ${key}:`, e);
      return null;
    }
  },

  /**
   * 任意のデータを保存する
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve);
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[EventPort UI] Failed to set ${key}:`, e);
    }
  },

  /**
   * 設定変更を監視するリスナーを登録
   * @param {Function} callback (newSettings) => void
   */
  onSettingsChanged(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[window.EP_CONFIG.STORAGE_KEYS.SETTINGS]) {
          callback(changes[window.EP_CONFIG.STORAGE_KEYS.SETTINGS].newValue);
        }
      });
    }
  }
};
