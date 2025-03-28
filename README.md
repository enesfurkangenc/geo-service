## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Database

- pgAdmin paneli http://localhost:5050

- pgAdmin'e giriş yapmak için:
- Email: admin@admin.com
- Şifre: admin

- Host: postgres (docker-compose service name)
- Port: 5432
- Database: geoservice
- Username: postgres
- Password: postgres

## Sistem Özellikleri ve Design Patternler

### Health Check

Sistem bileşenlerinin durumunu sürekli izlemek için Health Check API'leri eklenmiştir. Bu API'ler, sistemin farklı bileşenlerinin sağlık durumunu kontrol eder ve raporlar.

**Health Check Endpointleri:**

- `GET /health`: Tüm sistem bileşenlerinin durumunu kontrol eder
- `GET /health/db`: Sadece veritabanı ve PostGIS durumunu kontrol eder
- `GET /health/storage`: Bellek ve disk kullanımını kontrol eder

**Kontrol Edilen Bileşenler:**

- Veritabanı bağlantısı
- PostGIS uzantısının aktifliği
- Bellek kullanımı
- Disk alanı kullanımı

**Örnek Kullanım:**

```bash
# Tüm sistem durumunu kontrol et
curl http://localhost:3000/health

# Sadece veritabanı durumunu kontrol et
curl http://localhost:3000/health/db

# Bellek ve disk kullanımını kontrol et
curl http://localhost:3000/health/storage
```

