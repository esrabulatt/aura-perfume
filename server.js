const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basit istek loglayıcı
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ---------------------------------------------------------------------------
// Veri (bellek içi)
// ---------------------------------------------------------------------------

const GENDERS = ['kadın', 'erkek', 'unisex'];
const CONCENTRATIONS = ['EDC', 'EDT', 'EDP', 'Parfum', 'Extrait'];
const FAMILIES = ['çiçeksi', 'odunsu', 'oryantal', 'taze', 'fougere', 'şipre', 'gurme', 'aromatik'];

let perfumes = [
  {
    id: 1,
    name: 'Sauvage',
    brand: 'Dior',
    gender: 'erkek',
    concentration: 'EDT',
    family: 'aromatik',
    notes: { top: ['bergamot', 'biber'], middle: ['lavanta', 'sichuan biberi'], base: ['ambroxan', 'sedir'] },
    volumeMl: 100,
    price: 4250,
    variants: [{ size: '60ml', price: 3200 }, { size: '100ml', price: 4250 }, { size: '200ml', price: 6100 }],
    stock: 12,
    releaseYear: 2015,
    rating: 4.5,
    image: '/images/perfumes/dior-sauvage.jpg',
    hoverImage: '/images/perfumes/dior-sauvage-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 2,
    name: 'Chanel No 5',
    brand: 'Chanel',
    gender: 'kadın',
    concentration: 'EDP',
    family: 'çiçeksi',
    notes: { top: ['aldehit', 'neroli'], middle: ['yasemin', 'gül'], base: ['sandal ağacı', 'vanilya'] },
    volumeMl: 100,
    price: 5600,
    variants: [{ size: '35ml', price: 3100 }, { size: '50ml', price: 4200 }, { size: '100ml', price: 5600 }],
    stock: 8,
    releaseYear: 1921,
    rating: 4.7,
    image: '/images/perfumes/chanel-no-5.jpg',
    hoverImage: '/images/perfumes/chanel-no-5-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 3,
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    gender: 'kadın',
    concentration: 'EDP',
    family: 'gurme',
    notes: { top: ['pembe biber', 'armut'], middle: ['kahve', 'yasemin'], base: ['vanilya', 'paçuli'] },
    volumeMl: 90,
    price: 4800,
    variants: [{ size: '30ml', price: 2600 }, { size: '50ml', price: 3600 }, { size: '90ml', price: 4800 }],
    stock: 15,
    releaseYear: 2014,
    rating: 4.4,
    image: '/images/perfumes/ysl-black-opium.jpg',
    hoverImage: '/images/perfumes/ysl-black-opium-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 4,
    name: 'Aventus',
    brand: 'Creed',
    gender: 'erkek',
    concentration: 'EDP',
    family: 'şipre',
    notes: { top: ['ananas', 'bergamot'], middle: ['huş ağacı', 'yasemin'], base: ['misk', 'meşe yosunu'] },
    volumeMl: 100,
    price: 14500,
    variants: [{ size: '50ml', price: 9800 }, { size: '100ml', price: 14500 }],
    stock: 3,
    releaseYear: 2010,
    rating: 4.8,
    image: '/images/perfumes/creed-aventus.jpg',
    hoverImage: '/images/perfumes/creed-aventus-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 5,
    name: 'Wood Sage & Sea Salt',
    brand: 'Jo Malone',
    gender: 'unisex',
    concentration: 'EDC',
    family: 'taze',
    notes: { top: ['ambrette'], middle: ['deniz tuzu'], base: ['adaçayı', 'greyfurt'] },
    volumeMl: 100,
    price: 5200,
    variants: [{ size: '30ml', price: 2400 }, { size: '100ml', price: 5200 }],
    stock: 0,
    releaseYear: 2014,
    rating: 4.2,
    image: '/images/perfumes/jo-malone-wood-sage-sea-salt.jpg',
    hoverImage: '/images/perfumes/jo-malone-wood-sage-sea-salt-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 6,
    name: 'Baccarat Rouge 540',
    brand: 'Maison Francis Kurkdjian',
    gender: 'unisex',
    concentration: 'Extrait',
    family: 'oryantal',
    notes: { top: ['safran', 'acı badem'], middle: ['mısır yasemini', 'sedir'], base: ['amber', 'misk'] },
    volumeMl: 70,
    price: 16900,
    variants: [{ size: '35ml', price: 9900 }, { size: '70ml', price: 16900 }, { size: '200ml', price: 34500 }],
    stock: 5,
    releaseYear: 2015,
    rating: 4.6,
    image: '/images/perfumes/mfk-baccarat-rouge-540.jpg',
    hoverImage: '/images/perfumes/mfk-baccarat-rouge-540-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 7,
    name: 'Terre d\'Hermès',
    brand: 'Hermès',
    gender: 'erkek',
    concentration: 'EDT',
    family: 'odunsu',
    notes: { top: ['portakal', 'greyfurt'], middle: ['biber', 'sardunya'], base: ['vetiver', 'sedir'] },
    volumeMl: 100,
    price: 4600,
    variants: [{ size: '50ml', price: 3100 }, { size: '100ml', price: 4600 }, { size: '200ml', price: 6800 }],
    stock: 9,
    releaseYear: 2006,
    rating: 4.5,
    image: '/images/perfumes/hermes-terre-d-hermes.jpg',
    hoverImage: '/images/perfumes/hermes-terre-d-hermes-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 8,
    name: 'Le Male',
    brand: 'Jean Paul Gaultier',
    gender: 'erkek',
    concentration: 'EDT',
    family: 'fougere',
    notes: { top: ['lavanta', 'nane'], middle: ['tarçın', 'portakal çiçeği'], base: ['vanilya', 'tonka'] },
    volumeMl: 125,
    price: 3900,
    variants: [{ size: '75ml', price: 2900 }, { size: '125ml', price: 3900 }, { size: '200ml', price: 5400 }],
    stock: 20,
    releaseYear: 1995,
    rating: 4.3,
    image: '/images/perfumes/jpg-le-male.jpg',
    hoverImage: '/images/perfumes/jpg-le-male-hover.jpg',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  }
];

let nextId = perfumes.length + 1;

// ---------------------------------------------------------------------------
// Örnek müşteri yorumları (sunum verisi; parfümün kendi notalarından üretilir)
// ---------------------------------------------------------------------------

const REVIEW_AUTHORS = [
  'Elif K.', 'Mert A.', 'Zeynep T.', 'Can Y.', 'Deniz Ö.', 'Selin B.', 'Emre Ç.', 'Ayşe D.',
  'Burak S.', 'Ece G.', 'Kerem U.', 'İpek L.', 'Onur H.', 'Melis E.'
];

// Her şablon, parfümün notalarını kullanarak doğal bir yorum üretir
const REVIEW_TEMPLATES = [
  {
    rating: 5,
    title: 'İmza kokum oldu',
    body: (p) => `${cap(p.notes.top[0])} ile açılışı çok ferah, birkaç saat sonra ${p.notes.base[0]} ortaya çıkıyor. Nereye gitsem soruluyor.`
  },
  {
    rating: 5,
    title: 'Kalıcılığı etkileyici',
    body: (p) => `Sabah sıktığımda akşama kadar hafif bir iz bırakıyor. Özellikle ${p.notes.middle[0]} notası ten üzerinde çok güzel duruyor.`
  },
  {
    rating: 4,
    title: 'Zarif ama biraz yakın duruyor',
    body: (p) => `Koku gerçekten kaliteli, ${p.notes.middle.join(' ve ')} dengesi çok başarılı. Yayılımı daha güçlü olsa beş yıldız verirdim.`
  },
  {
    rating: 5,
    title: 'Paketleme ve hız kusursuz',
    body: () => 'Ertesi gün elimdeydi, kutusu özenle paketlenmişti. Orijinalliğinden hiç şüphem yok, tekrar sipariş vereceğim.'
  },
  {
    rating: 4,
    title: 'Günlük kullanım için ideal',
    body: (p) => `${cap(p.notes.top.join(', '))} açılışı ofiste rahatsız etmeyecek kadar sade. Akşam için bir iki sıkım daha gerekebilir.`
  },
  {
    rating: 5,
    title: 'Hediye olarak aldım, bayıldı',
    body: (p) => `Eşime aldım, ${p.notes.base.join(' ve ')} notalarının sıcaklığını çok sevdi. Şişenin duruşu da çok şık.`
  },
  {
    rating: 3,
    title: 'Beklediğim gibi değil',
    body: (p) => `Güzel bir koku ama bana biraz fazla ${p.notes.base[0]} ağırlıklı geldi. Denemeden almanızı öneririm.`
  },
  {
    rating: 5,
    title: 'Her mevsim kullanıyorum',
    body: (p) => `Yazın ${p.notes.top[0]} öne çıkıyor, kışın ise ${p.notes.base[p.notes.base.length - 1]} daha belirgin hissediliyor. Çok yönlü bir parfüm.`
  }
];

const cap = (text = '') => text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);

let reviews = [];
let nextReviewId = 1;

// Her parfüme 5–7 yorum; şablon, yazar ve tarih parfüm id'sine göre sabit seçilir (her açılışta aynı veri)
for (const perfume of perfumes) {
  const count = 5 + (perfume.id % 3);
  for (let i = 0; i < count; i++) {
    const template = REVIEW_TEMPLATES[(perfume.id * 3 + i) % REVIEW_TEMPLATES.length];
    const createdAt = new Date(Date.UTC(2026, 8, 20 - (perfume.id + i * 17) % 240, 10 + i)).toISOString();
    reviews.push({
      id: nextReviewId++,
      perfumeId: perfume.id,
      author: REVIEW_AUTHORS[(perfume.id * 5 + i * 3) % REVIEW_AUTHORS.length],
      rating: template.rating,
      title: template.title,
      body: template.body(perfume),
      verifiedBuyer: (perfume.id + i) % 4 !== 0,
      createdAt
    });
  }
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const normalize = (s) => String(s).toLocaleLowerCase('tr-TR').trim();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isStringArray = (v) => Array.isArray(v) && v.every(isNonEmptyString);
const normalizeSize = (size) => String(size).replace(/\s+/g, '').toLocaleLowerCase('tr-TR');

/**
 * Parfümün satılabilir boyutları. Öncelik: variants (boyuta özel fiyat) > sizes (hepsi ana fiyattan).
 * Boyut tanımlı değilse boş dizi döner ve ürün tek fiyatla satılır.
 */
function sizeOptions(perfume) {
  if (perfume.variants?.length) return perfume.variants;
  if (perfume.sizes?.length) return perfume.sizes.map((size) => ({ size, price: perfume.price }));
  return [];
}

// İstenen boyutu doğrular; boyut verilmezse ana hacme uyan (yoksa ilk) seçenek kullanılır
function resolveVariant(perfume, size) {
  const options = sizeOptions(perfume);
  const hasSize = size !== undefined && size !== null && size !== '';
  if (options.length === 0) {
    if (hasSize) throw new ApiError(422, `'${perfume.name}' için boyut seçeneği bulunmuyor.`);
    return { size: null, price: perfume.price };
  }
  if (!hasSize) {
    return options.find((o) => normalizeSize(o.size) === normalizeSize(`${perfume.volumeMl}ml`)) ?? options[0];
  }
  const match = options.find((o) => normalizeSize(o.size) === normalizeSize(size));
  if (!match) {
    throw new ApiError(422, `'size' şunlardan biri olmalıdır: ${options.map((o) => o.size).join(', ')}.`);
  }
  return match;
}

/**
 * Parfüm gövdesini doğrular.
 * partial = true ise (PATCH) sadece gönderilen alanlar kontrol edilir.
 */
function isImageUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePerfume(body, { partial = false } = {}) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['İstek gövdesi bir JSON nesnesi olmalıdır.'];
  }

  const has = (key) => body[key] !== undefined;
  const required = ['name', 'brand', 'gender', 'concentration', 'price'];

  if (!partial) {
    for (const key of required) {
      if (!has(key)) errors.push(`'${key}' alanı zorunludur.`);
    }
  }

  if (has('name') && !isNonEmptyString(body.name)) errors.push("'name' boş olmayan bir metin olmalıdır.");
  if (has('brand') && !isNonEmptyString(body.brand)) errors.push("'brand' boş olmayan bir metin olmalıdır.");
  if (has('gender') && !GENDERS.includes(body.gender)) {
    errors.push(`'gender' şunlardan biri olmalıdır: ${GENDERS.join(', ')}.`);
  }
  if (has('concentration') && !CONCENTRATIONS.includes(body.concentration)) {
    errors.push(`'concentration' şunlardan biri olmalıdır: ${CONCENTRATIONS.join(', ')}.`);
  }
  if (has('family') && !FAMILIES.includes(body.family)) {
    errors.push(`'family' şunlardan biri olmalıdır: ${FAMILIES.join(', ')}.`);
  }
  if (has('price') && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0)) {
    errors.push("'price' 0 veya daha büyük bir sayı olmalıdır.");
  }
  if (has('volumeMl') && (!Number.isInteger(body.volumeMl) || body.volumeMl <= 0)) {
    errors.push("'volumeMl' pozitif bir tam sayı olmalıdır.");
  }
  if (has('stock') && (!Number.isInteger(body.stock) || body.stock < 0)) {
    errors.push("'stock' 0 veya daha büyük bir tam sayı olmalıdır.");
  }
  const currentYear = new Date().getFullYear();
  if (has('releaseYear') && (!Number.isInteger(body.releaseYear) || body.releaseYear < 1700 || body.releaseYear > currentYear)) {
    errors.push(`'releaseYear' 1700 ile ${currentYear} arasında bir tam sayı olmalıdır.`);
  }
  if (has('rating') && (typeof body.rating !== 'number' || body.rating < 0 || body.rating > 5)) {
    errors.push("'rating' 0 ile 5 arasında bir sayı olmalıdır.");
  }
  for (const key of ['image', 'hoverImage']) {
    if (has(key) && body[key] !== null && !isImageUrl(body[key])) {
      errors.push(`'${key}' http(s) ile başlayan bir URL, '/' ile başlayan bir yol veya null olmalıdır.`);
    }
  }
  if (has('variants')) {
    const v = body.variants;
    if (!Array.isArray(v) || !v.every((o) => o && isNonEmptyString(o.size) && typeof o.price === 'number' && Number.isFinite(o.price) && o.price >= 0)) {
      errors.push("'variants' { size: string, price: number >= 0 } nesnelerinden oluşan bir dizi olmalıdır.");
    } else if (new Set(v.map((o) => normalizeSize(o.size))).size !== v.length) {
      errors.push("'variants' içinde aynı boyut birden fazla kez geçemez.");
    }
  }
  if (has('sizes')) {
    const v = body.sizes;
    if (!isStringArray(v)) {
      errors.push("'sizes' metinlerden oluşan bir dizi olmalıdır (ör. [\"50ml\", \"100ml\"]).");
    } else if (new Set(v.map(normalizeSize)).size !== v.length) {
      errors.push("'sizes' içinde aynı boyut birden fazla kez geçemez.");
    }
  }
  if (has('notes')) {
    const n = body.notes;
    if (!n || typeof n !== 'object' || Array.isArray(n)) {
      errors.push("'notes' { top, middle, base } yapısında bir nesne olmalıdır.");
    } else {
      for (const layer of ['top', 'middle', 'base']) {
        if (n[layer] !== undefined && !isStringArray(n[layer])) {
          errors.push(`'notes.${layer}' metinlerden oluşan bir dizi olmalıdır.`);
        }
      }
    }
  }

  return errors;
}

