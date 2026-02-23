# 🎯 KULLANICI SENARYOLARI - Test Plan

## 📊 TEMEL KULLANICI ARAMA TÜRLERİ

### 1️⃣ **Basit Kategori Araması**
```
Query: "koşu ayakkabısı"
Beklenti: Koşu kategorisindeki ayakkabılar
Başarı Kriteri: İlk 4 ürün koşu ayakkabısı olmalı
```

### 2️⃣ **Marka + Kategori**
```
Query: "nike koşu ayakkabısı"
Beklenti: Sadece Nike markası
Başarı Kriteri: 4 ürün de Nike olmalı
```

### 3️⃣ **Beden/Numara Filtresi**
```
Query: "42 numara erkek ayakkabı"
Beklenti: 42 numara erkek ayakkabıları
Başarı Kriteri: Hepsi 42 numara olmalı
```

### 4️⃣ **Renk + Kategori**
```
Query: "siyah spor ayakkabı"
Beklenti: Siyah renkli spor ayakkabılar
Başarı Kriteri: Çoğunluk siyah renkte olmalı
```

### 5️⃣ **Çoklu Attribute**
```
Query: "su geçirmez kırmızı 40 numara koşu ayakkabısı"
Beklenti: Tüm kriterleri karşılayan ürünler
Başarı Kriteri: En az 2 ürün tüm kriterleri sağlamalı
```

### 6️⃣ **Belirsiz/Genel Sorgular**
```
Query: "yürüyüş için rahat"
Beklenti: Yürüyüş ayakkabıları
Başarı Kriteri: İlgili kategoriden ürünler
```

### 7️⃣ **SKU/Ürün Kodu**
```
Query: "SK2520052-1602"
Beklenti: Exact product match
Başarı Kriteri: İlk sırada exact match
```

### 8️⃣ **Follow-up Sorular**
```
Query 1: "koşu ayakkabısı"
Query 2: "evet lütfen"
Beklenti: Context-aware, farklı ürünler
Başarı Kriteri: 8 farklı ürün (4+4)
```

### 9️⃣ **Fiyat Aralığı**
```
Query: "100 tl altında ayakkabı"
Beklenti: Fiyat filtrelemesi
Başarı Kriteri: Hepsi 100 TL altında
```

### 🔟 **Gender Targeting**
```
Query: "erkek koşu ayakkabısı"
Beklenti: Sadece erkek ürünleri
Başarı Kriteri: Gender = Male veya Unisex
```

## 🚨 EDGE CASES (Hata Senaryoları)

### ❌ Boş Sonuçlar
```
Query: "pembe astronot botu 99 numara"
Beklenti: Alternatif öneriler veya "bulunamadı"
KPI: %0 boş yanıt (her zaman bir öneri yapmalı)
```

### ❌ Alakasız Sorgular
```
Query: "bugün hava nasıl"
Beklenti: Kibarca reddet
KPI: %100 irrelevant detection
```

### ❌ Yazım Hataları
```
Query: "kosu ayakabisi" (Türkçe karaktersiz)
Beklenti: Yine de doğru sonuç
KPI: %90+ accuracy
```

### ❌ Çok Dar Filtre
```
Query: "su geçirmez kırmızı 47.5 numara"
Beklenti: Kısmi match veya alternatifler
KPI: En az 2 öneri
```

## 📈 BAŞARI METRİKLERİ

| Metrik | Hedef | Ölçüm Yöntemi |
|--------|-------|---------------|
| **Relevance@4** | >90% | İlk 4 üründen kaçı gerçekten ilgili? |
| **Diversity** | >3 marka | 4 üründe kaç farklı marka? |
| **Response Time** | <500ms | Search latency |
| **Zero Results Rate** | <5% | Boş sonuç yüzdesi |
| **User Click Rate** | >40% | İlk 4 üründen birine tıklama |

## 🎯 TEST EDİLECEK SORGULAR (Gerçek Kullanıcı Davranışı)

```javascript
const testQueries = [
  // Basit aramalar
  "koşu ayakkabısı",
  "spor ayakkabı",
  "bot",
  "sandalet",
  
  // Marka odaklı
  "adidas ayakkabı",
  "nike koşu",
  "puma spor",
  
  // Beden/numara
  "40 numara",
  "42 numara erkek",
  "28 numara çocuk",
  
  // Renk
  "siyah ayakkabı",
  "beyaz spor",
  "kırmızı bot",
  
  // Kombinasyonlar
  "nike 42 numara",
  "siyah koşu ayakkabısı 40",
  "çocuk spor ayakkabı 28",
  
  // Doğal dil
  "koşu için ayakkabı arıyorum",
  "yürüyüş için rahat ayakkabı",
  "spor salonuna gidiyorum",
  
  // Follow-ups
  "evet lütfen",
  "başka var mı",
  "erkek için",
  "daha ucuz",
  
  // Edge cases
  "kosu ayakabisi", // Türkçe karakter yok
  "ayakabi", // Kısaltma
  "SK2520052", // SKU
];
```

---

**SONRAKI ADIM:** Bu senaryoları otomatik test scripti ile çalıştır ve sonuçları analiz et!
