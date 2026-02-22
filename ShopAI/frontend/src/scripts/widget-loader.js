/**
 * ShopAsist AI Widget Loader - Shadow DOM Version
 * Embeddable e-commerce chat widget with complete CSS isolation
 * 
 * Usage:
 * <script>
 *   window.ShopAsistConfig = {
 *     siteId: 'your-site-id',
 *     apiUrl: 'https://api.shopasist.com'
 *   };
 * </script>
 * <script src="https://cdn.shopasist.com/widget-loader.js"></script>
 */

(function() {
  'use strict';

  // Namespace to avoid conflicts
  const ShopAsistWidget = {
    config: window.ShopAsistConfig || {},
    shadowRoot: null,
    
    init: function() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.injectWidget());
      } else {
        this.injectWidget();
      }
    },

    injectWidget: function() {
      // Create Shadow DOM host element
      const hostElement = document.createElement('div');
      hostElement.id = 'shopasist-widget-host';
      document.body.appendChild(hostElement);

      // Attach Shadow DOM (closed for better encapsulation)
      this.shadowRoot = hostElement.attachShadow({ mode: 'open' });

      // Inject styles first
      this.injectStyles();

      // Then inject HTML
      this.injectHTML();

      // Finally load the widget script
      this.loadScript();
    },

    injectStyles: function() {
      // Google Fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&display=swap';
      this.shadowRoot.appendChild(fontLink);

      // Widget CSS - Load Shadow DOM optimized version
      const baseUrl = this.config.widgetUrl || 'http://localhost:3001';
      
      // Load CSS via fetch to inject into Shadow DOM
      fetch(`${baseUrl}/styles/widget-shadow.css`)
        .then(response => response.text())
        .then(css => {
          const style = document.createElement('style');
          style.textContent = css;
          this.shadowRoot.appendChild(style);
        })
        .catch(err => {
          console.error('Failed to load ShopAsist widget styles:', err);
          // Fallback to main.css if shadow DOM version not found
          fetch(`${baseUrl}/styles/main.css`)
            .then(response => response.text())
            .then(css => {
              const style = document.createElement('style');
              // Add :host selector to scope styles properly
              style.textContent = `
                :host {
                  all: initial;
                  display: block;
                }
                ${css}
              `;
              this.shadowRoot.appendChild(style);
            });
        });
    },

    injectHTML: function() {
      // Create widget container
      const widgetHTML = `
        <div id="chat-widget" class="chat-widget">
          <div id="chat-toggle" class="chat-toggle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>

          <div id="chat-window" class="chat-window">
            <div class="chat-header">
              <div class="chat-header-content">
                <img id="chat-logo" class="chat-header-logo" src="" alt="" style="display: none;">
                <h3 id="chat-title">Alışveriş Asistanı</h3>
              </div>
              <button id="chat-close" class="chat-close">&times;</button>
            </div>

            <div class="chat-content">
              <div id="welcome-section" class="welcome-section">
                <h2 id="welcome-message">Merhaba, aradığınızı hızlıca bulalım!</h2>
                <p id="welcome-subtext">Yeni sezon, kombinasyon önerileri ve sipariş desteği.</p>
              </div>

              <div id="category-section" class="category-section">
                <div id="category-buttons" class="category-buttons"></div>
              </div>
              
              <div id="chat-messages" class="chat-messages"></div>
            </div>

            <div class="chat-input-container">
              <textarea 
                id="chat-input" 
                class="chat-input" 
                placeholder="Mesajınızı yazın..."
                autocomplete="off"
                rows="1"
              ></textarea>
              <button id="chat-send" class="chat-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            <div id="privacy-footer" class="privacy-footer">
              Sohbeti başlatarak veya sürdürerek <a href="#" id="privacy-link" target="_blank">Gizlilik Politikamızı</a> kabul ettiğinizi beyan etmiş olursunuz.
              <button class="close-privacy" id="close-privacy">&times;</button>
            </div>

            <div id="branding-footer" class="branding-footer">
              <span id="branding-text">Powered by ShopAsistAI</span>
            </div>
          </div>
        </div>
      `;

      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = widgetHTML;
      
      // Append to Shadow DOM instead of document.body
      this.shadowRoot.appendChild(container.firstElementChild);
    },

    loadScript: function() {
      const baseUrl = this.config.widgetUrl || 'http://localhost:3001';
      
      // Fetch and execute script in context of Shadow DOM
      fetch(`${baseUrl}/scripts/app.js`)
        .then(response => response.text())
        .then(scriptContent => {
          // Wrap script to inject shadowRoot reference
          const wrappedScript = `
            (function(shadowRoot, config) {
              // Make shadowRoot available to the widget
              window.__shopAsistShadowRoot = shadowRoot;
              window.ShopAsistConfig = config;
              
              ${scriptContent}
            })(window.ShopAsistWidget.shadowRoot, window.ShopAsistConfig);
          `;
          
          const script = document.createElement('script');
          script.textContent = wrappedScript;
          document.head.appendChild(script);
        })
        .catch(err => {
          console.error('Failed to load ShopAsist widget script:', err);
        });
    }
  };

  // Auto-initialize
  ShopAsistWidget.init();

  // Expose to window for manual control if needed
  window.ShopAsistWidget = ShopAsistWidget;
})();