const ALLOWED_FIELDS = ['name', 'brand', 'gender', 'concentration', 'family', 'notes', 'volumeMl', 'price', 'stock', 'releaseYear', 'rating', 'image', 'hoverImage', 'variants', 'sizes'];

function pickAllowed(body) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (typeof out.name === 'string') out.name = out.name.trim();
  if (typeof out.brand === 'string') out.brand = out.brand.trim();
  return out;
}

function normalizeNotes(notes = {}) {
  return {
    top: notes.top || [],
    middle: notes.middle || [],
    base: notes.base || []
  };
}

function isDuplicate(name, brand, excludeId) {
  return perfumes.some(
    (p) => p.id !== excludeId && normalize(p.name) === normalize(name) && normalize(p.brand) === normalize(brand)
  );
}

function findPerfumeOr404(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Geçersiz id. 'id' pozitif bir tam sayı olmalıdır.");
  }
  const perfume = perfumes.find((p) => p.id === id);
  if (!perfume) throw new ApiError(404, `${id} id'li parfüm bulunamadı.`);
  return perfume;
}

function parseNumberQuery(value, name) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (value === '' || Number.isNaN(n)) throw new ApiError(400, `'${name}' sorgu parametresi sayı olmalıdır.`);
  return n;
}

// ---------------------------------------------------------------------------
// Rotalar
// ---------------------------------------------------------------------------

const router = express.Router();

// Sağlık kontrolü
app.get('/', (req, res) => {
  res.json({
    name: 'Perfume API',
    version: '1.0.0',
    docs: 'API_DOKUMANTASYON.md dosyasına bakınız.',
    endpoints: {
      health: 'GET /api/health',
      perfumes: '/api/perfumes',
      brands: 'GET /api/brands',
      stats: 'GET /api/stats',
      meta: 'GET /api/meta',
      finder: 'GET /api/finder',
      quiz: 'GET /api/quiz/questions, POST /api/quiz/recommendations',
      carts: '/api/carts/:cartId',
      newsletter: 'POST /api/newsletter',
      orders: 'POST /api/orders, GET /api/orders/my-orders, GET /api/orders/:orderNumber, GET /api/orders/track',
      legal: 'GET /api/legal, GET /api/legal/:slug',
      contact: 'POST /api/contact, GET /api/contact/subjects',
      favorites: 'GET /api/favorites, PUT/DELETE /api/favorites/:perfumeId',
      auth: 'POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout',
      collections: 'GET /api/collections'
    }
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// İzin verilen enum değerleri
router.get('/meta', (req, res) => {
  res.json({
    data: {
      genders: GENDERS,
      concentrations: CONCENTRATIONS,
      families: FAMILIES,
      scentFamilies: Object.entries(SCENT_FAMILY_GROUPS).map(([value, g]) => ({ value, label: g.label }))
    }
  });
});

// Tüm parfümleri listele (filtreleme, arama, sıralama, sayfalama)
router.get('/perfumes', (req, res) => {
  const { q, brand, gender, concentration, family, note, inStock, season, time, scentFamily, category, sort = 'id', order = 'asc' } =
    req.query;

  const minPrice = parseNumberQuery(req.query.minPrice, 'minPrice');
  const maxPrice = parseNumberQuery(req.query.maxPrice, 'maxPrice');
  const minRating = parseNumberQuery(req.query.minRating, 'minRating');
  const page = parseNumberQuery(req.query.page, 'page') ?? 1;
  const limit = parseNumberQuery(req.query.limit, 'limit') ?? 10;

  if (!Number.isInteger(page) || page < 1) throw new ApiError(400, "'page' 1 veya daha büyük bir tam sayı olmalıdır.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, "'limit' 1 ile 100 arasında bir tam sayı olmalıdır.");

  const sortable = ['id', 'name', 'brand', 'price', 'rating', 'releaseYear', 'stock', 'volumeMl', 'createdAt'];
  if (!sortable.includes(sort)) throw new ApiError(400, `'sort' şunlardan biri olmalıdır: ${sortable.join(', ')}.`);
  if (!['asc', 'desc'].includes(order)) throw new ApiError(400, "'order' 'asc' veya 'desc' olmalıdır.");
  if (inStock !== undefined && !['true', 'false'].includes(inStock)) {
    throw new ApiError(400, "'inStock' 'true' veya 'false' olmalıdır.");
  }
  // Scent Finder filtreleri ('all' veya boş = filtre yok)
  if (season && season !== 'all' && !SEASON_MATCHERS[season]) {
    throw new ApiError(400, "'season' şunlardan biri olmalıdır: all, summer, winter.");
  }
  if (time && time !== 'all' && !TIME_MATCHERS[time]) {
    throw new ApiError(400, "'time' şunlardan biri olmalıdır: all, day, night.");
  }
  if (scentFamily && scentFamily !== 'all' && !SCENT_FAMILY_GROUPS[scentFamily]) {
    throw new ApiError(400, `'scentFamily' şunlardan biri olmalıdır: all, ${Object.keys(SCENT_FAMILY_GROUPS).join(', ')}.`);
  }

  let result = [...perfumes];

  // Editoryal koleksiyon (ana sayfa banner'ları): /api/perfumes?category=night
  if (category && category !== 'all') {
    if (!COLLECTIONS.some((c) => c.slug === category)) {
      throw new ApiError(400, `'category' şunlardan biri olmalıdır: all, ${COLLECTIONS.map((c) => c.slug).join(', ')}.`);
    }
    result = result.filter(findCollectionOr404(category).match);
  }

  if (season && season !== 'all') result = result.filter((p) => SEASON_MATCHERS[season](p, searchableText(p)));
  if (time && time !== 'all') result = result.filter((p) => TIME_MATCHERS[time](p, searchableText(p)));
  if (scentFamily && scentFamily !== 'all') result = result.filter((p) => scentFamilyGroups(p).includes(scentFamily));

  if (q) {
    const term = normalize(q);
    result = result.filter((p) =>
      [p.name, p.brand, ...p.notes.top, ...p.notes.middle, ...p.notes.base].some((field) => normalize(field).includes(term))
    );
  }
  if (brand) result = result.filter((p) => normalize(p.brand) === normalize(brand));
  if (gender) result = result.filter((p) => p.gender === normalize(gender));
  if (concentration) result = result.filter((p) => normalize(p.concentration) === normalize(concentration));
  if (family) result = result.filter((p) => p.family === normalize(family));
  if (note) {
    const term = normalize(note);
    result = result.filter((p) =>
      [...p.notes.top, ...p.notes.middle, ...p.notes.base].some((n) => normalize(n).includes(term))
    );
  }
  if (minPrice !== undefined) result = result.filter((p) => p.price >= minPrice);
  if (maxPrice !== undefined) result = result.filter((p) => p.price <= maxPrice);
  if (minRating !== undefined) result = result.filter((p) => (p.rating ?? 0) >= minRating);
  if (inStock === 'true') result = result.filter((p) => p.stock > 0);
  if (inStock === 'false') result = result.filter((p) => p.stock === 0);

  const dir = order === 'desc' ? -1 : 1;
  result.sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'string') return av.localeCompare(bv, 'tr') * dir;
    return (av < bv ? -1 : 1) * dir;
  });

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = result.slice((page - 1) * limit, page * limit);

  res.json({
    data,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
  });
});

// ---------------------------------------------------------------------------
// Editoryal koleksiyonlar (ana sayfa banner'ları -> /api/perfumes?category=...)
// ---------------------------------------------------------------------------

const WOODY_NOTES = /sedir|sandal|vetiver|oud|paçuli|huş|meşe|odun|ambroxan/i;
const GOURMAND_NOTES = /vanilya|tonka|kahve|badem|karamel|kakao|pralin/i;
const FRESH_NOTES = /bergamot|limon|greyfurt|portakal(?! çiçe)|mandalina|nane|deniz|ananas|adaçayı|narenciye/i;
const allNotes = (p) => [...p.notes.top, ...p.notes.middle, ...p.notes.base];

const COLLECTIONS = [
  {
    slug: 'night',
    eyebrow: 'Gece & Şehir',
    title: 'Şehrin ışıkları altında',
    description: 'Gece için odunsu, derin ve iz bırakan kokular.',
    criteria: 'Çiçeksi ve kolonya (EDC) olmayan; odunsu/şipre ailesinden veya dip notalarında odunsu nota bulunan parfümler.',
    image: '/images/banners/bleu-chanel-night.jpg',
    match: (p) =>
      p.family !== 'çiçeksi' &&
      p.concentration !== 'EDC' &&
      (['odunsu', 'şipre'].includes(p.family) || p.notes.base.some((n) => WOODY_NOTES.test(n)))
  },
  {
    slug: 'daily',
    eyebrow: 'Günlük ritüel',
    title: 'Kahve, kruvasan ve sıcak notalar',
    description: 'Güne eşlik eden sıcak, gurme ve yumuşak kokular.',
    criteria: 'Extrait olmayan ve notalarında vanilya, tonka, kahve, badem gibi gurme bir nota bulunan parfümler.',
    image: '/images/banners/coffee-lifestyle.jpg',
    match: (p) => p.concentration !== 'Extrait' && allNotes(p).some((n) => GOURMAND_NOTES.test(n))
  },
  {
    slug: 'evening',
    eyebrow: 'Akşam yemeği',
    title: 'Birlikte paylaşılan anlar',
    description: 'Özel akşamlar için yoğun ve kalıcı kokular.',
    criteria: 'Yoğun konsantrasyonlu (EDP, Parfum, Extrait) parfümler.',
    image: '/images/banners/night-collection.jpg',
    match: (p) => ['EDP', 'Parfum', 'Extrait'].includes(p.concentration)
  },
  {
    slug: 'fresh',
    eyebrow: 'Deniz & Yaz',
    title: 'Tuzlu esinti, güneşli ten',
    description: 'Yaz günleri için ferah, narenciyeli ve aromatik kokular.',
    criteria: 'Taze, aromatik veya fougere ailesinden ya da en az 2 ferah (narenciye/deniz) notası olan parfümler.',
    image: '/images/banners/fresh-ocean.jpg',
    match: (p) =>
      ['taze', 'aromatik', 'fougere'].includes(p.family) || allNotes(p).filter((n) => FRESH_NOTES.test(n)).length >= 2
  }
];

// Görsel yolları frontend'in public klasörüne göredir (ör. /images/banners/...)
const serializeCollection = (req, c) => ({
  slug: c.slug,
  eyebrow: c.eyebrow,
  title: c.title,
  description: c.description,
  criteria: c.criteria,
  image: c.image,
  productCount: perfumes.filter(c.match).length
});

function findCollectionOr404(slug) {
  const collection = COLLECTIONS.find((c) => c.slug === slug);
  if (!collection) {
    throw new ApiError(404, `'${slug}' koleksiyonu bulunamadı. Geçerli değerler: ${COLLECTIONS.map((c) => c.slug).join(', ')}.`);
  }
  return collection;
}

router.get('/collections', (req, res) => {
  res.json({ data: COLLECTIONS.map((c) => serializeCollection(req, c)) });
});

router.get('/collections/:slug', (req, res) => {
  res.json({ data: serializeCollection(req, findCollectionOr404(req.params.slug)) });
});

// ---------------------------------------------------------------------------
// Yorumlar
// ---------------------------------------------------------------------------

function reviewSummary(perfumeReviews) {
  const count = perfumeReviews.length;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of perfumeReviews) distribution[r.rating]++;
  const average = count ? Math.round((perfumeReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : null;
  return { average, count, distribution };
}

// Bir parfümün yorumları (en yeni önce) + puan özeti
router.get('/perfumes/:id/reviews', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const page = parseNumberQuery(req.query.page, 'page') ?? 1;
  const limit = parseNumberQuery(req.query.limit, 'limit') ?? 4;
  if (!Number.isInteger(page) || page < 1) throw new ApiError(400, "'page' 1 veya daha büyük bir tam sayı olmalıdır.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new ApiError(400, "'limit' 1 ile 50 arasında bir tam sayı olmalıdır.");

  const all = reviews
    .filter((r) => r.perfumeId === perfume.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  res.json({
    data: all.slice((page - 1) * limit, page * limit),
    summary: reviewSummary(all),
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
  });
});

// Yorum ekle. Gövde: { author, rating (1-5), title, body }
router.post('/perfumes/:id/reviews', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const { author, rating, title, body } = req.body || {};
  const errors = [];
  if (!isNonEmptyString(author) || author.trim().length > 60) errors.push("'author' 1-60 karakterlik bir metin olmalıdır.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push("'rating' 1 ile 5 arasında bir tam sayı olmalıdır.");
  if (!isNonEmptyString(title) || title.trim().length > 120) errors.push("'title' 1-120 karakterlik bir metin olmalıdır.");
  if (!isNonEmptyString(body) || body.trim().length < 10 || body.trim().length > 2000) {
    errors.push("'body' 10-2000 karakterlik bir metin olmalıdır.");
  }
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const review = {
    id: nextReviewId++,
    perfumeId: perfume.id,
    author: author.trim(),
    rating,
    title: title.trim(),
    body: body.trim(),
    // Sipariş sistemi olmadığı için yeni yorumlar doğrulanmış alıcı olarak işaretlenmez
    verifiedBuyer: false,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  res.status(201).json({
    message: 'Yorumunuz için teşekkürler.',
    data: review,
    summary: reviewSummary(reviews.filter((r) => r.perfumeId === perfume.id))
  });
});

// ---------------------------------------------------------------------------
// Öneriler: benzer parfümler (koku ailesi, ortak notalar, cinsiyet, konsantrasyon)
// ---------------------------------------------------------------------------

// Kartlarda gereken sade ürün özeti
const toProductCard = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  concentration: p.concentration,
  volumeLabel: p.volumeMl ? `${p.volumeMl} ml` : null,
  price: p.price,
  image: p.image ?? null,
  hoverImage: p.hoverImage ?? null,
  rating: p.rating ?? null,
  inStock: p.stock > 0
});

router.get('/perfumes/:id/recommendations', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const limit = parseNumberQuery(req.query.limit, 'limit') ?? 8;
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new ApiError(400, "'limit' 1 ile 20 arasında bir tam sayı olmalıdır.");

  const ownNotes = new Set([...perfume.notes.top, ...perfume.notes.middle, ...perfume.notes.base].map(normalize));
  const data = perfumes
    .filter((p) => p.id !== perfume.id)
    .map((p) => {
      const sharedNotes = [...p.notes.top, ...p.notes.middle, ...p.notes.base].filter((n) => ownNotes.has(normalize(n))).length;
      const score =
        (p.family && p.family === perfume.family ? 4 : 0) +
        sharedNotes * 2 +
        (p.gender === perfume.gender || p.gender === 'unisex' ? 1 : 0) +
        (p.concentration === perfume.concentration ? 1 : 0) +
        (p.stock > 0 ? 1 : 0);
      return { p, score };
    })
    // Benzerlik eşitse puanı yüksek olan önce
    .sort((a, b) => b.score - a.score || (b.p.rating ?? 0) - (a.p.rating ?? 0))
    .slice(0, limit)
    .map(({ p }) => toProductCard(p));

  res.json({ data });
});

// Tek parfüm getir
router.get('/perfumes/:id', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  // Detay sayfasındaki önceki / sonraki geçişi için (id sırasına göre, uçlarda başa sarar)
  const ids = perfumes.map((p) => p.id).sort((a, b) => a - b);
  const index = ids.indexOf(perfume.id);
  const navigation = {
    prevId: ids[(index - 1 + ids.length) % ids.length],
    nextId: ids[(index + 1) % ids.length]
  };
  res.json({ data: perfume, navigation });
});

// Yeni parfüm oluştur
router.post('/perfumes', (req, res) => {
  const errors = validatePerfume(req.body);
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const input = pickAllowed(req.body);
  if (isDuplicate(input.name, input.brand)) {
    throw new ApiError(409, `'${input.brand}' markasına ait '${input.name}' adlı parfüm zaten mevcut.`);
  }

  const now = new Date().toISOString();
  const perfume = {
    id: nextId++,
    name: input.name,
    brand: input.brand,
    gender: input.gender,
    concentration: input.concentration,
    family: input.family ?? null,
    notes: normalizeNotes(input.notes),
    volumeMl: input.volumeMl ?? null,
    price: input.price,
    stock: input.stock ?? 0,
    releaseYear: input.releaseYear ?? null,
    rating: input.rating ?? null,
    image: input.image ?? null,
    hoverImage: input.hoverImage ?? null,
    variants: input.variants ?? [],
    sizes: input.sizes ?? [],
    createdAt: now,
    updatedAt: now
  };

  perfumes.push(perfume);
  res.status(201).location(`/api/perfumes/${perfume.id}`).json({ message: 'Parfüm oluşturuldu.', data: perfume });
});

// Parfümü tamamen güncelle
router.put('/perfumes/:id', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const errors = validatePerfume(req.body);
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const input = pickAllowed(req.body);
  if (isDuplicate(input.name, input.brand, perfume.id)) {
    throw new ApiError(409, `'${input.brand}' markasına ait '${input.name}' adlı parfüm zaten mevcut.`);
  }

  Object.assign(perfume, {
    name: input.name,
    brand: input.brand,
    gender: input.gender,
    concentration: input.concentration,
    family: input.family ?? null,
    notes: normalizeNotes(input.notes),
    volumeMl: input.volumeMl ?? null,
    price: input.price,
    stock: input.stock ?? 0,
    releaseYear: input.releaseYear ?? null,
    rating: input.rating ?? null,
    image: input.image ?? null,
    hoverImage: input.hoverImage ?? null,
    variants: input.variants ?? [],
    sizes: input.sizes ?? [],
    updatedAt: new Date().toISOString()
  });

  res.json({ message: 'Parfüm güncellendi.', data: perfume });
});

