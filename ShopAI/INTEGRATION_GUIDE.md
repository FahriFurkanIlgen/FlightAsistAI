# 🚀 ShopAsist AI Widget Entegrasyon Rehberi

ShopAsist AI widget'ını e-ticaret sitenize **2 dakikada** entegre edin.

## 🛡️ Shadow DOM ile Tam İzolasyon

Widget, **Shadow DOM** teknolojisi kullanarak müşteri sitenizden tamamen izole çalışır:
- ✅ Sitenizin CSS'i widget'ı **etkilemez**
- ✅ Widget'ın CSS'i sitenizi **etkilemez**
- ✅ JavaScript çakışması **yaşanmaz**
- ✅ Sitenizde hangi framework kullanırsanız kullanın (React, Vue, Angular, vb.) **sorunsuz çalışır**

Shadow DOM sayesinde widget, sitenizin bir parçası gibi görünür ama tamamen bağımsız çalışır!

## 📦 Yöntem 1: Widget Loader (Önerilen)

En basit entegrasyon yöntemi. Tek bir script tag ile widget otomatik olarak sayfanıza eklenir.

### Adım 1: Script'i Sayfaya Ekle

Sitenizin `</body>` tag'inden hemen önce aşağıdaki kodu ekleyin:

```html
<!-- ShopAsist AI Widget -->
<script>
  window.ShopAsistConfig = {
    siteId: 'your-site-id',           // Benzersiz site ID'niz
    apiUrl: 'https://api.shopasist.com', // API URL
    widgetUrl: 'https://cdn.shopasist.com' // Widget CDN URL
  };
</script>
<script src="https://cdn.shopasist.com/widget-loader.js"></script>
```

### Adım 2: Site ID'nizi Alın