**Örnek Yanıt:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "postgis": {
      "status": "up",
      "version": "3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"
    },
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "postgis": {
      "status": "up",
      "version": "3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"
    },
    "memory_heap": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  }
}
```

### Circuit Breaker

Projede servislerin dayanıklılığını artırmak için Circuit Breaker deseni kullanılmaktadır. Bu desen, arka arkaya belirli sayıda hata oluştuğunda servisleri durdurarak sistemin daha fazla yük altında kalmasını önler.

### Retry Service

Geçici hatalar durumunda işlemlerin otomatik olarak yeniden denenmesini sağlar.

### PostGIS Entegrasyonu

Coğrafi verileri işlemek için PostgreSQL'in PostGIS uzantısı kullanılmaktadır

### Mimari Yaklaşım

- **Modüler Tasarım**: Her özellik kendi modülü içinde izole edilmiştir (Areas, Locations vb.)
- **Bağımlılık Enjeksiyonu**: NestJS'in DI sistemi kullanılarak servisler arasında bağlantı sağlanmıştır
- **Repository Pattern**: Veritabanı işlemleri için TypeORM repository pattern kullanılmıştır

## API Kullanım Örnekleri

### Alan (Area) İşlemleri

**Alan Oluşturma**

```bash
curl -X POST http://localhost:3000/areas -H "Content-Type: application/json" -d '{
  "name": "İstanbul Bölgesi",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [[[28.95, 41.01], [28.98, 41.01], [28.98, 41.03], [28.95, 41.03], [28.95, 41.01]]]
  },
  "description": "İstanbul merkez bölgesi"
}'
```

**Tüm Alanları Listeleme (Sayfalama ile)**

```bash
curl "http://localhost:3000/areas?page=1&limit=10"
```

### Konum (Location) İşlemleri

**Konum Bildirimi (Alan İçinde)**

```bash
curl -X POST http://localhost:3000/locations -H "Content-Type: application/json" -d '{
  "userId": "1",
  "latitude": 41.02,
  "longitude": 28.97
}'
```

**Konum Bildirimi (Alan Dışında)**

```bash
curl -X POST http://localhost:3000/locations -H "Content-Type: application/json" -d '{
  "userId": "1",
  "latitude": 41.05,
  "longitude": 28.90
}'
```

**Konum Loglarını Listeleme**

```bash
curl "http://localhost:3000/locations/logs?userId=1&page=1&limit=10"
```

### API Yanıt Örnekleri

**Alan Oluşturma Yanıtı**

```json
{
  "id": 1,
  "name": "İstanbul Bölgesi",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [
      [
        [28.95, 41.01],
        [28.98, 41.01],
        [28.98, 41.03],
        [28.95, 41.03],
        [28.95, 41.01]
      ]
    ]
  },
  "description": "İstanbul merkez bölgesi",
  "createdAt": "2025-03-28T11:46:48.512Z",
  "updatedAt": "2025-03-28T11:46:48.512Z"
}
```

**Alan Listeleme Yanıtı**

```json
{
  "items": [
    {
      "id": 1,
      "name": "İstanbul Bölgesi",
      "coordinates": {
        "type": "Polygon",
        "coordinates": [
          [
            [28.95, 41.01],
            [28.98, 41.01],
            [28.98, 41.03],
            [28.95, 41.03],
            [28.95, 41.01]
          ]
        ]
      },
      "description": "İstanbul merkez bölgesi",
      "createdAt": "2025-03-28T11:46:48.512Z",
      "updatedAt": "2025-03-28T11:46:48.512Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pageCount": 1
  }
}
```

**Konum Bildirimi Yanıtı**

```json
{
  "message": "OK"
}
```

**Konum Logları Yanıtı**

```json
{
  "items": [
    {
      "id": 1,
      "userId": "1",
      "areaId": 1,
      "location": {
        "x": 28.97,
        "y": 41.02
      },
      "entryTime": "2025-03-28T11:46:56.463Z",
      "area": {
        "id": 1,
        "name": "İstanbul Bölgesi",
        "coordinates": {
          "type": "Polygon",
          "coordinates": [
            [
              [28.95, 41.01],
              [28.98, 41.01],
              [28.98, 41.03],
              [28.95, 41.03],
              [28.95, 41.01]
            ]
          ]
        },
        "description": "İstanbul merkez bölgesi",
        "createdAt": "2025-03-28T11:46:48.512Z",
        "updatedAt": "2025-03-28T11:46:48.512Z"
      }
    }
  ],
  "meta": {
    "page": "1",
    "limit": "10",
    "total": 1,
    "pageCount": 1
  }
}
```

## Telemetri ve İzleme

Sistem performansını ve sağlığını izlemek için OpenTelemetry, Prometheus ve Grafana entegrasyonları eklenmiştir.

### OpenTelemetry

OpenTelemetry, dağıtık sistem izleme için açık kaynaklı bir araç setidir. Uygulama içindeki isteklerin ve işlemleri toplar ve takip eder.

### Prometheus

Prometheus, zaman serisi veritabanı ve metrik toplama aracıdır. Uygulamanın performans metriklerini toplar ve depolama, sorgulama ve uyarı için kullanılır.

**Erişim**: [http://localhost:9090](http://localhost:9090)

**Toplanan Metrikler:**

- `http_requests_total`: HTTP istek sayısı (metod, durum kodu ve yola göre)
- `http_request_duration_seconds`: HTTP istek süresi (saniye cinsinden)
- `http_requests_in_progress`: İşlemde olan HTTP istekleri
- `geo_areas_total`: Toplam bölge sayısı
- `geo_locations_total`: Toplam konum kayıt sayısı

**Örnek Sorgular:**

```
# Dakikada istek sayısı
rate(http_requests_total[1m])

# Ortalama yanıt süresi
rate(http_request_duration_seconds_sum[1m]) / rate(http_request_duration_seconds_count[1m])

# Başarısız istekler
sum(rate(http_requests_total{statusCode=~"5.."}[5m]))
```

### Grafana

Grafana, Prometheus metriklerini görselleştirmek için kullanılan bir dashboard aracıdır.

**Erişim**: [http://localhost:3001](http://localhost:3001)

- Kullanıcı adı: `admin`
- Şifre: `admin`

**Dashboard Özellikleri:**

- HTTP İstek Oranı (req/s): Farklı endpoint'lere yapılan isteklerin saniyedeki sayısı
- Ortalama HTTP İstek Süresi: Her endpoint için ortalama yanıt süresi
- İşlenmekte Olan İstekler: Şu anda işlenen istek sayısı
- Toplam Bölge Sayısı: Sistemdeki toplam bölge sayısı
- Toplam Konum Kayıt Sayısı: Sistemdeki toplam konum kaydı sayısı
- HTTP İstek Dağılımı: GET, POST vb. istek türlerinin dağılımı
- HTTP Durum Kodları: 200, 401, 404, 500 vb. durum kodlarının sayısı

### Grafana Dashboard'unu İçe Aktarma

1. Grafana'ya giriş yapın (http://localhost:3001)
2. Sol menüde "+" simgesine tıklayın ve "Import" seçin
3. "Upload JSON file" düğmesine tıklayın
4. Proje kök dizinindeki `grafana-dashboard.json` dosyasını yükleyin
5. "Import" düğmesine tıklayın

### Metrik Endpoint'i

Prometheus'un toplayacağı metriklere doğrudan erişmek için:

```bash
curl http://localhost:3000/metrics
```

Örnek yanıt:

```
# HELP http_requests_total Toplam HTTP istek sayısı
# TYPE http_requests_total counter
http_requests_total{method="GET",statusCode="200",path="/metrics/"} 10
http_requests_total{method="GET",statusCode="200",path="/health/"} 1
http_requests_total{method="GET",statusCode="200",path="/areas/"} 1
http_requests_total{method="POST",statusCode="201",path="/areas/"} 1
http_requests_total{method="POST",statusCode="201",path="/locations/"} 1

# HELP geo_areas_total Toplam bölge sayısı
# TYPE geo_areas_total gauge
geo_areas_total 2

# HELP geo_locations_total Toplam konum kayıt sayısı
# TYPE geo_locations_total gauge
geo_locations_total 4
```