// Parfümü kısmen güncelle
router.patch('/perfumes/:id', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const errors = validatePerfume(req.body, { partial: true });
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const input = pickAllowed(req.body);
  if (Object.keys(input).length === 0) {
    throw new ApiError(400, 'Güncellenecek en az bir geçerli alan gönderilmelidir.');
  }

  const newName = input.name ?? perfume.name;
  const newBrand = input.brand ?? perfume.brand;
  if (isDuplicate(newName, newBrand, perfume.id)) {
    throw new ApiError(409, `'${newBrand}' markasına ait '${newName}' adlı parfüm zaten mevcut.`);
  }

  if (input.notes) input.notes = { ...perfume.notes, ...input.notes };

  Object.assign(perfume, input, { updatedAt: new Date().toISOString() });
  res.json({ message: 'Parfüm güncellendi.', data: perfume });
});

// Stok güncelle (artır / azalt)
router.patch('/perfumes/:id/stock', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  const { change } = req.body || {};
  if (!Number.isInteger(change) || change === 0) {
    throw new ApiError(422, "'change' sıfırdan farklı bir tam sayı olmalıdır (örn. 5 veya -2).");
  }
  if (perfume.stock + change < 0) {
    throw new ApiError(409, `Yetersiz stok. Mevcut stok: ${perfume.stock}.`);
  }
  perfume.stock += change;
  perfume.updatedAt = new Date().toISOString();
  res.json({ message: 'Stok güncellendi.', data: perfume });
});

// Parfüm sil
router.delete('/perfumes/:id', (req, res) => {
  const perfume = findPerfumeOr404(req.params.id);
  perfumes = perfumes.filter((p) => p.id !== perfume.id);
  reviews = reviews.filter((r) => r.perfumeId !== perfume.id);
  res.status(204).end();
});

// Markaları listele
router.get('/brands', (req, res) => {
  const map = new Map();
  for (const p of perfumes) {
    const entry = map.get(p.brand) || { brand: p.brand, perfumeCount: 0 };
    entry.perfumeCount++;
    map.set(p.brand, entry);
  }
  const data = [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand, 'tr'));
  res.json({ data, total: data.length });
});

// Bir markaya ait parfümler
router.get('/brands/:brand/perfumes', (req, res) => {
  const data = perfumes.filter((p) => normalize(p.brand) === normalize(req.params.brand));
  if (data.length === 0) throw new ApiError(404, `'${req.params.brand}' markasına ait parfüm bulunamadı.`);
  res.json({ data, total: data.length });
});

