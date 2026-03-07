# Neo4j GraphDB Kurulum ve Kullanım Kılavuzu

## 📦 1. Neo4j Kurulumu

### Docker ile (Önerilen) ⚡

```bash
# Neo4j container'ı çalıştır
docker run -d \
  --name neo4j-flights \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  -v neo4j-data:/data \
  neo4j:latest

# Container'ın çalıştığını kontrol et
docker ps
```

**Neo4j Browser'a erişim:**
- URL: http://localhost:7474
- Username: `neo4j`
- Password: `password123`

### Neo4j Desktop ile

1. [Neo4j Desktop](https://neo4j.com/download/) indir
2. Uygulamayı aç ve yeni bir proje oluştur
3. "Add Database" → "Create a Local Database"
4. Database adı: `FlightAsistAI`
5. Password: `password123` (veya istediğiniz şifre)
6. "Create" ardından "Start" butonuna tıkla

---

## ⚙️ 2. Yapılandırma

`.env` dosyasında Neo4j ayarlarını kontrol edin:

```env
# Neo4j GraphDB Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NEO4J_ENABLED=true
```

**Önemli:** Eğer farklı bir şifre kullandıysanız, `NEO4J_PASSWORD` değerini güncelleyin.

---

## 🚀 3. Serveri Başlatın

```bash
# Backend'i derle
npm run build:backend

# Development mode'da başlat
npm run dev
```

**Otomatik olarak gerçekleşecekler:**
1. ✅ Neo4j'ye bağlanır
2. ✅ Schema (constraints ve indexes) oluşturur
3. ✅ Mock uçuş verilerini GraphDB'ye import eder
4. ✅ İlişkileri (CONNECTS_TO, SAME_ROUTE, OPERATED_BY) oluşturur

**Console çıktısı:**
```
🔗 Connecting to Neo4j GraphDB...
[GraphService] ✅ Successfully connected to Neo4j
[GraphService] ✅ Schema initialized successfully
📊 GraphDB Stats: 0 flights, 0 relationships
✈️ Flight feeds initialized successfully
🔄 Syncing flights to GraphDB...
[GraphService] ✅ Imported 50 flights successfully
[GraphService] ✅ Route relationships created
[GraphService] ✅ Same-route relationships created
✅ GraphDB sync complete: 50 flights
```

---

## 🔍 4. Verileri Kontrol Edin

### Neo4j Browser'da (http://localhost:7474)

**Tüm uçuşları görüntüle:**
```cypher
MATCH (f:Flight) RETURN f LIMIT 25
```

**İlişkilerle birlikte görüntüle:**
```cypher
MATCH (f:Flight)-[r]->(n) 
RETURN f, r, n 
LIMIT 50
```

**Havayolu bazında grupla:**
```cypher
MATCH (f:Flight)-[:OPERATED_BY]->(a:Airline)
RETURN a.name, count(f) as flightCount
ORDER BY flightCount DESC
```

**Bağlantılı uçuşları bul:**
```cypher
MATCH path = (f1:Flight)-[:CONNECTS_TO]->(f2:Flight)
WHERE f1.departureCity = 'Istanbul' 
  AND f2.arrivalCity = 'Dubai'
RETURN path
LIMIT 10
```

---

## 📊 5. API Endpoints

### Flight Recommendations
```bash
GET http://localhost:3000/api/graph/recommendations/:flightId?limit=5
```

**Örnek:**
```bash
curl http://localhost:3000/api/graph/recommendations/flight-1?limit=5
```

### Connecting Flights
```bash
GET http://localhost:3000/api/graph/connecting?from=Istanbul&to=Dubai&maxStops=1
```

**Örnek:**
```bash
curl "http://localhost:3000/api/graph/connecting?from=Istanbul&to=Dubai&maxStops=1"
```

### Statistics
```bash
GET http://localhost:3000/api/graph/stats
```

---

## 🛠️ 6. Gerçek Verilerle Çalışma

### Mock verileri kaldırıp gerçek API kullanmak için:

**1. `backend/src/services/feedParser.ts` dosyasını güncelleyin:**

```typescript
// Mock yerine gerçek API'den veri çekin
async parseFeed(feedUrl: string): Promise<Flight[]> {
  const response = await fetch(feedUrl);
  const data = await response.json();
  
  // API response'unu Flight tipine dönüştürün
  return data.map(item => ({
    id: item.id,
    flightNumber: item.flightNumber,
    // ... diğer alanlar
  }));
}
```

**2. `.env` dosyasında feed URL'ini güncelleyin:**
```env
FLIGHT_FEED_URL=https://api.sunexpress.com/flights
```

**3. Server'ı yeniden başlatın:**
```bash
npm run dev
```

---

## 🔄 7. Manuel Sync

Koddan manuel olarak sync tetiklemek için:

```typescript
import { graphService } from './services/graphService';
import { cacheService } from './services/cacheService';

// Tüm uçuşları al ve sync et
const flights = cacheService.getAllFlights();
await graphService.importFlights(flights);
```

---

## 🐛 8. Sorun Giderme

### "Failed to connect to Neo4j" hatası
```bash
# Neo4j çalışıyor mu kontrol et
docker ps
# veya
neo4j status

# Neo4j'yi yeniden başlat
docker restart neo4j-flights
```

### "Authentication failed"
- `.env` dosyasındaki şifreyi kontrol edin
- Neo4j'de şifreyi sıfırlayın:
```bash
docker exec -it neo4j-flights cypher-shell
# İçeride:
ALTER USER neo4j SET PASSWORD 'password123';
```

### Veritabanını temizlemek
```cypher
// Neo4j Browser'da çalıştır
MATCH (n) DETACH DELETE n
```

---

## 📚 9. GraphDB Schema

```
Nodes:
├─ Flight (id, flightNumber, price, date, time, etc.)
├─ Airport (code, city, country)
└─ Airline (code, name)

Relationships:
├─ (Flight)-[:DEPARTS_FROM]->(Airport)
├─ (Flight)-[:ARRIVES_AT]->(Airport)
├─ (Flight)-[:OPERATED_BY]->(Airline)
├─ (Flight)-[:CONNECTS_TO {layoverMinutes}]->(Flight)
└─ (Flight)-[:SAME_ROUTE]-(Flight)
```

---

## 🎯 10. Production Deployment

### Docker Compose ile (önerilen)

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  neo4j:
    image: neo4j:latest
    ports:
      - "7687:7687"
      - "7474:7474"
    environment:
      NEO4J_AUTH: neo4j/your_strong_password_here
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
    restart: unless-stopped

volumes:
  neo4j-data:
  neo4j-logs:
```

Başlatmak için:
```bash
docker-compose up -d
```

---

## 📞 Destek

Sorunla karşılaşırsanız:
1. Neo4j loglarını kontrol edin: `docker logs neo4j-flights`
2. Backend loglarını kontrol edin
3. Neo4j Browser'da test sorguları çalıştırın

**Faydalı Linkler:**
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/)
- [Neo4j Docker Image](https://hub.docker.com/_/neo4j)
