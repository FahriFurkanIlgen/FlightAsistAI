# 🚀 Neo4j GraphDB Hızlı Başlangıç

## 1️⃣ Docker ile Neo4j Başlat (1 dk)

```bash
docker run -d \
  --name neo4j-flights \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  neo4j:latest
```

Neo4j Browser: http://localhost:7474
- Username: `neo4j`
- Password: `password123`

---

## 2️⃣ Backend'i Başlat

```bash
npm run dev
```

**Otomatik olarak:**
- ✅ Neo4j'ye bağlanır
- ✅ 50 mock uçuş verisi import edilir
- ✅ İlişkiler oluşturulur (bağlantı uçuşları, alternatifler)

---

## 3️⃣ Verileri Görüntüle

### Neo4j Browser'da:
```cypher
MATCH (f:Flight)-[r]->(n) 
RETURN f, r, n 
LIMIT 50
```

### API'den:
```bash
# İstatistikler
curl http://localhost:3000/api/graph/stats

# Uçuş önerileri
curl http://localhost:3000/api/graph/recommendations/flight-1?limit=5

# Bağlantılı uçuşlar
curl "http://localhost:3000/api/graph/connecting?from=Istanbul&to=Dubai&maxStops=1"

# Manuel sync (gerekirse)
curl -X POST http://localhost:3000/api/graph/sync
```

---

## 📚 Detaylı Dokümantasyon

[NEO4J_SETUP.md](./NEO4J_SETUP.md) dosyasına bakın:
- Farklı kurulum yöntemleri
- Gerçek veri entegrasyonu
- API endpoint detayları
- Sorun giderme
- Production deployment