// İstatistikler
router.get('/stats', (req, res) => {
  const count = perfumes.length;
  const countBy = (key) =>
    perfumes.reduce((acc, p) => {
      const k = p[key] ?? 'belirtilmemiş';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

  const prices = perfumes.map((p) => p.price);
  const rated = perfumes.filter((p) => typeof p.rating === 'number');
  const round2 = (n) => Math.round(n * 100) / 100;

  res.json({
    data: {
      totalPerfumes: count,
      totalBrands: new Set(perfumes.map((p) => p.brand)).size,
      totalStock: perfumes.reduce((s, p) => s + p.stock, 0),
      outOfStock: perfumes.filter((p) => p.stock === 0).length,
      inventoryValue: round2(perfumes.reduce((s, p) => s + p.price * p.stock, 0)),
      price: count
        ? { min: Math.min(...prices), max: Math.max(...prices), average: round2(prices.reduce((a, b) => a + b, 0) / count) }
        : null,
      averageRating: rated.length ? round2(rated.reduce((s, p) => s + p.rating, 0) / rated.length) : null,
      byGender: countBy('gender'),
      byConcentration: countBy('concentration'),
      byFamily: countBy('family')
    }
  });
});

// ---------------------------------------------------------------------------
// Koku bulucu (mevsim / gün saati filtresi)
// ---------------------------------------------------------------------------

const searchableText = (p) =>
  [p.name, p.brand, p.family ?? '', p.concentration, p.description ?? '', ...p.notes.top, ...p.notes.middle, ...p.notes.base]
    .join(' ')
    .toLocaleLowerCase('tr-TR');

const familyIncludes = (p, families) => families.some((f) => (p.family ?? '').toLowerCase().includes(f));

const SEASON_MATCHERS = {
  summer: (p, text) =>
    /citrus|bergamot|lemon|limon|ferah|fresh|floral|çiçek|meyve|fruit|narenciye|akdeniz|su|aqua|ozon|marine|turunç/i.test(text) ||
    familyIncludes(p, ['citrus', 'fresh', 'floral', 'fruity']),
  winter: (p, text) =>
    /woody|odunsu|spicy|baharat|amber|vanilla|vanilya|leather|deri|cinnamon|tarçın|oud|ud|tobacco|tütün|gourmand|oriental/i.test(text) ||
    familyIncludes(p, ['woody', 'oriental', 'gourmand', 'spicy'])
};

const TIME_MATCHERS = {
  day: (p, text) =>
    /edt|edc|cologne|eau de toilette/i.test(p.concentration) || /citrus|fresh|ferah|floral|çiçek|taze|light|günlük/i.test(text),
  night: (p, text) =>
    /edp|parfum|extrait|intense|elixir|noir|black/i.test(p.concentration) ||
    /amber|woody|odunsu|oriental|spicy|baharat|vanilla|vanilya|deri|leather|dark|gece/i.test(text)
};

// Koku ailesi grupları (Scent Finder'daki 3. filtre).
// Bir parfüm, kendi koku ailesinin grubuna VE notalarında o gruba ait en az 2 nota varsa o gruba da girer.
const SCENT_FAMILY_GROUPS = {
  woody: { label: 'Odunsu', families: ['odunsu', 'şipre'], notes: /sedir|sandal|vetiver|oud|paçuli|huş|meşe|odun/i },
  floral: { label: 'Çiçeksi', families: ['çiçeksi'], notes: /gül|yasemin|iris|neroli|zambak|sümbül|manolya|çiçe/i },
  fresh: {
    label: 'Fresh',
    families: ['taze', 'aromatik', 'fougere'],
    notes: /bergamot|limon|greyfurt|portakal(?! çiçe)|mandalina|nane|deniz|ananas|adaçayı|narenciye/i
  },
  spicy: { label: 'Baharatlı', families: ['oryantal', 'gurme'], notes: /biber|safran|tarçın|kakule|karanfil|baharat|zencefil/i }
};

function scentFamilyGroups(perfume) {
  const allNotes = [...perfume.notes.top, ...perfume.notes.middle, ...perfume.notes.base];
  return Object.entries(SCENT_FAMILY_GROUPS)
    .filter(([, group]) => group.families.includes(perfume.family) || allNotes.filter((n) => group.notes.test(n)).length >= 2)
    .map(([key]) => key);
}

// Akıllı Koku Bulucu filtre kartları: her seçenek bir editoryal görsel (koyu karartmalı) taşır.
// value'lar /api/perfumes?season=&time=&scentFamily= parametreleriyle birebir aynıdır.
const ALL_OPTION = { value: 'all', label: 'Tümü', description: 'Filtre yok', image: null, gradient: 'linear-gradient(135deg, #171717 0%, #404040 100%)' };

const FINDER_FILTERS = [
  {
    key: 'season',
    label: 'Mevsim seçimi',
    options: [
      ALL_OPTION,
      { value: 'summer', label: 'Yazlık / Ferah', description: 'Güneş, narenciye, hafiflik', image: '/images/quiz/citrus.jpg', gradient: 'linear-gradient(135deg, #0f3b4a 0%, #d8c39a 100%)' },
      { value: 'winter', label: 'Kışlık / Yoğun', description: 'Şehir ışıkları, derin notalar', image: '/images/quiz/bold.jpg', gradient: 'linear-gradient(135deg, #0b1020 0%, #1f3a6b 100%)' }
    ]
  },
  {
    key: 'time',
    label: 'Kullanım zamanı',
    options: [
      ALL_OPTION,
      { value: 'day', label: 'Gündüz', description: 'Gün ışığı, sade, yakın', image: '/images/quiz/light.jpg', gradient: 'linear-gradient(135deg, #3b2a1d 0%, #cbb89a 100%)' },
      { value: 'night', label: 'Gece / Davet', description: 'Akşam, duman, iz bırakan', image: '/images/quiz/heavy.jpg', gradient: 'linear-gradient(135deg, #1a0f08 0%, #6b4424 100%)' }
    ]
  },
  {
    key: 'scentFamily',
    label: 'Koku ailesi',
    options: [
      ALL_OPTION,
      { value: 'woody', label: 'Odunsu', description: 'Sedir, vetiver, paçuli', image: '/images/quiz/classic.jpg', gradient: 'linear-gradient(135deg, #2a1d14 0%, #7a5a3c 100%)' },
      { value: 'floral', label: 'Çiçeksi', description: 'Yasemin, gül, neroli', image: '/images/quiz/floral.jpg', gradient: 'linear-gradient(135deg, #4a2a3a 0%, #d9a3b3 100%)' },
      { value: 'fresh', label: 'Fresh', description: 'Bergamot, yeşillik, nane', image: '/images/quiz/fresh.jpg', gradient: 'linear-gradient(135deg, #1f3d2b 0%, #6f9a5b 100%)' },
      { value: 'spicy', label: 'Baharatlı', description: 'Safran, biber, tarçın', image: '/images/quiz/woody.jpg', gradient: 'linear-gradient(135deg, #3b2314 0%, #a0673d 100%)' }
    ]
  }
];

// Sayfaların alt kısmındaki editoryal banner'lar (frontend/public/images/banners).
// Koku bulucudakiler tıklanınca ilgili filtreyi uygular.
const FINDER_BANNERS = [
  {
    image: '/images/banners/fresh-ocean.jpg',
    eyebrow: 'Deniz & Yaz',
    title: 'Tuzlu esinti, güneşli ten',
    filter: { key: 'season', value: 'summer' }
  },
  {
    image: '/images/banners/coffee-lifestyle.jpg',
    eyebrow: 'Günlük ritüel',
    title: 'Kahve, kruvasan ve gün ışığı',
    filter: { key: 'time', value: 'day' }
  },
  {
    image: '/images/banners/bleu-chanel-night.jpg',
    eyebrow: 'Gece & Şehir',
    title: 'Şehrin ışıkları altında',
    filter: { key: 'time', value: 'night' }
  }
];

const QUIZ_BANNERS = [
  {
    image: '/images/banners/night-collection.jpg',
    eyebrow: 'Akşam yemeği',
    title: 'Birlikte paylaşılan anlar',
    filter: null
  },
  {
    image: '/images/banners/lifestyle-desk.jpg',
    eyebrow: 'Şık akşamlar',
    title: 'İz bırakan bir zarafet',
    filter: null
  }
];

router.get('/finder/options', (req, res) => {
  res.json({ data: FINDER_FILTERS, banners: FINDER_BANNERS });
});

router.get('/finder', (req, res) => {
  const { season = 'all', time = 'all' } = req.query;
  if (season !== 'all' && !SEASON_MATCHERS[season]) {
    throw new ApiError(400, "'season' şunlardan biri olmalıdır: all, summer, winter.");
  }
  if (time !== 'all' && !TIME_MATCHERS[time]) {
    throw new ApiError(400, "'time' şunlardan biri olmalıdır: all, day, night.");
  }

  const data = perfumes.filter((p) => {
    const text = searchableText(p);
    return (season === 'all' || SEASON_MATCHERS[season](p, text)) && (time === 'all' || TIME_MATCHERS[time](p, text));
  });
  res.json({ data, total: data.length, filters: { season, time } });
});

// ---------------------------------------------------------------------------
// Koku testi (quiz)
// ---------------------------------------------------------------------------

// Her seçenek: kart görseli (public/images/quiz), görsel yüklenemezse kullanılacak gradyan ve kısa açıklama
const QUIZ_QUESTIONS = [
  {
    key: 'mood',
    title: 'Hangi hissi veya ortamı yakalamak istiyorsun?',
    options: [
      {
        label: 'Ferah ve doğal',
        value: 'fresh',
        description: 'Enerjik, temiz, açık hava',
        image: '/images/quiz/fresh.jpg',
        gradient: 'linear-gradient(135deg, #1f3d2b 0%, #6f9a5b 100%)'
      },
      {
        label: 'Şık ve gizemli',
        value: 'bold',
        description: 'Gece, ışıltı, çekicilik',
        image: '/images/quiz/bold.jpg',
        gradient: 'linear-gradient(135deg, #0b0b12 0%, #3a2f1f 100%)'
      },
      {
        label: 'Romantik ve yumuşak',
        value: 'sweet',
        description: 'Çiçekler, tatlılık, sıcaklık',
        image: '/images/quiz/sweet.jpg',
        gradient: 'linear-gradient(135deg, #5b2a3a 0%, #d9a3b3 100%)'
      },
      {
        label: 'Ciddi ve klasik',
        value: 'classic',
        description: 'Profesyonel, zamansız, ölçülü',
        image: '/images/quiz/classic.jpg',
        gradient: 'linear-gradient(135deg, #2a1d14 0%, #7a5a3c 100%)'
      }
    ]
  },
  {
    key: 'style',
    title: 'Hangi koku ailesi sana daha yakın geliyor?',
    options: [
      {
        label: 'Narenciye ve deniz',
        value: 'citrus',
        description: 'Bergamot, limon, tuzlu esinti',
        image: '/images/quiz/citrus.jpg',
        gradient: 'linear-gradient(135deg, #6b5a12 0%, #e8c547 100%)'
      },
      {
        label: 'Odunsu ve baharatlı',
        value: 'woody',
        description: 'Sedir, amber, tarçın',
        image: '/images/quiz/woody.jpg',
        gradient: 'linear-gradient(135deg, #3b2314 0%, #a0673d 100%)'
      },
      {
        label: 'Çiçeksi',
        value: 'floral',
        description: 'Yasemin, gül, beyaz çiçekler',
        image: '/images/quiz/floral.jpg',
        gradient: 'linear-gradient(135deg, #4a4a3a 0%, #e6e1d3 100%)'
      },
      {
        label: 'Vanilya ve gurme',
        value: 'vanilla',
        description: 'Vanilya, tonka, tatlı sıcaklık',
        image: '/images/quiz/vanilla.jpg',
        gradient: 'linear-gradient(135deg, #2e2218 0%, #b8926a 100%)'
      }
    ]
  },
  {
    key: 'intensity',
    title: 'Parfümünün yayılımı ve kalıcılığı nasıl olsun?',
    options: [
      {
        label: 'Hafif ve taze',
        value: 'light',
        description: 'Günlük kullanım, tende yakın',
        image: '/images/quiz/light.jpg',
        gradient: 'linear-gradient(135deg, #8a7f6a 0%, #f1ece2 100%)'
      },
      {
        label: 'Yoğun ve fark edilir',
        value: 'heavy',
        description: 'Gece ve özel davetler',
        image: '/images/quiz/heavy.jpg',
        gradient: 'linear-gradient(135deg, #000000 0%, #4a2e12 100%)'
      }
    ]
  }
];

// Her cevap için: eşleşme deseni ve kazandırdığı puan
const QUIZ_SCORING = {
  mood: {
    points: 3,
    patterns: {
      fresh: /fresh|ferah|citrus|marine|limon/i,
      bold: /amber|woody|spicy|noir|black|intense/i,
      sweet: /vanilla|vanilya|floral|çiçek|meyve/i,
      classic: /woody|odunsu|leather|deri|edt/i
    }
  },
  style: {
    points: 4,
    patterns: {
      citrus: /citrus|bergamot|limon|narenciye/i,
      woody: /woody|odunsu|amber|spicy|baharat/i,
      floral: /floral|çiçek|rose|gül|jasmin/i,
      vanilla: /vanilla|vanilya|sweet|tatlı/i
    }
  },
  intensity: {
    points: 2,
    patterns: {
      light: /edt|cologne|fresh|ferah/i,
      heavy: /edp|parfum|intense|extrait/i
    }
  }
};

router.get('/quiz/questions', (req, res) => {
  res.json({ data: QUIZ_QUESTIONS, banners: QUIZ_BANNERS });
});

router.post('/quiz/recommendations', (req, res) => {
  const answers = req.body || {};
  const errors = QUIZ_QUESTIONS.filter((q) => !q.options.some((o) => o.value === answers[q.key])).map(
    (q) => `'${q.key}' şunlardan biri olmalıdır: ${q.options.map((o) => o.value).join(', ')}.`
  );
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const limit = parseNumberQuery(req.query.limit, 'limit') ?? 3;
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new ApiError(400, "'limit' 1 ile 20 arasında bir tam sayı olmalıdır.");

  const data = perfumes
    .map((perfume) => {
      const text = searchableText(perfume);
      const score = Object.entries(QUIZ_SCORING).reduce(
        (sum, [key, { points, patterns }]) => sum + (patterns[answers[key]].test(text) ? points : 0),
        0
      );
      return { perfume, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ data, answers: { mood: answers.mood, style: answers.style, intensity: answers.intensity } });
});

// ---------------------------------------------------------------------------
// Sepet (bellek içi; her istemci kendi cartId'sini üretir)
// ---------------------------------------------------------------------------

const carts = new Map(); // cartId -> Map("perfumeId|boyut" -> { perfumeId, size, quantity })
const CART_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

const cartKey = (perfumeId, size) => `${perfumeId}|${size ? normalizeSize(size) : ''}`;

function getCart(cartId) {
  if (!CART_ID_PATTERN.test(cartId)) {
    throw new ApiError(400, "Geçersiz 'cartId'. 8-64 karakterlik harf, rakam veya '-' olmalıdır.");
  }
  if (!carts.has(cartId)) carts.set(cartId, new Map());
  return carts.get(cartId);
}

function serializeCart(cartId, cart) {
  const items = [];
  for (const [key, item] of cart) {
    const perfume = perfumes.find((p) => p.id === item.perfumeId);
    let variant;
    try {
      variant = perfume && resolveVariant(perfume, item.size);
    } catch {
      variant = null;
    }
    if (!perfume || !variant) {
      cart.delete(key); // katalogdan silinen ürün veya kaldırılan boyut sepetten de düşer
      continue;
    }
    items.push({
      perfume,
      size: variant.size,
      unitPrice: variant.price,
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity
    });
  }
  return {
    id: cartId,
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}

// Stok parfüm başına tutulur: aynı parfümün tüm boyutları toplamda stoğu aşamaz
function assertStock(cart, perfume, key, quantity) {
  if (perfume.stock === 0) throw new ApiError(409, `'${perfume.name}' stokta yok.`);
  let otherSizes = 0;
  for (const [k, item] of cart) {
    if (item.perfumeId === perfume.id && k !== key) otherSizes += item.quantity;
  }
  if (otherSizes + quantity > perfume.stock) {
    throw new ApiError(409, `Yetersiz stok. '${perfume.name}' için sepette en fazla ${perfume.stock} adet olabilir.`);
  }
}

function findCartItemOr404(cart, perfume, size) {
  const variant = resolveVariant(perfume, size);
  const key = cartKey(perfume.id, variant.size);
  if (!cart.has(key)) {
    throw new ApiError(404, `'${perfume.name}'${variant.size ? ` (${variant.size})` : ''} sepette bulunmuyor.`);
  }
  return key;
}

router.get('/carts/:cartId', (req, res) => {
  res.json({ data: serializeCart(req.params.cartId, getCart(req.params.cartId)) });
});

// Sepete ürün ekle (aynı ürün + boyut varsa adedi artırır). Gövde: { perfumeId, quantity?, size? }
router.post('/carts/:cartId/items', (req, res) => {
  const cart = getCart(req.params.cartId);
  const { perfumeId, quantity = 1, size } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(422, "'quantity' 1 veya daha büyük bir tam sayı olmalıdır.");
  }
  const perfume = findPerfumeOr404(perfumeId);
  const variant = resolveVariant(perfume, size);
  const key = cartKey(perfume.id, variant.size);
  const newQuantity = (cart.get(key)?.quantity ?? 0) + quantity;
  assertStock(cart, perfume, key, newQuantity);

  cart.set(key, { perfumeId: perfume.id, size: variant.size, quantity: newQuantity });
  res.status(201).json({ message: 'Ürün sepete eklendi.', data: serializeCart(req.params.cartId, cart) });
});

// Sepetteki ürünün adedini ayarla (0 gönderilirse ürün çıkarılır). Boyut: ?size=100ml
router.patch('/carts/:cartId/items/:perfumeId', (req, res) => {
  const cart = getCart(req.params.cartId);
  const perfume = findPerfumeOr404(req.params.perfumeId);
  const key = findCartItemOr404(cart, perfume, req.query.size);

  const { quantity } = req.body || {};
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ApiError(422, "'quantity' 0 veya daha büyük bir tam sayı olmalıdır.");
  }
  if (quantity === 0) {
    cart.delete(key);
  } else {
    assertStock(cart, perfume, key, quantity);
    cart.get(key).quantity = quantity;
  }
  res.json({ message: 'Sepet güncellendi.', data: serializeCart(req.params.cartId, cart) });
});

// Sepetten ürün çıkar. Boyut: ?size=100ml
router.delete('/carts/:cartId/items/:perfumeId', (req, res) => {
  const cart = getCart(req.params.cartId);
  const perfume = findPerfumeOr404(req.params.perfumeId);
  cart.delete(findCartItemOr404(cart, perfume, req.query.size));
  res.json({ message: 'Ürün sepetten çıkarıldı.', data: serializeCart(req.params.cartId, cart) });
});

// ---------------------------------------------------------------------------
// Üyelik ve oturum. Kullanıcılar data/store.json dosyasına kaydedilir (sunucu yeniden başlasa da kalır).
// Şifreler bcryptjs ile hash'lenir; girişte JWT üretilir, istekler "Authorization: Bearer <token>" ile gelir.
// ---------------------------------------------------------------------------

// Kalıcı veri klasörü (testlerde DATA_DIR ile ayrı bir klasör verilebilir)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// JWT imza anahtarı: ortam değişkeni > data/jwt-secret dosyası > ilk açılışta üretilip dosyaya yazılır.
// Böylece sunucu yeniden başlayınca mevcut oturumlar geçersiz olmaz.
function loadJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(DATA_DIR, 'jwt-secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    const secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}
const JWT_SECRET = loadJwtSecret();
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 10;

/** @type {{ id: number, name: string, email: string, passwordHash: string, createdAt: string }[]} */
const users = [];
let nextUserId = 1;
const revokedTokens = new Set(); // çıkış yapılan token'ların jti değerleri
const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

const signToken = (user) =>
  jwt.sign({ sub: String(user.id), name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: crypto.randomUUID()
  });

// Authorization başlığındaki JWT'yi doğrular; geçersiz / süresi dolmuş / çıkış yapılmışsa 401
function requireUser(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Oturum bulunamadı veya süresi doldu. Lütfen tekrar giriş yapın.');
  }
  const user = users.find((u) => String(u.id) === payload.sub);
  if (!user || revokedTokens.has(payload.jti)) {
    throw new ApiError(401, 'Oturum bulunamadı veya süresi doldu. Lütfen tekrar giriş yapın.');
  }
  return { user, payload };
}

router.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = [];
  if (!isNonEmptyString(name) || name.trim().length > 60) errors.push("'name' 1-60 karakterlik bir metin olmalıdır.");
  if (typeof email !== 'string' || !AUTH_EMAIL_PATTERN.test(email.trim()) || email.length > 254) {
    errors.push('Geçerli bir e-posta adresi girin.');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    errors.push('Şifre en az 8 karakter olmalıdır.');
  } else if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) {
    errors.push('Şifre en az bir harf ve bir rakam içermelidir.');
  }
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new ApiError(409, 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.');
  }

  const user = {
    id: nextUserId++,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveStore();
  res.status(201).json({ message: 'Hesabınız oluşturuldu.', data: { user: publicUser(user), token: signToken(user) } });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError(422, 'E-posta ve şifre zorunludur.');
  }
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  // Hangi alanın yanlış olduğu söylenmez (hesap varlığı sızdırılmaz)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) throw new ApiError(401, 'E-posta veya şifre hatalı.');
  res.json({ message: 'Giriş yapıldı.', data: { user: publicUser(user), token: signToken(user) } });
});

