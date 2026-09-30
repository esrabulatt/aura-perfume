# Parfüm REST API — Dokümantasyon

Node.js ve Express ile yazılmış, parfümleri listelemek, aramak, eklemek, güncellemek ve silmek için kullanılan bir REST API.

> **Not:** Veriler bellekte (in-memory) tutulur. Sunucu yeniden başlatıldığında yapılan tüm değişiklikler kaybolur ve başlangıçtaki 8 örnek parfüm geri yüklenir.

---

## İçindekiler

1. [Kurulum ve Çalıştırma](#1-kurulum-ve-çalıştırma)
2. [Genel Bilgiler](#2-genel-bilgiler)
3. [Parfüm Veri Modeli](#3-parfüm-veri-modeli)
4. [Endpoint Özeti](#4-endpoint-özeti)
5. [Endpoint Detayları](#5-endpoint-detayları)
6. [Hata Yönetimi](#6-hata-yönetimi)
7. [HTTP Durum Kodları](#7-http-durum-kodları)
8. [Örnek Senaryo (curl)](#8-örnek-senaryo-curl)
9. [Frontend Bağlantısı](#9-frontend-bağlantısı)

---

## 1. Kurulum ve Çalıştırma

**Gereksinim:** Node.js 18 veya üzeri.

```bash
cd perfume-api
npm install
npm start          # normal çalıştırma
npm run dev        # dosya değişince otomatik yeniden başlatır (node --watch)
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışır. Portu değiştirmek için:

```bash
PORT=4000 npm start
```

---

## 2. Genel Bilgiler

| Özellik | Değer |
|---|---|
| Temel URL | `http://localhost:3000/api` |
| İstek/Yanıt formatı | JSON (`Content-Type: application/json`) |
| Kimlik doğrulama | Yok |
| Karakter seti | UTF-8 (Türkçe karakterler desteklenir) |

### Yanıt yapısı

Başarılı yanıtlar veriyi `data` alanında döner:

```json
{ "data": { ... } }
```

Listeleme yanıtları ek olarak `pagination` bilgisi içerir. Oluşturma/güncelleme işlemlerinde bir `message` alanı da bulunur.

Hatalı yanıtlar her zaman `error` alanında döner (bkz. [Hata Yönetimi](#6-hata-yönetimi)).

---

## 3. Parfüm Veri Modeli

```json
{
  "id": 1,
  "name": "Sauvage",
  "brand": "Dior",
  "gender": "erkek",
  "concentration": "EDT",
  "family": "aromatik",
  "notes": {
    "top": ["bergamot", "biber"],
    "middle": ["lavanta", "sichuan biberi"],
    "base": ["ambroxan", "sedir"]
  },
  "volumeMl": 100,
  "price": 4250,
  "stock": 12,
  "releaseYear": 2015,
  "rating": 4.5,
  "image": "/images/perfumes/dior-sauvage.jpg",
  "hoverImage": "/images/perfumes/dior-sauvage-hover.jpg",
  "variants": [
    { "size": "60ml", "price": 3200 },
    { "size": "100ml", "price": 4250 },
    { "size": "200ml", "price": 6100 }
  ],
  "sizes": [],
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

### Alanlar

| Alan | Tip | Zorunlu | Açıklama / Kural |
|---|---|---|---|
| `id` | integer | — | Sunucu tarafından otomatik atanır. |
| `name` | string | ✅ | Parfüm adı. Boş olamaz. |
| `brand` | string | ✅ | Marka adı. Boş olamaz. |
| `gender` | string | ✅ | `kadın`, `erkek`, `unisex` |
| `concentration` | string | ✅ | `EDC`, `EDT`, `EDP`, `Parfum`, `Extrait` |
| `price` | number | ✅ | Fiyat (TL). `>= 0` |
| `family` | string | ❌ | Koku ailesi: `çiçeksi`, `odunsu`, `oryantal`, `taze`, `fougere`, `şipre`, `gurme`, `aromatik`. Varsayılan: `null` |
| `notes` | object | ❌ | `{ top: string[], middle: string[], base: string[] }`. Eksik katmanlar `[]` olur. |
| `volumeMl` | integer | ❌ | Şişe hacmi (ml). `> 0`. Varsayılan: `null` |
| `stock` | integer | ❌ | Stok adedi. `>= 0`. Varsayılan: `0` |
| `releaseYear` | integer | ❌ | Çıkış yılı. 1700 ile içinde bulunulan yıl arası. Varsayılan: `null` |
| `rating` | number | ❌ | Puan. 0–5 arası. Varsayılan: `null` |
| `image` | string \| null | ❌ | Ürün görseli. `http(s)://` ile başlayan bir URL veya `/` ile başlayan bir yol (ör. `/images/sauvage.jpg`). En fazla 2048 karakter. `null` göndermek görseli kaldırır. Varsayılan: `null` |
| `hoverImage` | string \| null | ❌ | Kartın üzerine gelindiğinde gösterilen ikinci görsel (ör. kutu fotoğrafı). Kuralları `image` ile aynıdır. Varsayılan: `null` |
| `variants` | object[] | ❌ | Boyuta özel fiyatlı seçenekler: `[{ "size": "50ml", "price": 3200 }, { "size": "100ml", "price": 4250 }]`. `size` boş olmayan metin, `price` `>= 0`. Aynı boyut iki kez geçemez (boşluk ve büyük/küçük harf yok sayılır). Varsayılan: `[]` |
| `sizes` | string[] | ❌ | Fiyatı değişmeyen boyutlar: `["50ml", "100ml"]` — hepsi ana `price` ile satılır. `variants` doluysa `variants` geçerlidir. Varsayılan: `[]` |
| `createdAt` | string (ISO 8601) | — | Oluşturulma zamanı (otomatik). |
| `updatedAt` | string (ISO 8601) | — | Son güncelleme zamanı (otomatik). |

> **Benzersizlik kuralı:** Aynı marka altında aynı isimde iki parfüm olamaz (büyük/küçük harf duyarsız). Aksi halde `409 Conflict` döner.

> Model dışındaki alanlar (ör. `id`, `createdAt`, `foo`) istek gövdesinde gönderilse bile yok sayılır.

---

## 4. Endpoint Özeti

| Metot | Yol | Açıklama |
|---|---|---|
| `GET` | `/api` | API bilgisi ve endpoint listesi |
| `GET` | `/api/health` | Sağlık kontrolü |
| `GET` | `/api/meta` | İzin verilen enum değerleri |
| `GET` | `/api/perfumes` | Parfümleri listele (filtre, arama, sıralama, sayfalama) |
| `GET` | `/api/perfumes/:id` | Tek parfüm getir |
| `POST` | `/api/perfumes` | Yeni parfüm ekle |
| `PUT` | `/api/perfumes/:id` | Parfümü tamamen güncelle |
| `PATCH` | `/api/perfumes/:id` | Parfümü kısmen güncelle |
| `PATCH` | `/api/perfumes/:id/stock` | Stok artır/azalt |
| `DELETE` | `/api/perfumes/:id` | Parfüm sil |
| `GET` | `/api/brands` | Markaları ve parfüm sayılarını listele |
| `GET` | `/api/brands/:brand/perfumes` | Bir markanın parfümlerini listele |
| `GET` | `/api/stats` | Envanter istatistikleri |
| `GET` | `/api/finder` | Mevsime ve gün saatine göre parfüm öner |
| `GET` | `/api/quiz/questions` | Koku testi sorularını getir |
| `POST` | `/api/quiz/recommendations` | Test cevaplarına göre en uygun parfümleri puanla |
| `GET` | `/api/carts/:cartId` | Sepeti getir (yoksa boş sepet oluşturur) |
| `POST` | `/api/carts/:cartId/items` | Sepete ürün ekle |
| `PATCH` | `/api/carts/:cartId/items/:perfumeId` | Sepetteki ürünün adedini ayarla |
| `DELETE` | `/api/carts/:cartId/items/:perfumeId` | Ürünü sepetten çıkar |
| `DELETE` | `/api/carts/:cartId` | Sepeti boşalt |
| `POST` | `/api/newsletter` | E-bültene abone ol |
| `POST` | `/api/auth/register` | Üye ol (JWT döner) |
| `POST` | `/api/auth/login` | Giriş yap (JWT döner) |
| `GET` | `/api/auth/me` | Oturumdaki kullanıcı (Bearer token gerekir) |
| `POST` | `/api/auth/logout` | Çıkış yap; token iptal edilir (Bearer token gerekir) |
| `GET` | `/api/favorites` | Kullanıcının favorileri (Bearer token gerekir) |
| `PUT` | `/api/favorites/:perfumeId` | Favorilere ekle (Bearer token gerekir) |
| `DELETE` | `/api/favorites/:perfumeId` | Favorilerden çıkar (Bearer token gerekir) |
| `POST` | `/api/orders` | Sepetten sipariş oluştur (üye: Bearer token · misafir: `email` alanı) |
| `GET` | `/api/orders/my-orders` | Kullanıcının siparişleri (Bearer token gerekir) |
| `GET` | `/api/orders/:orderNumber` | Tek sipariş ve durumu (yalnızca sahibi) |
| `GET` | `/api/orders/track?orderNumber=&email=` | Giriş yapmadan sipariş takibi |
| `POST` | `/api/orders/:orderNumber/advance` | DEMO: sipariş durumunu bir adım ilerletir (sahibi) |
| `POST` | `/api/orders/:orderNumber/cancel` | Siparişi iptal et (kargoya verilmeden önce, sahibi) |
| `POST` | `/api/orders/:orderNumber/returns` | İade talebi oluştur, iade kodu üret (teslimattan sonra 14 gün, sahibi) |
| `POST` | `/api/orders/:orderNumber/returns/:code/cancel` | İade talebini iptal et (sahibi) |
| `GET` | `/api/returns/reasons` | İade nedenleri |
| `GET` | `/api/faq` | Sıkça sorulan sorular |
| `GET` | `/api/legal` | Yasal metinlerin listesi |
| `GET` | `/api/legal/:slug` | Yasal metin (`yasal-uyari`, `gizlilik-politikasi`, `cerez-politikasi`, `satin-alma-hukumleri`) |
| `GET` | `/api/contact/subjects` | İletişim formu konu listesi |
| `POST` | `/api/contact` | İletişim mesajı gönder, talep numarası üret (`TLP-XXXXXX`) |
| `GET` | `/api/finder/options` | Akıllı Koku Bulucu filtre kartları + sayfa altı banner'ları |
| `GET` | `/api/collections` | Editoryal koleksiyonlar (şu an frontend'de kullanılmıyor) |
| `GET` | `/api/collections/:slug` | Tek koleksiyon |
| `GET` | `/api/perfumes/:id/reviews` | Parfümün yorumları + puan özeti (sayfalı) |
| `POST` | `/api/perfumes/:id/reviews` | Yorum ekle |
| `GET` | `/api/perfumes/:id/recommendations` | Benzer parfüm önerileri (kart verisi) |

---

## 5. Endpoint Detayları

### 5.1 `GET /api/health`

Sunucunun çalışıp çalışmadığını kontrol eder.

**Yanıt — `200 OK`**
```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-09-22T09:00:00.000Z"
}
```

---

### 5.2 `GET /api/meta`

`gender`, `concentration` ve `family` alanları için geçerli değerleri döner. Form/arayüz oluştururken kullanışlıdır.

**Yanıt — `200 OK`**
```json
{
  "data": {
    "genders": ["kadın", "erkek", "unisex"],
    "concentrations": ["EDC", "EDT", "EDP", "Parfum", "Extrait"],
    "families": ["çiçeksi", "odunsu", "oryantal", "taze", "fougere", "şipre", "gurme", "aromatik"]
  }
}
```

---

### 5.3 `GET /api/perfumes`

Parfümleri listeler. Tüm sorgu parametreleri isteğe bağlıdır ve birlikte kullanılabilir.

**Sorgu parametreleri**

| Parametre | Tip | Açıklama | Örnek |
|---|---|---|---|
| `q` | string | İsim, marka **veya** notalarda (üst/orta/alt) geçen metni arar (kısmi eşleşme, büyük/küçük harf duyarsız) | `q=opium`, `q=bergamot` |
| `season` | string | Mevsim uyumu: `all`, `summer` (ferah/narenciye/çiçeksi), `winter` (odunsu/baharatlı/amber) | `season=winter` |
| `time` | string | Kullanım zamanı: `all`, `day` (EDT/EDC veya ferah notalar), `night` (EDP/Parfum/Extrait veya yoğun notalar) | `time=night` |
| `category` | string | Editoryal koleksiyon: `all`, `night`, `daily`, `evening`, `fresh` (kurallar için bkz. 5.13b) | `category=night` |
| `scentFamily` | string | Koku ailesi grubu: `all`, `woody` (Odunsu), `floral` (Çiçeksi), `fresh` (Fresh), `spicy` (Baharatlı). Parfüm, kendi koku ailesinin grubuna ve notalarında o gruba ait en az 2 nota varsa o gruba da dahil olur. Grup listesi `GET /api/meta` → `scentFamilies` | `scentFamily=spicy` |
| `brand` | string | Marka (tam eşleşme, büyük/küçük harf duyarsız) | `brand=dior` |
| `gender` | string | `kadın` / `erkek` / `unisex` | `gender=unisex` |
| `concentration` | string | `EDC` / `EDT` / `EDP` / `Parfum` / `Extrait` | `concentration=EDP` |
| `family` | string | Koku ailesi | `family=odunsu` |
| `note` | string | Herhangi bir notada geçen metin (kısmi eşleşme) | `note=vanilya` |
| `minPrice` | number | Minimum fiyat | `minPrice=4000` |
| `maxPrice` | number | Maksimum fiyat | `maxPrice=6000` |
| `minRating` | number | Minimum puan | `minRating=4.5` |
| `inStock` | boolean | `true`: stokta olanlar, `false`: stokta olmayanlar | `inStock=true` |
| `sort` | string | Sıralama alanı: `id`, `name`, `brand`, `price`, `rating`, `releaseYear`, `stock`, `volumeMl`, `createdAt`. Varsayılan: `id` | `sort=price` |
| `order` | string | `asc` veya `desc`. Varsayılan: `asc` | `order=desc` |
| `page` | integer | Sayfa numarası (≥ 1). Varsayılan: `1` | `page=2` |
| `limit` | integer | Sayfa başına kayıt (1–100). Varsayılan: `10` | `limit=5` |

**Örnek istek**
```
GET /api/perfumes?gender=erkek&maxPrice=5000&sort=price&order=desc&limit=2
```

**Yanıt — `200 OK`**
```json
{
  "data": [
    {
      "id": 7,
      "name": "Terre d'Hermès",
      "brand": "Hermès",
      "gender": "erkek",
      "concentration": "EDT",
      "family": "odunsu",
      "notes": { "top": ["portakal", "greyfurt"], "middle": ["biber", "sardunya"], "base": ["vetiver", "sedir"] },
      "volumeMl": 100,
      "price": 4600,
      "stock": 9,
      "releaseYear": 2006,
      "rating": 4.5,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    },
    {
      "id": 1,
      "name": "Sauvage",
      "brand": "Dior",
      "...": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Olası hatalar**
- `400` — Geçersiz `page`, `limit`, `sort`, `order`, `inStock` veya sayısal olmayan `minPrice`/`maxPrice`/`minRating`.

---

### 5.4 `GET /api/perfumes/:id`

ID'ye göre tek bir parfüm döner.

**Örnek istek**
```
GET /api/perfumes/2
```

**Yanıt — `200 OK`**
```json
{
  "data": {
    "id": 2,
    "name": "Chanel No 5",
    "brand": "Chanel",
    "gender": "kadın",
    "concentration": "EDP",
    "family": "çiçeksi",
    "notes": { "top": ["aldehit", "neroli"], "middle": ["yasemin", "gül"], "base": ["sandal ağacı", "vanilya"] },
    "volumeMl": 100,
    "price": 5600,
    "stock": 8,
    "releaseYear": 1921,
    "rating": 4.7,
    "image": "/images/perfumes/chanel-no-5.jpg",
    "hoverImage": null,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  },
  "navigation": { "prevId": 1, "nextId": 3 }
}
```

`navigation`, id sırasına göre önceki ve sonraki parfümün id'sini verir (detay sayfasındaki "Önceki / Sonraki" geçişi için). Listenin uçlarında başa/sona sarar.

**Olası hatalar**
- `400` — `id` pozitif tam sayı değil (ör. `/api/perfumes/abc`).
- `404` — Parfüm bulunamadı.

---

### 5.5 `POST /api/perfumes`

Yeni bir parfüm ekler.

**İstek gövdesi**
```json
{
  "name": "Bleu de Chanel",
  "brand": "Chanel",
  "gender": "erkek",
  "concentration": "EDP",
  "family": "odunsu",
  "notes": {
    "top": ["greyfurt", "limon"],
    "middle": ["zencefil", "yasemin"],
    "base": ["sedir", "sandal ağacı"]
  },
  "volumeMl": 100,
  "price": 5100,
  "stock": 10,
  "releaseYear": 2010,
  "rating": 4.6
}
```

Minimum geçerli gövde:
```json
{ "name": "Bleu de Chanel", "brand": "Chanel", "gender": "erkek", "concentration": "EDP", "price": 5100 }
```

**Yanıt — `201 Created`**

`Location: /api/perfumes/9` başlığı ile birlikte:
```json
{
  "message": "Parfüm oluşturuldu.",
  "data": {
    "id": 9,
    "name": "Bleu de Chanel",
    "brand": "Chanel",
    "...": "...",
    "createdAt": "2026-09-22T09:00:00.000Z",
    "updatedAt": "2026-09-22T09:00:00.000Z"
  }
}
```

**Olası hatalar**
- `400` — Bozuk JSON.
- `409` — Aynı marka altında aynı isimde parfüm zaten var.
- `422` — Doğrulama hatası (zorunlu alan eksik, geçersiz enum, negatif fiyat vb.).

---

### 5.6 `PUT /api/perfumes/:id`

Parfümün **tamamını** değiştirir. `POST` ile aynı gövdeyi ve aynı zorunlu alanları bekler. Gönderilmeyen isteğe bağlı alanlar varsayılan değerlerine (`null`, `0`, `[]`) sıfırlanır. `createdAt` korunur.

**Örnek istek**
```
PUT /api/perfumes/9
```
```json
{
  "name": "Bleu de Chanel",
  "brand": "Chanel",
  "gender": "erkek",
  "concentration": "Parfum",
  "price": 6200,
  "stock": 4
}
```

**Yanıt — `200 OK`**
```json
{ "message": "Parfüm güncellendi.", "data": { "id": 9, "concentration": "Parfum", "price": 6200, "...": "..." } }
```

**Olası hatalar:** `400`, `404`, `409`, `422`

---

### 5.7 `PATCH /api/perfumes/:id`

Sadece gönderilen alanları günceller. Hiçbir alan zorunlu değildir; ancak en az bir geçerli alan gönderilmelidir.

`notes` gönderildiğinde mevcut notalarla **birleştirilir** — örneğin sadece `notes.top` gönderilirse `middle` ve `base` korunur.

**Örnek istek**
```
PATCH /api/perfumes/1
```
```json
{ "price": 3990, "rating": 4.6, "notes": { "top": ["bergamot", "pembe biber"] } }
```

**Yanıt — `200 OK`**
```json
{
  "message": "Parfüm güncellendi.",
  "data": {
    "id": 1,
    "name": "Sauvage",
    "price": 3990,
    "rating": 4.6,
    "notes": {
      "top": ["bergamot", "pembe biber"],
      "middle": ["lavanta", "sichuan biberi"],
      "base": ["ambroxan", "sedir"]
    },
    "...": "..."
  }
}
```

**Olası hatalar**
- `400` — Geçersiz id veya güncellenecek geçerli alan yok.
- `404` — Parfüm bulunamadı.
- `409` — Yeni isim/marka kombinasyonu başka bir parfümle çakışıyor.
- `422` — Doğrulama hatası.

---

### 5.8 `PATCH /api/perfumes/:id/stock`

Stoğu göreli olarak artırır veya azaltır (ör. satış veya tedarik sonrası).

**İstek gövdesi**

| Alan | Tip | Açıklama |
|---|---|---|
| `change` | integer (≠ 0) | Pozitif: stok ekler, negatif: stok düşer |

```json
{ "change": -2 }
```

**Yanıt — `200 OK`**
```json
{ "message": "Stok güncellendi.", "data": { "id": 1, "stock": 10, "...": "..." } }
```

**Olası hatalar**
- `404` — Parfüm bulunamadı.
- `409` — Stok sıfırın altına düşer (`"Yetersiz stok. Mevcut stok: 3."`).
- `422` — `change` sıfırdan farklı bir tam sayı değil.

---

### 5.9 `DELETE /api/perfumes/:id`

Parfümü siler.

**Yanıt — `204 No Content`** (gövde yok)

**Olası hatalar:** `400`, `404`

---

### 5.10 `GET /api/brands`

Tüm markaları alfabetik olarak ve her markadaki parfüm sayısıyla listeler.

**Yanıt — `200 OK`**
```json
{
  "data": [
    { "brand": "Chanel", "perfumeCount": 1 },
    { "brand": "Creed", "perfumeCount": 1 },
    { "brand": "Dior", "perfumeCount": 1 }
  ],
  "total": 8
}
```

---

### 5.11 `GET /api/brands/:brand/perfumes`

Belirli bir markanın tüm parfümlerini döner (büyük/küçük harf duyarsız). Boşluk içeren marka adları URL-encode edilmelidir.

**Örnek istek**
```
GET /api/brands/Jo%20Malone/perfumes
```

**Yanıt — `200 OK`**
```json
{ "data": [ { "id": 5, "name": "Wood Sage & Sea Salt", "brand": "Jo Malone", "...": "..." } ], "total": 1 }
```

**Olası hatalar**
- `404` — Markaya ait parfüm bulunamadı.

---

### 5.12 `GET /api/stats`

Envanter hakkında özet istatistikler döner.

**Yanıt — `200 OK`**
```json
{
  "data": {
    "totalPerfumes": 8,
    "totalBrands": 8,
    "totalStock": 72,
    "outOfStock": 1,
    "inventoryValue": 415200,
    "price": { "min": 3900, "max": 16900, "average": 7468.75 },
    "averageRating": 4.5,
    "byGender": { "erkek": 4, "kadın": 2, "unisex": 2 },
    "byConcentration": { "EDT": 3, "EDP": 3, "EDC": 1, "Extrait": 1 },
    "byFamily": { "aromatik": 1, "çiçeksi": 1, "gurme": 1, "şipre": 1, "taze": 1, "oryantal": 1, "odunsu": 1, "fougere": 1 }
  }
}
```

| Alan | Açıklama |
|---|---|
| `totalStock` | Tüm parfümlerin stok toplamı |
| `outOfStock` | Stoğu 0 olan parfüm sayısı |
| `inventoryValue` | Σ (fiyat × stok) |
| `price` | Min / maks / ortalama fiyat (kayıt yoksa `null`) |
| `averageRating` | Puanı olan parfümlerin ortalaması (yoksa `null`) |

### 5.13 `GET /api/finder`

Mevsime ve günün saatine uygun parfümleri döner. Eşleştirme; isim, marka, koku ailesi, konsantrasyon ve notalar üzerinden anahtar kelimelerle yapılır.

| Parametre | Değerler | Varsayılan |
|---|---|---|
| `season` | `all`, `summer` (ferah/narenciye/çiçeksi), `winter` (odunsu/baharatlı/amber) | `all` |
| `time` | `all`, `day` (EDT/EDC veya ferah notalar), `night` (EDP/Parfum/Extrait veya yoğun notalar) | `all` |

```bash
curl "http://localhost:3000/api/finder?season=winter&time=night"
```

**Yanıt — `200 OK`**
```json
{ "data": [ { "id": 3, "name": "Black Opium", ... } ], "total": 5, "filters": { "season": "winter", "time": "night" } }
```

Geçersiz değerde `400 Bad Request` döner.

### 5.13a `GET /api/finder/options`

Akıllı Koku Bulucu'nun filtre gruplarını (görselli kartlar) ve sayfanın altındaki editoryal banner'ları döner. `key`, `/api/perfumes` sorgu parametresinin adıdır; seçeneklerin `value`'ları o parametreye gönderilir. Görsel yolları frontend'in `public/` klasörüne göredir; `image: null` ise kart `gradient` ile çizilir.

```json
{
  "data": [
    {
      "key": "season",
      "label": "Mevsim seçimi",
      "options": [
        { "value": "all", "label": "Tümü", "description": "Filtre yok", "image": null, "gradient": "linear-gradient(...)" },
        { "value": "summer", "label": "Yazlık / Ferah", "description": "Güneş, narenciye, hafiflik", "image": "/images/quiz/citrus.jpg", "gradient": "linear-gradient(...)" }
      ]
    }
  ],
  "banners": [
    { "image": "/images/banners/fresh-ocean.jpg", "eyebrow": "Deniz & Yaz", "title": "Tuzlu esinti, güneşli ten", "filter": { "key": "season", "value": "summer" } }
  ]
}
```

Banner'ın `filter` alanı doluysa frontend tıklamada o filtreyi uygular.

### 5.13b `GET /api/collections` ve `GET /api/collections/:slug`

Editoryal koleksiyonları döner (şu an frontend'de kullanılmıyor). Bir koleksiyonun parfümleri `GET /api/perfumes?category=<slug>` ile alınır. Bilinmeyen `slug` için `404`, geçersiz `category` için `400`.

| slug | Kural |
|---|---|
| `night` | Çiçeksi/EDC değil; odunsu-şipre ailesi veya dip notada odunsu nota |
| `daily` | Extrait değil; vanilya, tonka, kahve, badem gibi gurme nota içerir |
| `evening` | EDP, Parfum veya Extrait |
| `fresh` | Taze/aromatik/fougere ailesi veya en az 2 ferah nota |

### 5.14 `GET /api/quiz/questions`

Koku testinin sorularını, seçeneklerini ve sayfanın altındaki editoryal banner'ları (`banners`; yapısı 5.13a ile aynı, `filter: null`) döner. Her sorunun `key` alanı, cevap gönderilirken kullanılır.

| Seçenek alanı | Açıklama |
|---|---|
| `label` | Kart başlığı |
| `value` | Cevap olarak gönderilen değer |
| `description` | Kartta başlığın altındaki kısa açıklama |
| `image` | Kart arka plan görseli (frontend `public/images/quiz/` altında) |
| `gradient` | Görsel yüklenemezse kullanılan CSS gradyanı |

```json
{
  "data": [
    {
      "key": "mood",
      "title": "Hangi hissi veya ortamı yakalamak istiyorsun?",
      "options": [
        {
          "label": "Ferah ve doğal",
          "value": "fresh",
          "description": "Enerjik, temiz, açık hava",
          "image": "/images/quiz/fresh.jpg",
          "gradient": "linear-gradient(135deg, #1f3d2b 0%, #6f9a5b 100%)"
        },
        ...
      ]
    },
    { "key": "style", ... },
    { "key": "intensity", ... }
  ]
}
```

### 5.15 `POST /api/quiz/recommendations`

Test cevaplarına göre her parfümü puanlar ve en yüksek puanlıları döner. Puanlama: `mood` eşleşmesi **+3**, `style` eşleşmesi **+4**, `intensity` eşleşmesi **+2**.

| Sorgu parametresi | Açıklama | Varsayılan |
|---|---|---|
| `limit` | Dönecek öneri sayısı (1–20) | `3` |

**İstek gövdesi**
```json
{ "mood": "bold", "style": "woody", "intensity": "heavy" }
```

**Yanıt — `200 OK`**
```json
{
  "data": [
    { "perfume": { "id": 6, "name": "Baccarat Rouge 540", ... }, "score": 9 },
    { "perfume": { "id": 3, "name": "Black Opium", ... }, "score": 5 },
    { "perfume": { "id": 7, "name": "Terre d'Hermès", ... }, "score": 4 }
  ],
  "answers": { "mood": "bold", "style": "woody", "intensity": "heavy" }
}
```

Eksik veya geçersiz cevapta `422` döner; `details` her hatalı alan için izin verilen değerleri listeler.

### 5.16 Sepet — `/api/carts/:cartId`

Sepetler sunucu belleğinde tutulur. `cartId`'yi istemci üretir (8–64 karakter; harf, rakam veya `-`, ör. bir UUID). Frontend bunu tarayıcıda saklar, böylece her kullanıcının ayrı sepeti olur. İlk istekte sepet otomatik olarak boş oluşturulur.

Tüm sepet uç noktaları güncel sepeti aynı yapıda döner. Satır ve genel toplamlar sunucuda hesaplanır:

```json
{
  "data": {
    "id": "2a291ead-2a70-4ad1-8d76-84a4648c47c6",
    "items": [
      { "perfume": { "id": 1, "name": "Sauvage", ... }, "size": "200ml", "unitPrice": 6100, "quantity": 2, "lineTotal": 12200 }
    ],
    "totalQuantity": 2,
    "totalPrice": 12200
  }
}
```

| İstek | Gövde | Açıklama |
|---|---|---|
| `GET /api/carts/:cartId` | — | Sepeti getirir. |
| `POST /api/carts/:cartId/items` | `{ "perfumeId": 1, "quantity": 2, "size": "200ml" }` | Ürünü seçilen boyutta ekler; aynı ürün + boyut zaten sepetteyse adedi artırır. `quantity` varsayılanı `1`. `size` verilmezse ürünün ana hacmine uyan (yoksa ilk) boyut kullanılır. Yanıt `201`. |
| `PATCH /api/carts/:cartId/items/:perfumeId?size=200ml` | `{ "quantity": 3 }` | O boyuttaki satırın adedini ayarlar. `0` satırı çıkarır. |
| `DELETE /api/carts/:cartId/items/:perfumeId?size=200ml` | — | O boyuttaki satırı sepetten çıkarır. |
| `DELETE /api/carts/:cartId` | — | Sepeti boşaltır. |

**Kurallar**
- Fiyat seçilen boyuttan gelir (`unitPrice`). Aynı parfümün farklı boyutları sepette ayrı satırlardır.
- Stok parfüm başınadır: bir parfümün tüm boyutlarının toplam adedi stoktan fazla olamaz; aşılırsa veya ürün tükendiyse `409 Conflict` döner.
- Ürünün sahip olmadığı bir `size` gönderilirse `422` döner ve geçerli boyutlar listelenir.
- Olmayan parfüm veya sepette bulunmayan ürün için `404`, geçersiz `cartId` için `400`, geçersiz `quantity` için `422` döner.
- Katalogdan silinen bir parfüm sepetten de otomatik düşer.
- Sepete eklemek stoğu düşürmez (rezervasyon yapmaz).

### 5.17 `POST /api/newsletter`

E-posta adresini bülten listesine ekler (sunucu belleğinde tutulur).

**İstek gövdesi**
```json
{ "email": "ornek@eposta.com" }
```

| Durum | Yanıt |
|---|---|
| Yeni kayıt | `201` — `{ "message": "Bültenimize kaydoldunuz. Teşekkürler!", "data": { "email": "...", "alreadySubscribed": false } }` |
| Zaten kayıtlı | `200` — `alreadySubscribed: true` |
| Geçersiz e-posta | `422` — `Geçerli bir e-posta adresi girin.` |

Adres büyük/küçük harf duyarsız karşılaştırılır.

### 5.17a Üyelik — `/api/auth/*`

Kullanıcılar `data/store.json` dosyasına kaydedilir; sunucu yeniden başlasa da hesaplar ve oturumlar korunur. Şifreler **bcryptjs** ile hash'lenir, düz metin saklanmaz. Giriş ve kayıtta **JWT** (7 gün geçerli) döner; korumalı isteklerde `Authorization: Bearer <token>` başlığıyla gönderilir.

> JWT imza anahtarı `JWT_SECRET` ortam değişkeninden okunur. Verilmezse ilk açılışta üretilip `data/jwt-secret` dosyasına yazılır ve sonraki açılışlarda aynı anahtar kullanılır (token'lar yeniden başlatmadan etkilenmez).

### Kalıcı veri — `data/` klasörü

| Dosya | İçerik |
|---|---|
| `data/store.json` | Kullanıcılar (bcrypt hash'li şifrelerle), siparişler, favoriler, iptal edilen token'lar ve parfüm stokları |
| `data/jwt-secret` | JWT imza anahtarı |

Her iki dosya yalnızca sahibinin okuyabileceği izinlerle (`600`) yazılır ve **paylaşılmamalı / git'e eklenmemelidir**. Parfüm kataloğu, sepetler, yorumlar ve bülten aboneleri hâlâ bellektedir. Klasör yeri `DATA_DIR` ortam değişkeniyle değiştirilebilir. Tüm verileri sıfırlamak için sunucu kapalıyken `data/` klasörünü silin.

### Favoriler — `/api/favorites`

Favoriler hesaba bağlıdır; tüm istekler `Authorization: Bearer <token>` gerektirir (yoksa `401`). Yanıtlar kart verisi (`ProductCard`) listesidir, en son eklenen başta.

- `GET /api/favorites` — favori listesi
- `PUT /api/favorites/:perfumeId` — ekler (zaten varsa başa taşır)
- `DELETE /api/favorites/:perfumeId` — çıkarır

**Kullanıcı modeli (sunucuda):** `{ id, name, email, passwordHash, createdAt }`. Yanıtlarda `passwordHash` asla dönmez.

| İstek | Gövde | Başarılı yanıt | Hatalar |
|---|---|---|---|
| `POST /api/auth/register` | `{ "name", "email", "password" }` | `201` — `{ data: { user, token } }` | `422` geçersiz alan (ad 1–60 karakter, geçerli e-posta, şifre ≥ 8 karakter ve en az bir harf + bir rakam) · `409` e-posta zaten kayıtlı |
| `POST /api/auth/login` | `{ "email", "password" }` | `200` — `{ data: { user, token } }` | `422` eksik alan · `401` e-posta veya şifre hatalı (hangisinin yanlış olduğu söylenmez) |
| `GET /api/auth/me` | — | `200` — `{ data: user }` | `401` token yok / geçersiz / süresi dolmuş / çıkış yapılmış |
| `POST /api/auth/logout` | — | `200` — token'ın `jti` değeri iptal listesine eklenir | `401` |

```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Esra Bulat","email":"esra@ornek.com","password":"parfum2026"}'
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <token>"
```

### 5.17b Siparişler — `/api/orders`

Sipariş vermek için üyelik zorunlu değildir. `Authorization: Bearer <token>` gönderilirse sipariş hesaba bağlanır; gönderilmezse **misafir siparişi** olur ve gövdede `email` zorunludur (`userId: null`). Her siparişte kullanılan e-posta `email` alanında saklanır ve `GET /api/orders/track` ile sorgulamada kullanılır. Siparişler `data/store.json` içinde kalıcıdır.

**Sipariş modeli:** `{ id, userId, orderNumber, items, shippingAddress, shipping, payment, totalAmount, paymentStatus, createdAt }`

- `orderNumber`: benzersiz, `ORD-8392` biçiminde.
- `items`: sipariş anındaki ürün adı, boyut, birim fiyat, adet ve satır toplamı (fiyat sonradan değişse de sipariş değişmez).
- `shippingAddress`: `{ fullName, phone, address, district, city, postalCode }` (formdan).
- `shipping`: sunucuda belirlenir — `{ method: "Standart kargo", cost: 0, estimatedDelivery: { minBusinessDays: 1, maxBusinessDays: 3, from: "2026-09-30", to: "2026-10-02" } }`. Tarihler hafta sonu hariç iş günüyle hesaplanır.
- `paymentStatus`: `paid`. **Gerçek ödeme sağlayıcısı yoktur; ödeme simüle edilir.**
- `payment`: yalnızca `{ brand, last4 }`. Tam kart numarası ve CVC **kabul edilmez** (gönderilirse `422`).

#### `POST /api/orders`

```json
{
  "cartId": "2a291ead-2a70-4ad1-8d76-84a4648c47c6",
  "shippingAddress": {
    "fullName": "Esra Bulat", "phone": "0555 123 45 67", "address": "Moda Cad. No:12 D:3",
    "district": "Kadıköy", "city": "İstanbul", "postalCode": "34710"
  },
  "payment": { "brand": "visa", "last4": "4242" },
  "email": "ornek@eposta.com"
}
```

`email` yalnızca misafir siparişinde gerekir; üye siparişinde hesabın e-postası kullanılır.

- Ürünler ve fiyatlar **istemciden alınmaz**, `cartId` ile sunucudaki sepetten okunur ve toplam sunucuda hesaplanır.
- Stok son kez kontrol edilir ve sipariş verilince düşülür; sepet boşaltılır.
- Yanıt `201`: oluşan sipariş (`data`), `Location: /api/orders/ORD-XXXX`.
- Hatalar: `401` gönderilen token geçersiz/süresi dolmuş · `422` misafir siparişinde geçersiz e-posta, eksik/geçersiz adres, geçersiz ödeme bilgisi veya boş sepet · `409` yetersiz stok.

`brand` değerleri: `visa`, `mastercard`, `amex`, `troy`, `kart`.

#### `GET /api/orders/my-orders`

Giriş yapmış kullanıcının siparişlerini en yeniden eskiye döner: `{ "data": [ ...siparişler ], "total": 1 }`. Başka kullanıcıların siparişleri görünmez.


#### Sipariş durumu ve takip

Her siparişin bir `status` alanı ve `statusHistory` geçmişi vardır. Durumlar sırasıyla:

| `status` | Etiket |
|---|---|
| `received` | Sipariş alındı |
| `preparing` | Hazırlanıyor |
| `shipped` | Kargoya verildi (bu adımda `shipping.trackingNumber` atanır, ör. `AUR2871049663`) |
| `out_for_delivery` | Dağıtımda |
| `delivered` | Teslim edildi |

Sipariş yanıtlarına ayrıca `statusLabel` ve tüm adımları içeren `steps: [{ key, label, completedAt }]` eklenir (tamamlanmayanlarda `completedAt: null`).

- `GET /api/orders/:orderNumber` — yalnızca siparişi veren kullanıcı görebilir; başkası için `404`.
- `GET /api/orders/track?orderNumber=ORD-4698&email=ornek@eposta.com` — **giriş gerektirmez**; numara ve siparişi veren hesabın e-postası birlikte eşleşmelidir (büyük/küçük harf duyarsız). Yanıtta ödeme bilgisi ve telefon **yer almaz**. Eşleşme yoksa `404`, eksik alan `422`.
- `POST /api/orders/:orderNumber/advance` — **demo amaçlıdır.** Gerçek depo/kargo entegrasyonu olmadığı için durum kendiliğinden ilerlemez; demoda bu uç noktayla bir sonraki duruma geçilir. Teslim edilmiş siparişte `409`.


#### İptal — `POST /api/orders/:orderNumber/cancel`

Yalnızca siparişin sahibi, sipariş `received` veya `preparing` durumundayken (kargoya verilmeden önce) iptal edebilir. Gövde: `{ "reason": "..." }` (isteğe bağlı, en fazla 300 karakter).

- `status` → `cancelled` ("İptal edildi"), `paymentStatus` → `refunded`, `cancellation: { reason, at, refundAmount }` eklenir.
- Ürünlerin stoğu geri eklenir. Ödeme simüle edildiği için gerçek bir para iadesi yapılmaz.
- Hatalar: `409` zaten iptal edilmiş veya kargoya verilmiş · `404` sipariş yok / başkasına ait · `401` oturum yok.

#### İade — `POST /api/orders/:orderNumber/returns`

Yalnızca sahibi, sipariş `delivered` olduktan sonra **14 gün** içinde. Birden fazla (kısmi) iade talebi oluşturulabilir.

```json
{
  "reason": "not_as_expected",
  "note": "Koku bana ağır geldi",
  "items": [{ "perfumeId": 2, "size": "50ml", "quantity": 1 }]
}
```

- `reason`: `not_as_expected`, `damaged`, `wrong_item`, `changed_mind`, `other` (etiketler: `GET /api/returns/reasons`).
- `items` gönderilmezse henüz iade edilmemiş tüm ürünler iade edilir; adet, kalan iade edilebilir adedi aşamaz.
- Yanıt `201`: `{ data: { return, order } }`. `return.code` benzersiz iade kodudur (`IAD-` + 6 karakter; 0/O, 1/I gibi karışabilen karakterler kullanılmaz), `refundAmount` sipariş anındaki birim fiyatlarla hesaplanır.
- Hatalar: `409` teslim edilmemiş / süre dolmuş · `422` geçersiz neden, ürün veya adet ya da iade edilecek ürün kalmamış.

#### İade talebini iptal etme — `POST /api/orders/:orderNumber/returns/:code/cancel`

Yalnızca siparişin sahibi, talep `requested` durumundayken iptal edebilir (kod büyük/küçük harf duyarsız). Talebin `status` alanı `cancelled`, `statusLabel` alanı "İade talebi iptal edildi" olur ve `cancelledAt` eklenir. İptal edilen talepteki ürünler yeniden iade edilebilir sayılır (14 günlük süre dolmadıysa yeni talep oluşturulabilir). Hatalar: `404` kod bu siparişte yok · `409` zaten iptal edilmiş.

Sipariş yanıtlarındaki yardımcı alanlar: `cancellable`, `returnable`, `returnDeadline`, `returnableItems`, `returns`.

#### Yasal metinler — `GET /api/legal/:slug`

`{ slug, title, updatedAt, notice, sections: [{ heading, body: string[] }] }` döner; bilinmeyen slug için `404`. Aura Perfumé bir **demo projesidir** (gerçek satış yapılmaz); `notice` alanı bunu belirten açıklamadır. Metinler, gerçek bir mağazada bu sayfaların nasıl olacağını gösteren ve sitenin gerçekte işlediği verilere göre yazılmış örnek metinlerdir.

#### SSS — `GET /api/faq`

`[{ id, title, items: [{ q, a }] }]` biçiminde bölümler (sipariş ve kargo, iptal ve iade, ödeme ve güvenlik, üyelik, ürünler). Yanıtlar sitenin gerçek kurallarıyla uyumludur.

#### Bize ulaşın — `/api/contact`

`GET /api/contact/subjects` → `{ data: [{ value, label }] }` (`order`, `return`, `product`, `account`, `other`).

`POST /api/contact` — giriş zorunlu değildir; geçerli bir `Authorization: Bearer <token>` gönderilirse mesaj kullanıcıya bağlanır (geçersiz token mesajın gönderilmesini engellemez).

```json
{ "name": "Ayşe Yılmaz", "email": "ayse@example.com", "subject": "order", "orderNumber": "ORD-4892", "message": "Siparişim ne zaman kargoya verilir?" }
```

| Alan | Kural |
|---|---|
| `name` | zorunlu, en fazla 80 karakter |
| `email` | zorunlu, geçerli e-posta |
| `subject` | zorunlu, konu listesindeki değerlerden biri |
| `orderNumber` | isteğe bağlı, `ORD-1234` biçiminde |
| `message` | zorunlu, 10–2000 karakter |

Yanıt `201`: `{ message, data: { ticket: "TLP-JN47DN", userId, name, email, subject, subjectLabel, orderNumber, message, createdAt } }`. Hatalı alanlarda `400`. Mesajlar `data/store.json` içinde kalıcı olarak saklanır; demo projesi olduğu için e-posta gönderilmez.

### 5.18 `GET /api/perfumes/:id/reviews`

Yorumlar en yeniden eskiye sıralanır. Sorgu: `page` (varsayılan `1`), `limit` (1–50, varsayılan `4`).

```json
{
  "data": [
    {
      "id": 7, "perfumeId": 1, "author": "Selin B.", "rating": 5,
      "title": "Paketleme ve hız kusursuz", "body": "Ertesi gün elimdeydi…",
      "verifiedBuyer": true, "createdAt": "2026-09-19T11:00:00.000Z"
    }
  ],
  "summary": { "average": 4.5, "count": 6, "distribution": { "5": 4, "4": 1, "3": 1, "2": 0, "1": 0 } },
  "pagination": { "page": 1, "limit": 4, "total": 6, "totalPages": 2, "hasNext": true, "hasPrev": false }
}
```

> Başlangıç yorumları demo amaçlı örnek verilerdir; parfümün kendi notalarından üretilir.

### 5.19 `POST /api/perfumes/:id/reviews`

**İstek gövdesi**
```json
{ "author": "Elif K.", "rating": 5, "title": "İmza kokum oldu", "body": "Kalıcılığı ve yayılımı harika." }
```

| Alan | Kural |
|---|---|
| `author` | 1–60 karakter |
| `rating` | 1–5 arası tam sayı |
| `title` | 1–120 karakter |
| `body` | 10–2000 karakter |

Yanıt `201`: eklenen yorum (`data`) ve güncel `summary`. Sipariş sistemi olmadığı için yeni yorumlar `verifiedBuyer: false` olarak kaydedilir. Hatalı alanlarda `422`.

### 5.20 `GET /api/perfumes/:id/recommendations`

Benzer parfümleri kart için sade bir biçimde döner. Sorgu: `limit` (1–20, varsayılan `8`).
Benzerlik puanı: aynı koku ailesi **+4**, her ortak nota **+2**, uyumlu cinsiyet **+1**, aynı konsantrasyon **+1**, stokta olması **+1**; eşitlikte puanı yüksek olan önce gelir.

```json
{
  "data": [
    {
      "id": 7, "name": "Terre d'Hermès", "brand": "Hermès", "concentration": "EDT",
      "volumeLabel": "100 ml", "price": 4600,
      "image": "/images/perfumes/hermes-terre-d-hermes.jpg",
      "hoverImage": "/images/perfumes/hermes-terre-d-hermes-hover.jpg",
      "rating": 4.4, "inStock": true
    }
  ]
}
```

---

## 6. Hata Yönetimi

Tüm hatalar aynı formatta döner:

```json
{
  "error": {
    "status": 422,
    "message": "Doğrulama hatası.",
    "details": [
      "'gender' şunlardan biri olmalıdır: kadın, erkek, unisex.",
      "'price' 0 veya daha büyük bir sayı olmalıdır."
    ]
  }
}
```

`details` alanı yalnızca doğrulama hatalarında (`422`) bulunur ve **tüm** hataları tek seferde listeler.

**Diğer örnekler**

```json
{ "error": { "status": 404, "message": "99 id'li parfüm bulunamadı." } }
```
```json
{ "error": { "status": 400, "message": "Geçersiz JSON gövdesi." } }
```
```json
{ "error": { "status": 404, "message": "Rota bulunamadı: GET /api/xyz" } }
```

---

## 7. HTTP Durum Kodları

| Kod | Anlamı | Ne zaman? |
|---|---|---|
| `200` | OK | Başarılı okuma/güncelleme |
| `201` | Created | Parfüm oluşturuldu |
| `204` | No Content | Parfüm silindi |
| `400` | Bad Request | Bozuk JSON, geçersiz id veya sorgu parametresi |
| `404` | Not Found | Kayıt veya rota bulunamadı |
| `409` | Conflict | Yinelenen parfüm, yetersiz stok |
| `422` | Unprocessable Entity | Gövde doğrulama hatası |
| `500` | Internal Server Error | Beklenmeyen sunucu hatası |

---

## 8. Örnek Senaryo (curl)

```bash
# 1) Tüm parfümleri listele
curl http://localhost:3000/api/perfumes

# 2) İçinde "vanilya" notası olan kadın parfümlerini puana göre sırala
curl "http://localhost:3000/api/perfumes?gender=kad%C4%B1n&note=vanilya&sort=rating&order=desc"

# 3) Yeni parfüm ekle
curl -X POST http://localhost:3000/api/perfumes \
  -H "Content-Type: application/json" \
  -d '{"name":"Bleu de Chanel","brand":"Chanel","gender":"erkek","concentration":"EDP","price":5100,"stock":10}'

# 4) Fiyatı güncelle
curl -X PATCH http://localhost:3000/api/perfumes/9 \
  -H "Content-Type: application/json" \
  -d '{"price":4990}'

# 5) 3 adet satış yap (stoktan düş)
curl -X PATCH http://localhost:3000/api/perfumes/9/stock \
  -H "Content-Type: application/json" \
  -d '{"change":-3}'

# 6) İstatistikleri gör
curl http://localhost:3000/api/stats

# 7) Parfümü sil
curl -i -X DELETE http://localhost:3000/api/perfumes/9
```

> **İpucu:** URL'de Türkçe karakter kullanırken (ör. `kadın`) karakterleri URL-encode edin: `kad%C4%B1n`. Tarayıcılar ve Postman bunu otomatik yapar.

---

## 9. Frontend Bağlantısı

`perfume-frontend` (React) uygulamasındaki tüm veriler bu API'den gelir. İstekler `perfume-frontend/src/api.ts` dosyasında toplanmıştır.

| Ekran / özellik | Kullanılan endpoint |
|---|---|
| Koleksiyon listesi, arama ve sıralama | `GET /api/perfumes?q=...&sort=...&order=...&limit=100` |
| Üst menüdeki anlık arama önerileri | `GET /api/perfumes?q=...&limit=6` |
| Parfüm detay sayfası | `GET /api/perfumes/:id` |
| Menüdeki toplam parfüm sayısı | `GET /api/stats` |
| Scent Finder | `GET /api/perfumes?season=...&time=...&scentFamily=...&limit=100` |
| Koku Testi | `GET /api/quiz/questions`, `POST /api/quiz/recommendations` |
| Sepet | `GET` / `POST` / `PATCH` / `DELETE` `/api/carts/:cartId...` |
| Footer'daki e-bülten kutusu | `POST /api/newsletter` |
| Sepet → "Ödemeye geç" → Ödeme penceresi → Sipariş onayı | `POST /api/orders` |
| Siparişlerim: iptal ve iade talebi | `POST /api/orders/:orderNumber/cancel`, `POST /api/orders/:orderNumber/returns`, `GET /api/returns/reasons` |
| Footer > SSS, Gönderim ve iadeler | `GET /api/faq` |
| Footer > Yasal (Yasal uyarı, Gizlilik, Çerez, Satın alma hükümleri) | `GET /api/legal/:slug` |
| Bize ulaşın sayfası (üst menü, yan menü, footer, SSS) | `GET /api/contact/subjects`, `POST /api/contact` |
| Siparişlerim / Sipariş takibi (profil menüsü, yan menü, footer, onay ekranı) | `GET /api/orders/my-orders`, `GET /api/orders/track`, `POST /api/orders/:orderNumber/advance` (demo) |
| Giriş Yap / Üye Ol penceresi, menüdeki kullanıcı adı, Çıkış Yap | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Detay sayfası — müşteri değerlendirmeleri | `GET` / `POST /api/perfumes/:id/reviews` |
| Detay sayfası — "Sizin İçin Seçtiklerimiz" | `GET /api/perfumes/:id/recommendations` |
| Ürün görselleri | `image` ve `hoverImage` alanları (dosyalar `perfume-frontend/public/images/perfumes/` altında) |