1. [ShopAsist Dashboard](https://dashboard.shopasist.com) üzerinden kayıt olun
2. Yeni site ekleyin ve Google Shopping Feed URL'inizi girin
3. Size verilen `siteId`'yi kopyalayın

### ✅ Tamamlandı!

Widget otomatik olarak sayfanıza eklenecek ve sağ alt köşede görünecektir.

---

## 📦 Yöntem 2: Manuel Entegrasyon

Daha fazla kontrol istiyorsanız widget HTML'ini manuel olarak ekleyebilirsiniz.

### Adım 1: CSS Dosyasını Ekle

```html
<head>
  <link rel="stylesheet" href="https://cdn.shopasist.com/widget.css">
  <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
```

### Adım 2: Widget HTML'i Ekle

```html
<body>
  <!-- Sitenizin içeriği -->
  
  <!-- ShopAsist Widget -->
  <div id="chat-widget" class="chat-widget">
    <div id="chat-toggle" class="chat-toggle">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <div id="chat-window" class="chat-window">
      <!-- Widget içeriği otomatik yüklenir -->
    </div>
  </div>

  <script>
    window.ShopAsistConfig = {
      siteId: 'your-site-id',
      apiUrl: 'https://api.shopasist.com'
    };
  </script>
  <script src="https://cdn.shopasist.com/widget.js"></script>
</body>
```

---

## ⚙️ Yapılandırma Seçenekleri

`ShopAsistConfig` objesi ile widget'ı özelleştirebilirsiniz:

```javascript
window.ShopAsistConfig = {
  // Zorunlu
  siteId: 'your-site-id',
  apiUrl: 'https://api.shopasist.com',
  
  // Opsiyonel
  widgetUrl: 'https://cdn.shopasist.com', // Widget dosyalarının URL'i
  position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor: '#022d56', // Ana renk
  secondaryColor: '#0ea5e9', // İkincil renk
  brandLogo: 'https://yoursite.com/logo.png', // Logo URL
  siteName: 'Your Store', // Site adı
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
  welcomeSubtext: 'Ürün önerileri ve destek için hazırım.',
  privacyPolicyUrl: 'https://yoursite.com/privacy', // Gizlilik politikası URL
  categories: [ // Hızlı kategori butonları
    { label: '👟 Ayakkabı', keywords: ['shoes', 'footwear'] },
    { label: '👕 Giyim', keywords: ['clothing', 'apparel'] },
    { label: '⚽ Spor', keywords: ['sports', 'athletic'] }
  ]
};
```

---

## 🎨 Özelleştirme

### Renkleri Değiştirme

Widget'ın renklerini markanıza uygun şekilde değiştirebilirsiniz:

```javascript
window.ShopAsistConfig = {
  siteId: 'your-site-id',
  apiUrl: 'https://api.shopasist.com',
  primaryColor: '#1a56db',     // Buton ve başlık rengi
  secondaryColor: '#10b981'    // Vurgu rengi
};
```

### Logo Ekleme

Kendi logonuzu widget'a ekleyebilirsiniz:

```javascript
window.ShopAsistConfig = {
  siteId: 'your-site-id',
  apiUrl: 'https://api.shopasist.com',
  brandLogo: 'https://yoursite.com/logo.png',
  siteName: 'YourBrand'
};
```

### Kategori Butonları

Müşterilerinizin hızlı erişim yapabileceği kategori butonları ekleyin:

```javascript
window.ShopAsistConfig = {
  siteId: 'your-site-id',
  apiUrl: 'https://api.shopasist.com',
  categories: [
    { label: '👟 Spor Ayakkabı', keywords: ['running', 'sports', 'sneakers'] },
    { label: '👞 Günlük Ayakkabı', keywords: ['casual', 'lifestyle'] },
    { label: '🏃 Koşu', keywords: ['running', 'trail', 'marathon'] },
    { label: '🎿 Outdoor', keywords: ['outdoor', 'hiking', 'trail'] }
  ]
};
```

---

## 🔧 Local Development Test

Widget'ı kendi localinizde test etmek için:

### 1. Backend'i Başlat

```bash
npm run dev:backend
# Backend: http://localhost:3000
```

### 2. Frontend'i Başlat

```bash
npm run dev:frontend
# Frontend: http://localhost:3001
```

### 3. Demo Sayfayı Aç

```
http://localhost:3001/embed-demo.html
```

Bu sayfa gerçek bir e-ticaret sitesini simüle eder ve widget'ın nasıl çalıştığını gösterir.

---

## 📱 Responsive Davranış

Widget otomatik olarak mobil cihazlara uyum sağlar:

- **Desktop**: Sağ alt köşede popup olarak açılır
- **Mobil**: Tam ekran olarak açılır
- Otomatik responsive tasarım

---

## 🧪 Shadow DOM Testi

Widget'ın CSS izolasyonunu test etmek için:

```html
<!-- Test sayfanıza agresif CSS ekleyin -->
<style>
  * { margin: 50px !important; border: 5px solid red !important; }
</style>

<!-- Widget yine de normal görünecektir -->
```

Shadow DOM sayesinde widget sitenizin hiçbir stilinden etkilenmez. Bu, farklı platformlarda (Shopify, WooCommerce, custom vb.) sorunsuz çalışmasını garanti eder.

---

## 🔒 Güvenlik

- Widget CORS korumalıdır ve sadece kayıtlı domainlerden çalışır
- API anahtarları backend'de saklanır, frontend'de görünmez
- XSS koruması aktiftir

---

## 🐛 Sorun Giderme

### Widget Görünmüyor

1. Browser console'u kontrol edin
2. `ShopAsistConfig` doğru tanımlandığından emin olun
3. API URL'inin doğru olduğunu kontrol edin
4. Site ID'nin geçerli olduğundan emin olun

### API Bağlantı Hatası

```javascript
// Console'da şunu görüyorsanız:
// "Failed to fetch config"

// Kontrol edin:
1. Backend çalışıyor mu? http://localhost:3000/health
2. CORS ayarları doğru mu?
3. API URL doğru mu?
```

### CSS Çakışması

Widget CSS'i izole edilmiştir ancak eğer sorun yaşıyorsanız:

```css
/* Kendi CSS'inizde widget'ı override edebilirsiniz */
.chat-widget {
  z-index: 99999 !important;
}
```

---

## 📞 Destek

- **Dokümantasyon**: https://docs.shopasist.com
- **Dashboard**: https://dashboard.shopasist.com
- **E-posta**: support@shopasist.com
- **Discord**: https://discord.gg/shopasist

---

## 🚀 Sonraki Adımlar

1. ✅ Widget'ı sitenize entegre edin
2. 📊 Dashboard'dan performansı takip edin
3. 🎨 Renkleri ve mesajları özelleştirin
4. 📈 Conversion oranlarınızı izleyin

**Kolay gelsin! 🎉**