router.get('/auth/me', (req, res) => {
  res.json({ data: publicUser(requireUser(req).user) });
});

router.post('/auth/logout', (req, res) => {
  // JWT durumsuzdur; çıkışta token'ın kimliği (jti) iptal listesine eklenir
  revokedTokens.add(requireUser(req).payload.jti);
  saveStore();
  res.json({ message: 'Çıkış yapıldı.' });
});

// ---------------------------------------------------------------------------
// Favoriler: hesaba bağlı (JWT gerekir), kalıcı
// ---------------------------------------------------------------------------

const favorites = new Map(); // userId -> perfumeId[] (en son eklenen başta)

function userFavorites(user) {
  const ids = (favorites.get(user.id) ?? []).filter((id) => perfumes.some((p) => p.id === id));
  return ids.map((id) => toProductCard(perfumes.find((p) => p.id === id)));
}

router.get('/favorites', (req, res) => {
  res.json({ data: userFavorites(requireUser(req).user) });
});

router.put('/favorites/:perfumeId', (req, res) => {
  const { user } = requireUser(req);
  const perfume = findPerfumeOr404(req.params.perfumeId);
  favorites.set(user.id, [perfume.id, ...(favorites.get(user.id) ?? []).filter((id) => id !== perfume.id)]);
  saveStore();
  res.json({ message: `'${perfume.name}' favorilere eklendi.`, data: userFavorites(user) });
});

router.delete('/favorites/:perfumeId', (req, res) => {
  const { user } = requireUser(req);
  const perfume = findPerfumeOr404(req.params.perfumeId);
  favorites.set(user.id, (favorites.get(user.id) ?? []).filter((id) => id !== perfume.id));
  saveStore();
  res.json({ message: `'${perfume.name}' favorilerden çıkarıldı.`, data: userFavorites(user) });
});

// ---------------------------------------------------------------------------
// İletişim formu (Bize ulaşın). Mesajlar kalıcı olarak kaydedilir; kullanıcıya talep numarası verilir.
// Sunum projesi olduğu için mesajlara gerçek bir ekip yanıt vermez ve e-posta gönderilmez.
// ---------------------------------------------------------------------------

const contactMessages = [];
const CONTACT_SUBJECTS = {
  order: 'Sipariş ve kargo',
  return: 'İptal ve iade',
  product: 'Ürün bilgisi ve öneri',
  account: 'Üyelik ve hesap',
  other: 'Diğer'
};

// TLP-XXXXXX: karışabilecek karakterler olmadan benzersiz talep numarası
function generateTicketNumber() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    let code = 'TLP-';
    for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(alphabet.length)];
    if (!contactMessages.some((m) => m.ticket === code)) return code;
  }
}

router.get('/contact/subjects', (req, res) => {
  res.json({ data: Object.entries(CONTACT_SUBJECTS).map(([value, label]) => ({ value, label })) });
});

// Gövde: { name, email, subject, orderNumber?, message }. Giriş yapılmışsa mesaj hesaba da bağlanır.
router.post('/contact', (req, res) => {
  const { name, email, subject, orderNumber, message } = req.body || {};
  const errors = [];
  if (!isNonEmptyString(name) || name.trim().length > 80) errors.push('Adınızı girin (en fazla 80 karakter).');
  if (typeof email !== 'string' || !AUTH_EMAIL_PATTERN.test(email.trim()) || email.length > 254) errors.push('Geçerli bir e-posta adresi girin.');
  if (!Object.keys(CONTACT_SUBJECTS).includes(subject)) errors.push('Bir konu seçin.');
  if (orderNumber !== undefined && orderNumber !== '' && !/^ORD-\d{4,}$/i.test(String(orderNumber).trim())) {
    errors.push('Sipariş numarası ORD-1234 biçiminde olmalıdır.');
  }
  if (!isNonEmptyString(message) || message.trim().length < 10 || message.trim().length > 2000) {
    errors.push('Mesajınız 10 ile 2000 karakter arasında olmalıdır.');
  }
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  // Oturum varsa mesaj hesaba bağlanır (zorunlu değil)
  let userId = null;
  if (req.get('authorization')) {
    try {
      userId = requireUser(req).user.id;
    } catch {
      userId = null;
    }
  }

  const entry = {
    ticket: generateTicketNumber(),
    userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject,
    subjectLabel: CONTACT_SUBJECTS[subject],
    orderNumber: orderNumber ? String(orderNumber).trim().toUpperCase() : null,
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  contactMessages.push(entry);
  saveStore();
  res.status(201).json({ message: `Mesajınız alındı. Talep numaranız: ${entry.ticket}`, data: entry });
});

// ---------------------------------------------------------------------------
// E-bülten aboneliği (bellek içi)
// ---------------------------------------------------------------------------

const newsletterSubscribers = new Map(); // e-posta (küçük harf) -> kayıt zamanı
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post('/newsletter', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ApiError(422, 'Geçerli bir e-posta adresi girin.');
  }
  // Aynı adres tekrar gönderilirse hata vermeden bilgi döner
  if (newsletterSubscribers.has(email)) {
    return res.json({ message: 'Bu adres zaten bültenimize kayıtlı.', data: { email, alreadySubscribed: true } });
  }
  newsletterSubscribers.set(email, new Date().toISOString());
  res.status(201).json({ message: 'Bültenimize kaydoldunuz. Teşekkürler!', data: { email, alreadySubscribed: false } });
});

// ---------------------------------------------------------------------------
// Siparişler (bellek içi). Yalnızca giriş yapmış kullanıcılar sipariş verebilir.
// Ürünler ve fiyatlar istemciden değil, sunucudaki sepetten alınır; stok düşülür, sepet boşaltılır.
// Gerçek ödeme sağlayıcısı yoktur: ödeme simüle edilir, kart bilgisi olarak yalnızca son 4 hane ve tür saklanır.
// ---------------------------------------------------------------------------

/** @type {{ id: number, userId: number, orderNumber: string, items: object[], shippingAddress: object, shipping: object, payment: object, totalAmount: number, paymentStatus: 'paid', createdAt: string }[]} */
const orders = [];
let nextOrderId = 1;
const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'troy', 'kart'];

