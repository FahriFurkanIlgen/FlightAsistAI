/**
 * i18n (Internationalization) Utility
 * Detects language from URL and loads appropriate translations
 */

class I18n {
  constructor() {
    this.currentLanguage = 'tr';
    this.translations = {};
    this.supportedLanguages = ['tr', 'en', 'de'];
    this.init();
  }

  /**
   * Initialize i18n system
   */
  async init() {
    // Detect language from URL or localStorage
    this.currentLanguage = this.detectLanguage();
    
    // Load translations
    await this.loadTranslations(this.currentLanguage);
    
    console.log(`[i18n] Language set to: ${this.currentLanguage}`);
  }

  /**
   * Detect language from URL pattern
   * Examples:
   * - https://www.sunexpress.com/en-GB/ -> en
   * - https://www.sunexpress.com/tr-tr/ -> tr
   * - https://www.sunexpress.com/de-de/ -> de
   */
  detectLanguage() {
    // Try to get from URL path
    const urlMatch = window.location.pathname.match(/\/(en|tr|de)(-[A-Z]{2})?\//i);
    if (urlMatch) {
      const lang = urlMatch[1].toLowerCase();
      if (this.supportedLanguages.includes(lang)) {
        localStorage.setItem('flightai_language', lang);
        return lang;
      }
    }

    // Try to get from URL query parameter (?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && this.supportedLanguages.includes(langParam)) {
      localStorage.setItem('flightai_language', langParam);
      return langParam;
    }

    // Try to get from localStorage
    const savedLang = localStorage.getItem('flightai_language');
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      return savedLang;
    }

    // Try to get from browser language
    const browserLang = navigator.language.split('-')[0];
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // Default to Turkish
    return 'tr';
  }

  /**
   * Load translation file for a language
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      this.translations = await response.json();
      return this.translations;
    } catch (error) {
      console.error(`[i18n] Error loading translations:`, error);
      // Fallback to Turkish if loading fails
      if (lang !== 'tr') {
        return this.loadTranslations('tr');
      }
      return {};
    }
  }

  /**
   * Get translation by key path (e.g., 'welcome.title')
   */
  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`[i18n] Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value;
  }

  /**
   * Change language dynamically
   */
  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.error(`[i18n] Unsupported language: ${lang}`);
      return;
    }

    this.currentLanguage = lang;
    localStorage.setItem('flightai_language', lang);
    await this.loadTranslations(lang);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get language name in native form
   */
  getLanguageName(lang = this.currentLanguage) {
    const names = {
      tr: 'Türkçe',
      en: 'English',
      de: 'Deutsch'
    };
    return names[lang] || lang;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang)
    }));
  }
}

// Create singleton instance
const i18n = new I18n();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