// ORD-XXXX: 4 haneli, benzersiz sipariş numarası (çakışmada tekrar üretilir; dolarsa 5 haneye geçer)
function generateOrderNumber() {
  for (let digits = 4; ; digits++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const n = crypto.randomInt(10 ** (digits - 1), 10 ** digits);
      const orderNumber = `ORD-${n}`;
      if (!orders.some((o) => o.orderNumber === orderNumber)) return orderNumber;
    }
  }
}

// Sipariş durumları (sırayla). Gerçek depo/kargo entegrasyonu yoktur; durum demo uç noktasıyla ilerletilir.
const ORDER_STATUSES = [
  { key: 'received', label: 'Sipariş alındı' },
  { key: 'preparing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Kargoya verildi' },
  { key: 'out_for_delivery', label: 'Dağıtımda' },
  { key: 'delivered', label: 'Teslim edildi' }
];
const CANCELLED = { key: 'cancelled', label: 'İptal edildi' };
const statusLabel = (key) => (key === CANCELLED.key ? CANCELLED.label : ORDER_STATUSES.find((s) => s.key === key)?.label ?? key);

// İptal: kargoya verilmeden önce · İade: teslimattan sonra 14 gün içinde
const CANCELLABLE_STATUSES = ['received', 'preparing'];
const RETURN_WINDOW_DAYS = 14;
const RETURN_REASONS = {
  not_as_expected: 'Koku beklediğim gibi değil',
  damaged: 'Ürün hasarlı / kusurlu geldi',
  wrong_item: 'Yanlış ürün gönderildi',
  changed_mind: 'Fikrimi değiştirdim',
  other: 'Diğer'
};

const deliveredAt = (o) => o.statusHistory.find((h) => h.status === 'delivered')?.at ?? null;
function returnDeadline(o) {
  const at = deliveredAt(o);
  return at ? new Date(new Date(at).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;
}

// Bir kalemin daha önce iade talebine konmuş adedi
const returnedQuantity = (o, perfumeId, size) =>
  (o.returns ?? []).filter((r) => r.status !== 'cancelled').flatMap((r) => r.items).filter((i) => i.perfumeId === perfumeId && i.size === size)
    .reduce((n, i) => n + i.quantity, 0);

// IAD-XXXXXX: karışabilecek karakterler (0/O, 1/I) olmadan 6 haneli benzersiz iade kodu
function generateReturnCode() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    let code = 'IAD-';
    for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(alphabet.length)];
    if (!orders.some((o) => (o.returns ?? []).some((r) => r.code === code))) return code;
  }
}

// Kargo takip numarası: AUR + 10 hane (benzersiz)
function generateTrackingNumber() {
  for (;;) {
    const n = `AUR${crypto.randomInt(10 ** 9, 10 ** 10)}`;
    if (!orders.some((o) => o.shipping.trackingNumber === n)) return n;
  }
}

// İstemciye dönen sipariş: durum etiketleri ve tüm adımların listesi eklenir
const serializeOrder = (o) => {
  const cancelled = o.status === CANCELLED.key;
  const allSteps = ORDER_STATUSES.map((s) => ({
    key: s.key,
    label: s.label,
    completedAt: o.statusHistory.find((h) => h.status === s.key)?.at ?? null
  }));
  // İptal edilen siparişte: tamamlanan adımlar + "İptal edildi"
  const steps = cancelled
    ? [...allSteps.filter((s) => s.completedAt), { ...CANCELLED, completedAt: o.statusHistory.find((h) => h.status === CANCELLED.key)?.at ?? null }]
    : allSteps;
  const deadline = returnDeadline(o);
  const returnableItems = o.items
    .map((i) => ({ perfumeId: i.perfumeId, size: i.size, quantity: i.quantity - returnedQuantity(o, i.perfumeId, i.size) }))
    .filter((i) => i.quantity > 0);
  return {
    ...o,
    returns: o.returns ?? [],
    statusLabel: statusLabel(o.status),
    steps,
    cancellable: CANCELLABLE_STATUSES.includes(o.status),
    returnable: o.status === 'delivered' && deadline !== null && new Date(deadline) > new Date() && returnableItems.length > 0,
    returnDeadline: deadline,
    returnableItems
  };
};

function findOwnOrderOr404(user, orderNumber) {
  const order = orders.find((o) => o.orderNumber === String(orderNumber).toUpperCase() && o.userId === user.id);
  if (!order) throw new ApiError(404, `'${orderNumber}' numaralı sipariş bulunamadı.`);
  return order;
}

// Kargo: tüm siparişlerde ücretsiz standart gönderim, 1–3 iş günü (hafta sonu sayılmaz)
const SHIPPING = { method: 'Standart kargo', cost: 0, minBusinessDays: 1, maxBusinessDays: 3 };

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString().slice(0, 10); // YYYY-AA-GG
}

const ADDRESS_FIELDS = {
  fullName: { label: 'Ad soyad', max: 80 },
  phone: { label: 'Telefon', max: 20 },
  address: { label: 'Adres', max: 300 },
  district: { label: 'İlçe', max: 60 },
  city: { label: 'İl', max: 60 },
  postalCode: { label: 'Posta kodu', max: 10 }
};

function validateOrderBody(body) {
  const errors = [];
  const { cartId, shippingAddress: a, payment: pay } = body || {};
  if (typeof cartId !== 'string' || !CART_ID_PATTERN.test(cartId)) errors.push("Geçerli bir 'cartId' gönderilmelidir.");
  if (!a || typeof a !== 'object') {
    errors.push('Teslimat adresi zorunludur.');
  } else {
    for (const [key, { label, max }] of Object.entries(ADDRESS_FIELDS)) {
      if (!isNonEmptyString(a[key]) || a[key].trim().length > max) errors.push(`${label} zorunludur (en fazla ${max} karakter).`);
    }
    if (isNonEmptyString(a.phone) && !/^[0-9 +()-]{10,20}$/.test(a.phone.trim())) errors.push('Telefon numarası geçersiz.');
    if (isNonEmptyString(a.postalCode) && !/^\d{5}$/.test(a.postalCode.trim())) errors.push('Posta kodu 5 haneli olmalıdır.');
  }
  // Tam kart numarası / CVC kabul edilmez; yalnızca son 4 hane ve kart türü
  if (!pay || typeof pay !== 'object' || !/^\d{4}$/.test(pay.last4 ?? '') || !CARD_BRANDS.includes(pay.brand)) {
    errors.push("Ödeme bilgisi geçersiz ('last4' ve 'brand' gönderilmelidir).");
  }
  if (pay && (pay.cardNumber !== undefined || pay.cvc !== undefined)) {
    errors.push('Tam kart numarası veya CVC sunucuya gönderilmemelidir.');
  }
  return errors;
}

// Üyelik zorunlu değildir: token varsa sipariş hesaba bağlanır; yoksa misafir siparişi olarak 'email' zorunludur.
// (Geçersiz/süresi dolmuş bir token gönderilirse 401 döner; misafir olarak sessizce devam edilmez.)
router.post('/orders', (req, res) => {
  const user = req.headers.authorization ? requireUser(req).user : null;
  const errors = validateOrderBody(req.body);
  const guestEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!user && (!AUTH_EMAIL_PATTERN.test(guestEmail) || guestEmail.length > 254)) {
    errors.push('Üye girişi yapmadan sipariş vermek için geçerli bir e-posta adresi girin.');
  }
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const { cartId, shippingAddress, payment } = req.body;
  const cart = getCart(cartId);
  const summary = serializeCart(cartId, cart);
  if (summary.items.length === 0) throw new ApiError(422, 'Sepetiniz boş.');

  // Stok son kez kontrol edilir (parfüm başına tüm boyutların toplamı)
  const perPerfume = new Map();
  for (const item of summary.items) perPerfume.set(item.perfume.id, (perPerfume.get(item.perfume.id) ?? 0) + item.quantity);
  for (const [perfumeId, quantity] of perPerfume) {
    const perfume = perfumes.find((p) => p.id === perfumeId);
    if (quantity > perfume.stock) {
      throw new ApiError(409, `Yetersiz stok. '${perfume.name}' için en fazla ${perfume.stock} adet sipariş verilebilir.`);
    }
  }
  for (const [perfumeId, quantity] of perPerfume) {
    const perfume = perfumes.find((p) => p.id === perfumeId);
    perfume.stock -= quantity;
    perfume.updatedAt = new Date().toISOString();
  }

  const clean = (v) => v.trim();
  const order = {
    id: nextOrderId++,
    userId: user?.id ?? null, // misafir siparişinde null
    email: user?.email ?? guestEmail, // takip ve iletişim için
    orderNumber: generateOrderNumber(),
    // Sipariş anındaki ürün bilgisi saklanır (fiyat sonradan değişse de sipariş değişmez)
    items: summary.items.map((item) => ({
      perfumeId: item.perfume.id,
      name: item.perfume.name,
      brand: item.perfume.brand,
      image: item.perfume.image ?? null,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal
    })),
    shippingAddress: Object.fromEntries(Object.keys(ADDRESS_FIELDS).map((k) => [k, clean(shippingAddress[k])])),
    status: 'received',
    statusHistory: [{ status: 'received', at: new Date().toISOString() }],
    shipping: {
      method: SHIPPING.method,
      cost: SHIPPING.cost,
      trackingNumber: null, // kargoya verilince atanır
      estimatedDelivery: {
        minBusinessDays: SHIPPING.minBusinessDays,
        maxBusinessDays: SHIPPING.maxBusinessDays,
        from: addBusinessDays(new Date(), SHIPPING.minBusinessDays),
        to: addBusinessDays(new Date(), SHIPPING.maxBusinessDays)
      }
    },
    payment: { brand: payment.brand, last4: payment.last4 },
    totalAmount: summary.totalPrice + SHIPPING.cost,
    paymentStatus: 'paid', // ödeme simüle edilir
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  saveStore();
  cart.clear();

  res.status(201).location(`/api/orders/${order.orderNumber}`).json({ message: 'Siparişiniz alındı.', data: serializeOrder(order) });
});

// Giriş yapmış kullanıcının siparişleri (en yeni önce)
router.get('/orders/my-orders', (req, res) => {
  const { user } = requireUser(req);
  const data = orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(serializeOrder);
  res.json({ data, total: data.length });
});

// Giriş yapmadan sipariş takibi (misafir siparişleri dahil): sipariş numarası + siparişte kullanılan e-posta birlikte doğru olmalı.
// Yanıtta ödeme bilgisi ve telefon yer almaz. (Rotası /orders/:orderNumber'dan önce tanımlanmalı.)
router.get('/orders/track', (req, res) => {
  const orderNumber = String(req.query.orderNumber ?? '').trim().toUpperCase();
  const email = String(req.query.email ?? '').trim().toLowerCase();
  if (!orderNumber || !email) throw new ApiError(422, 'Sipariş numarası ve e-posta zorunludur.');
  const order = orders.find((o) => o.orderNumber === orderNumber);
  // Eski siparişlerde 'email' alanı yok; hesabın e-postasına bakılır
  const orderEmail = order && (order.email ?? users.find((u) => u.id === order.userId)?.email);
  if (!order || !orderEmail || orderEmail !== email) {
    throw new ApiError(404, 'Bu bilgilerle eşleşen bir sipariş bulunamadı. Sipariş numarasını ve e-postayı kontrol edin.');
  }
  const { payment, ...rest } = serializeOrder(order);
  const { phone, ...address } = rest.shippingAddress;
  res.json({ data: { ...rest, shippingAddress: address } });
});

// Tek sipariş (yalnızca sahibi)
router.get('/orders/:orderNumber', (req, res) => {
  const { user } = requireUser(req);
  res.json({ data: serializeOrder(findOwnOrderOr404(user, req.params.orderNumber)) });
});

// Siparişi iptal et (yalnızca sahibi, kargoya verilmeden önce). Gövde: { reason? }
// Stok geri eklenir, ödeme iade edildi olarak işaretlenir (ödeme simüle edildiği için gerçek iade yoktur).
router.post('/orders/:orderNumber/cancel', (req, res) => {
  const { user } = requireUser(req);
  const order = findOwnOrderOr404(user, req.params.orderNumber);
  if (order.status === CANCELLED.key) throw new ApiError(409, 'Sipariş zaten iptal edilmiş.');
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new ApiError(409, `'${statusLabel(order.status)}' durumundaki sipariş iptal edilemez. Teslim aldıktan sonra iade talebi oluşturabilirsiniz.`);
  }
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';

  for (const item of order.items) {
    const perfume = perfumes.find((p) => p.id === item.perfumeId);
    if (perfume) perfume.stock += item.quantity;
  }
  const now = new Date().toISOString();
  order.status = CANCELLED.key;
  order.statusHistory.push({ status: CANCELLED.key, at: now });
  order.paymentStatus = 'refunded';
  order.cancellation = { reason: reason || null, at: now, refundAmount: order.totalAmount };
  saveStore();
  res.json({ message: 'Siparişiniz iptal edildi. Ödemeniz iade edilecektir.', data: serializeOrder(order) });
});

// İade talebi oluştur (yalnızca sahibi, teslimattan sonra 14 gün içinde).
// Gövde: { reason: 'not_as_expected' | ..., note?, items?: [{ perfumeId, size, quantity }] } — items yoksa kalan tüm ürünler
router.post('/orders/:orderNumber/returns', (req, res) => {
  const { user } = requireUser(req);
  const order = findOwnOrderOr404(user, req.params.orderNumber);
  if (order.status !== 'delivered') throw new ApiError(409, 'Yalnızca teslim edilmiş siparişler için iade talebi oluşturulabilir.');
  const deadline = returnDeadline(order);
  if (!deadline || new Date(deadline) <= new Date()) {
    throw new ApiError(409, `İade süresi (${RETURN_WINDOW_DAYS} gün) dolmuş.`);
  }

  const { reason, note, items } = req.body || {};
  const errors = [];
  if (!Object.keys(RETURN_REASONS).includes(reason)) errors.push(`'reason' şunlardan biri olmalıdır: ${Object.keys(RETURN_REASONS).join(', ')}.`);
  if (note !== undefined && (typeof note !== 'string' || note.length > 500)) errors.push("'note' en fazla 500 karakter olmalıdır.");

  const available = serializeOrder(order).returnableItems;
  let selected = available;
  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      errors.push("'items' en az bir ürün içeren bir dizi olmalıdır.");
    } else {
      selected = [];
      for (const it of items) {
        const match = available.find((a) => a.perfumeId === it?.perfumeId && a.size === (it?.size ?? null));
        if (!match) errors.push(`Ürün #${it?.perfumeId} (${it?.size ?? 'boyutsuz'}) bu siparişte iade edilebilir değil.`);
        else if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > match.quantity) {
          errors.push(`Ürün #${it.perfumeId} için iade adedi 1 ile ${match.quantity} arasında olmalıdır.`);
        } else selected.push({ perfumeId: match.perfumeId, size: match.size, quantity: it.quantity });
      }
    }
  }
  if (!errors.length && selected.length === 0) errors.push('Bu siparişte iade edilebilecek ürün kalmadı.');
  if (errors.length) throw new ApiError(422, 'Doğrulama hatası.', errors);

  const returnItems = selected.map((s) => {
    const line = order.items.find((i) => i.perfumeId === s.perfumeId && i.size === s.size);
    return { ...s, name: line.name, unitPrice: line.unitPrice, refundAmount: line.unitPrice * s.quantity };
  });
  const request = {
    code: generateReturnCode(),
    status: 'requested',
    statusLabel: 'İade talebi alındı',
    reason,
    reasonLabel: RETURN_REASONS[reason],
    note: typeof note === 'string' && note.trim() ? note.trim() : null,
    items: returnItems,
    refundAmount: returnItems.reduce((n, i) => n + i.refundAmount, 0),
    createdAt: new Date().toISOString()
  };
  order.returns = [...(order.returns ?? []), request];
  saveStore();
  res.status(201).json({ message: `İade talebiniz oluşturuldu. İade kodunuz: ${request.code}`, data: { return: request, order: serializeOrder(order) } });
});

// ---------------------------------------------------------------------------
// Sıkça sorulan sorular (footer > SSS). Yanıtlar sitenin gerçek kurallarıyla uyumludur.
// ---------------------------------------------------------------------------

const FAQ = [
  {
    id: 'siparis',
    title: 'Sipariş ve kargo',
    items: [
      {
        q: 'Siparişimi nasıl takip edebilirim?',
        a: 'Giriş yaptıysanız menüdeki hesap simgesinden "Siparişlerim" sayfasına gidin; tüm siparişlerinizin durumunu adım adım görebilirsiniz. Giriş yapmadan da footer\'daki "Siparişinizi takip edin" bağlantısından sipariş numaranız (ör. ORD-4892) ve siparişi verdiğiniz e-posta adresiyle sorgulama yapabilirsiniz.'
      },
      {
        q: 'Siparişim ne zaman elime ulaşır?',
        a: 'Siparişler standart kargoyla 1–3 iş günü içinde teslim edilir; hafta sonları iş gününe sayılmaz. Tahmini teslimat tarih aralığını sipariş onay ekranında ve "Siparişlerim" sayfasında görebilirsiniz.'
      },
      {
        q: 'Kargo ücreti ne kadar?',
        a: 'Tüm siparişlerde kargo ücretsizdir.'
      },
      {
        q: 'Kargo takip numaramı nerede bulurum?',
        a: 'Siparişiniz kargoya verildiğinde AUR ile başlayan takip numarası "Siparişlerim" sayfasında, siparişin "Kargo ve teslimat" bölümünde görünür.'
      },
      {
        q: 'Sipariş verdikten sonra adresimi değiştirebilir miyim?',
        a: 'Sipariş oluşturulduktan sonra adres değiştirilemez. Siparişiniz henüz kargoya verilmediyse iptal edip doğru adresle yeniden sipariş verebilirsiniz.'
      }
    ]
  },
  {
    id: 'iptal-iade',
    title: 'İptal ve iade',
    items: [
      {
        q: 'Siparişimi iptal edebilir miyim?',
        a: 'Siparişiniz "Sipariş alındı" veya "Hazırlanıyor" durumundayken, yani kargoya verilmeden önce, "Siparişlerim" sayfasındaki "Siparişi iptal et" butonuyla iptal edebilirsiniz. İptal edilen siparişin tutarı kartınıza iade edilir.'
      },
      {
        q: 'Kargoya verilen siparişi iptal edebilir miyim?',
        a: 'Kargoya verilen siparişler iptal edilemez. Ürünü teslim aldıktan sonra iade talebi oluşturabilirsiniz.'
      },
      {
        q: 'Ürünü nasıl iade ederim?',
        a: 'Teslimattan itibaren 14 gün içinde "Siparişlerim" sayfasında siparişinizi seçip "İade talebi oluştur" butonuna tıklayın. İade etmek istediğiniz ürünleri ve adetleri seçip nedeni belirtin; size IAD- ile başlayan bir iade kodu verilir. Ürünleri orijinal kutusunda, iade kodunu paketin üzerine yazarak anlaşmalı kargo şubesine ücretsiz teslim edebilirsiniz.'
      },
      {
        q: 'Siparişin sadece bir kısmını iade edebilir miyim?',
        a: 'Evet. İade talebi oluştururken yalnızca iade etmek istediğiniz ürünleri ve adetleri seçebilirsiniz. Kalan ürünler için süre dolmadan ayrıca iade talebi oluşturabilirsiniz.'
      },
      {
        q: 'Açılmış veya kullanılmış bir parfümü iade edebilir miyim?',
        a: 'Hijyen nedeniyle yalnızca açılmamış ve ambalajı bozulmamış ürünler iade alınır. Ürün hasarlı veya yanlış geldiyse iade talebinde uygun nedeni seçmeniz yeterlidir.'
      },
      {
        q: 'İade ücretim ne zaman yatar?',
        a: 'Ürünler bize ulaşıp kontrol edildikten sonra iade tutarı ödeme yaptığınız karta yansıtılır. Kartınıza yansıma süresi bankanıza göre değişebilir.'
      }
    ]
  },
  {
    id: 'odeme',
    title: 'Ödeme ve güvenlik',
    items: [
      {
        q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
        a: 'Visa, Mastercard ve Troy logolu kredi ve banka kartlarıyla ödeme yapabilirsiniz.'
      },
      {
        q: 'Kart bilgilerim güvende mi?',
        a: 'Kart numaranız ve güvenlik kodunuz (CVC) sunucularımıza gönderilmez ve saklanmaz. Siparişinizde yalnızca kart türü ve son dört hane görünür.'
      },
      {
        q: 'Fiyatlara KDV dahil mi?',
        a: 'Evet, tüm fiyatlara %20 KDV dahildir. Sipariş özetinde KDV tutarı ayrıca gösterilir.'
      }
    ]
  },
  {
    id: 'hesap',
    title: 'Üyelik ve hesap',
    items: [
      {
        q: 'Sipariş vermek için üye olmam gerekiyor mu?',
        a: 'Hayır. Ödeme ekranında e-posta adresinizi yazarak üye olmadan sipariş verebilir, siparişinizi sipariş numaranız ve bu e-posta adresiyle takip edebilirsiniz. Üye olursanız tüm siparişlerinizi "Siparişlerim" sayfasında görür, iptal ve iade işlemlerini oradan yaparsınız.'
      },
      {
        q: 'Favorilerim nerede saklanıyor?',
        a: 'Favorileriniz hesabınıza kaydedilir; giriş yaptığınız her cihazda aynı favorileri görürsünüz.'
      },
      {
        q: 'Şifremi unuttum, ne yapmalıyım?',
        a: 'Şifre sıfırlama özelliği bu sunum projesinde bulunmuyor. Yeni bir e-posta adresiyle tekrar üye olabilir veya "Bize ulaşın" sayfasından mesaj bırakabilirsiniz.'
      }
    ]
  },
  {
    id: 'urunler',
    title: 'Ürünler',
    items: [
      {
        q: 'Bu sitede gerçekten alışveriş yapabilir miyim?',
        a: 'Hayır. Aura Perfumé bir sunum projesidir; sipariş, ödeme, kargo ve iade adımları uygulamanın işleyişini göstermek için simüle edilir. Gerçek ödeme alınmaz ve ürün gönderilmez. Ödeme ekranında gerçek kart bilgisi yerine test kartı (ör. 4242 4242 4242 4242) kullanın.'
      },
      {
        q: 'Bana uygun kokuyu nasıl bulabilirim?',
        a: '"Koku Testi" üç soruda tarzınıza uygun parfümleri önerir. "Akıllı Koku Bulucu" ise mevsim, kullanım zamanı ve koku ailesine göre filtreleme yapmanızı sağlar.'
      },
      {
        q: 'EDT, EDP ve Extrait arasındaki fark nedir?',
        a: 'Fark, esans yoğunluğundadır. Eau de Toilette (EDT) daha hafif ve ferahtır; Eau de Parfum (EDP) daha yoğun ve kalıcıdır; Extrait de Parfum en yüksek esans oranına sahiptir ve en uzun süre kalıcıdır.'
      }
    ]
  }
];

router.get('/faq', (req, res) => {
  res.json({ data: FAQ });
});

// İade talebini iptal et (yalnızca sahibi; talep henüz "alındı" durumundayken).
// İptal edilen talebin ürünleri yeniden iade edilebilir olur (iade süresi dolmadıysa).
router.post('/orders/:orderNumber/returns/:code/cancel', (req, res) => {
  const { user } = requireUser(req);
  const order = findOwnOrderOr404(user, req.params.orderNumber);
  const request = (order.returns ?? []).find((r) => r.code === String(req.params.code).toUpperCase());
  if (!request) throw new ApiError(404, `'${req.params.code}' kodlu iade talebi bu siparişte bulunamadı.`);
  if (request.status === 'cancelled') throw new ApiError(409, 'Bu iade talebi zaten iptal edilmiş.');
  if (request.status !== 'requested') throw new ApiError(409, 'Bu aşamadaki iade talebi iptal edilemez.');
  request.status = 'cancelled';
  request.statusLabel = 'İade talebi iptal edildi';
  request.cancelledAt = new Date().toISOString();
  saveStore();
  res.json({ message: `${request.code} kodlu iade talebi iptal edildi.`, data: serializeOrder(order) });
});

// ---------------------------------------------------------------------------
// Yasal metinler (footer > Yasal). Aura Perfumé bir SUNUM PROJESİDİR: gerçek satış yapılmaz,
// arkasında bir şirket yoktur. Metinler, gerçek bir mağazada nasıl olacağını gösteren örnek metinlerdir
// ve sitenin gerçekte hangi verileri işlediğine göre yazılmıştır.
// ---------------------------------------------------------------------------

const LEGAL_UPDATED_AT = '2026-09-30';
const DEMO_NOTICE =
  'Aura Perfumé bir sunum projesidir. Sitede gerçek satış yapılmaz, ödeme alınmaz ve ürün gönderilmez. Aşağıdaki metin, gerçek bir mağazada bu sayfanın nasıl olacağını gösteren örnek bir metindir.';

const LEGAL_PAGES = [
  {
    slug: 'yasal-uyari',
    title: 'Yasal uyarı',
    sections: [
      {
        heading: 'Site sahibi',
        body: [
          'Aura Perfumé, bir e-ticaret sitesinin nasıl çalıştığını göstermek için hazırlanmış bir sunum projesidir. Arkasında bir şirket bulunmaz; sitede gerçek satış yapılmaz, ödeme alınmaz ve ürün gönderilmez.',
          'Sipariş, ödeme, kargo ve iade adımları uygulamanın işleyişini göstermek için simüle edilir.'
        ]
      },
      {
        heading: 'Kullanım koşulları',
        body: [
          'Siteyi kullanarak bu koşulları kabul etmiş sayılırsınız. Site içeriği yalnızca kişisel ve ticari olmayan amaçlarla görüntülenebilir; izinsiz kopyalanamaz, çoğaltılamaz veya dağıtılamaz.',
          'Sitedeki ürün açıklamaları, koku notaları ve öneriler (Koku Testi, Akıllı Koku Bulucu) bilgilendirme amaçlıdır; kişisel koku algısı farklılık gösterebilir.'
        ]
      },
      {
        heading: 'Fikri mülkiyet',
        body: [
          'Sitede yer alan marka ve ürün adları ilgili hak sahiplerine aittir. Sitenin tasarımı, metinleri ve yazılımı üzerindeki haklar site sahibine aittir.'
        ]
      },
      {
        heading: 'Sorumluluğun sınırlandırılması',
        body: [
          'Site içeriğinin doğru ve güncel olması için özen gösterilir; ancak fiyat, stok ve ürün bilgilerinde oluşabilecek maddi hatalar nedeniyle siparişler iptal edilebilir. Bu durumda ödenen tutar eksiksiz iade edilir.'
        ]
      }
    ]
  },
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik politikası',
    sections: [
      {
        heading: 'Veri sorumlusu',
        body: [
          `Bu bir sunum projesi olduğu için gerçek bir veri sorumlusu şirket yoktur. Gerçek bir mağazada, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu mağazayı işleten şirket olurdu.`,
          'Demo sırasında girilen bilgiler yalnızca uygulamanın çalıştığı sunucuda tutulur ve hiçbir üçüncü tarafla paylaşılmaz. Lütfen gerçek kart bilgisi girmeyin; test kartları kullanın.'
        ]
      },
      {
        heading: 'İşlenen kişisel veriler',
        body: [
          'Kimlik ve iletişim: üyelikte ad-soyad ve e-posta adresi; siparişte alıcı adı, telefon ve teslimat adresi.',
          'Hesap güvenliği: şifreniz düz metin olarak saklanmaz; yalnızca geri döndürülemez şekilde şifrelenmiş (bcrypt) hali tutulur.',
          'Müşteri işlemleri: siparişler, iade ve iptal talepleri, favoriler, ürün değerlendirmeleri.',
          'Ödeme: kart numarası ve güvenlik kodu (CVC) sunucularımıza gönderilmez ve saklanmaz; siparişte yalnızca kart türü ve son dört hane tutulur.',
          'E-bülten: abone olmanız halinde e-posta adresiniz.'
        ]
      },
      {
        heading: 'İşleme amaçları ve hukuki sebepler',
        body: [
          'Üyelik oluşturma, siparişin alınması, teslimatı, iptal ve iade süreçlerinin yürütülmesi (KVKK m.5/2-c: sözleşmenin kurulması ve ifası).',
          'Yasal yükümlülüklerin yerine getirilmesi, ör. fatura ve kayıt saklama (KVKK m.5/2-ç).',
          'E-bülten gönderimi yalnızca açık rızanıza dayanır ve dilediğiniz zaman geri alınabilir (KVKK m.5/1).'
        ]
      },
      {
        heading: 'Aktarım',
        body: [
          'Kişisel verileriniz satılmaz. Teslimat için gerekli bilgiler (alıcı adı, adres, telefon) yalnızca kargo hizmet sağlayıcısıyla paylaşılır. Yetkili kamu kurumlarının yasal talepleri saklıdır.'
        ]
      },
      {
        heading: 'Saklama süresi',
        body: [
          'Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir.'
        ]
      },
      {
        heading: 'Haklarınız',
        body: [
          'KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme ve itiraz etme haklarına sahipsiniz.',
          'Gerçek bir mağazada başvurular şirketin iletişim adresine yapılır ve en geç 30 gün içinde yanıtlanır.'
        ]
      }
    ]
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez politikası',
    sections: [
      {
        heading: 'Çerez kullanıyor muyuz?',
        body: [
          'Sitemiz reklam veya takip amaçlı çerez kullanmaz ve üçüncü taraf analiz araçları çalıştırmaz.'
        ]
      },
      {
        heading: 'Tarayıcı depolaması (localStorage)',
        body: [
          'Sitenin çalışması için tarayıcınızın yerel depolama alanına yalnızca zorunlu bilgiler yazılır:',
          '"aura-cart-id": sepetinizi hatırlamak için rastgele üretilmiş bir kimlik. Kişisel bilgi içermez.',
          '"aura-auth-token": giriş yaptığınızda oturumunuzu sürdürmek için kullanılan anahtar. Çıkış yaptığınızda silinir; en fazla 7 gün geçerlidir.',
          'Bu bilgiler oturum ve sepet işlevleri için zorunlu olduğundan açık rıza gerektirmez. Tarayıcı ayarlarınızdan dilediğiniz zaman silebilirsiniz; bu durumda oturumunuz kapanır ve sepetiniz boşalır.'
        ]
      },
      {
        heading: 'Üçüncü taraf içerik',
        body: [
          'Sitede kullanılan yazı tipleri Google Fonts üzerinden yüklenir. Bu sırada tarayıcınız Google sunucularına bağlanır ve IP adresiniz Google tarafından işlenebilir. Ayrıntılar için Google\'ın gizlilik politikasına bakabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'satin-alma-hukumleri',
    title: 'Satın alma hükümleri',
    sections: [
      {
        heading: 'Taraflar ve kapsam',
        body: [
          'Sitede gerçek satış yapılmaz; aşağıdaki hükümler, gerçek bir mağazada satıcı ("Satıcı") ile sipariş veren kullanıcı ("Alıcı") arasındaki mesafeli satışın nasıl düzenleneceğini gösterir. Bu tür satışlar 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler Yönetmeliği\'ne tabidir.'
        ]
      },
      {
        heading: 'Sipariş ve fiyat',
        body: [
          'Sipariş üye olarak veya üye olmadan (e-posta adresiyle) verilebilir. Fiyatlar Türk lirası cinsindendir ve %20 KDV dahildir. Siparişin tutarı, ödeme anında sunucu tarafından sepetteki ürünlerin güncel fiyatları üzerinden hesaplanır.',
          'Sipariş, ödeme onayından sonra kesinleşir ve size ORD- ile başlayan bir sipariş numarası verilir.'
        ]
      },
      {
        heading: 'Teslimat',
        body: [
          'Siparişler standart kargo ile ücretsiz gönderilir ve 1–3 iş günü içinde teslim edilir (hafta sonları iş gününe sayılmaz). Yasal azami teslim süresi 30 gündür.'
        ]
      },
      {
        heading: 'İptal',
        body: [
          'Kargoya verilmemiş ("Sipariş alındı" veya "Hazırlanıyor" durumundaki) siparişler "Siparişlerim" sayfasından iptal edilebilir; ödenen tutarın tamamı iade edilir.'
        ]
      },
      {
        heading: 'Cayma hakkı ve iade',
        body: [
          'Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeden cayma hakkını kullanabilir. Cayma hakkı "Siparişlerim" sayfasından iade talebi oluşturularak kullanılır; size IAD- ile başlayan bir iade kodu verilir ve iade kargo ücreti Satıcı tarafından karşılanır.',
          'Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, tesliminden sonra ambalajı, bandı veya mührü açılmış olup iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde (ör. kullanılmış parfümler) cayma hakkı kullanılamaz.',
          'Ürün Satıcı\'ya ulaştıktan sonra en geç 14 gün içinde bedeli, ödemenin yapıldığı karta iade edilir.'
        ]
      },
      {
        heading: 'Uyuşmazlıklar',
        body: [
          'Uyuşmazlıklarda, Ticaret Bakanlığı\'nca ilan edilen parasal sınırlar dahilinde Alıcı\'nın veya Satıcı\'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.'
        ]
      }
    ]
  }
];

router.get('/legal', (req, res) => {
  res.json({ data: LEGAL_PAGES.map(({ slug, title }) => ({ slug, title })), updatedAt: LEGAL_UPDATED_AT });
});

router.get('/legal/:slug', (req, res) => {
  const page = LEGAL_PAGES.find((p) => p.slug === req.params.slug);
  if (!page) throw new ApiError(404, `'${req.params.slug}' yasal metni bulunamadı.`);
  res.json({ data: { ...page, updatedAt: LEGAL_UPDATED_AT, notice: DEMO_NOTICE } });
});

// İade nedenleri (form için)
router.get('/returns/reasons', (req, res) => {
  res.json({ data: Object.entries(RETURN_REASONS).map(([value, label]) => ({ value, label })) });
});

// DEMO: siparişi bir sonraki duruma ilerletir (gerçek depo/kargo sistemi olmadığı için sunumda kullanılır).
// Kargoya verildiğinde takip numarası atanır.
router.post('/orders/:orderNumber/advance', (req, res) => {
  const { user } = requireUser(req);
  const order = findOwnOrderOr404(user, req.params.orderNumber);
  const index = ORDER_STATUSES.findIndex((s) => s.key === order.status);
  if (order.status === CANCELLED.key) throw new ApiError(409, 'İptal edilmiş sipariş ilerletilemez.');
  if (index === ORDER_STATUSES.length - 1) throw new ApiError(409, 'Sipariş zaten teslim edildi.');
  const next = ORDER_STATUSES[index + 1].key;
  order.status = next;
  order.statusHistory.push({ status: next, at: new Date().toISOString() });
  if (next === 'shipped') order.shipping.trackingNumber = generateTrackingNumber();
  saveStore();
  res.json({ message: `Sipariş durumu: ${statusLabel(next)}.`, data: serializeOrder(order) });
});

// Sepeti boşalt
router.delete('/carts/:cartId', (req, res) => {
  const cart = getCart(req.params.cartId);
  cart.clear();
  res.json({ message: 'Sepet boşaltıldı.', data: serializeCart(req.params.cartId, cart) });
});

app.use('/api', router);

// ---------------------------------------------------------------------------
// Hata yönetimi
// ---------------------------------------------------------------------------

// 404 - bilinmeyen rota
app.use((req, res) => {
  res.status(404).json({ error: { status: 404, message: `Rota bulunamadı: ${req.method} ${req.originalUrl}` } });
});

// Genel hata yakalayıcı
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Bozuk JSON gövdesi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { status: 400, message: 'Geçersiz JSON gövdesi.' } });
  }
  if (err instanceof ApiError) {
    const body = { status: err.status, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json({ error: body });
  }
  console.error(err);
  res.status(500).json({ error: { status: 500, message: 'Sunucu hatası.' } });
});

// ---------------------------------------------------------------------------
// Kalıcılık: kullanıcılar, siparişler, favoriler, iptal edilen token'lar ve stoklar data/store.json'da.
// (Parfüm kataloğu, sepetler, yorumlar ve bülten bellekte kalır.)
// ---------------------------------------------------------------------------

const STORE_FILE = path.join(DATA_DIR, 'store.json');

function saveStore() {
  const snapshot = {
    version: 1,
    users,
    nextUserId,
    orders,
    nextOrderId,
    favorites: Object.fromEntries(favorites),
    revokedTokens: [...revokedTokens],
    contactMessages,
    stock: Object.fromEntries(perfumes.map((p) => [p.id, p.stock]))
  };
  // Önce geçici dosyaya yazıp yeniden adlandırılır; yazım yarıda kalırsa eski dosya bozulmaz
  const tmp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, STORE_FILE);
}

function loadStore() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('data/store.json okunamadı, boş başlatılıyor:', err.message);
    return;
  }
  users.push(...(data.users ?? []));
  nextUserId = data.nextUserId ?? users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
  orders.push(...(data.orders ?? []));
  nextOrderId = data.nextOrderId ?? orders.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  for (const [userId, ids] of Object.entries(data.favorites ?? {})) favorites.set(Number(userId), ids);
  for (const jti of data.revokedTokens ?? []) revokedTokens.add(jti);
  contactMessages.push(...(data.contactMessages ?? []));
  for (const [id, stock] of Object.entries(data.stock ?? {})) {
    const perfume = perfumes.find((p) => p.id === Number(id));
    if (perfume && Number.isInteger(stock)) perfume.stock = stock;
  }
  console.log(`Kayıtlı veri yüklendi: ${users.length} kullanıcı, ${orders.length} sipariş.`);
}

loadStore();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Perfume API http://localhost:${PORT} adresinde çalışıyor`);
  });
}

module.exports = app;
