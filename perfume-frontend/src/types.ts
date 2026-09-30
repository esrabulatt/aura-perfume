export interface Notes {
  top: string[];
  middle: string[];
  base: string[];
}

export interface Perfume {
  id: number;
  name: string;
  brand: string;
  gender: 'erkek' | 'kadın' | 'unisex';
  concentration: string;
  family: string;
  notes: Notes;
  price: number;
  rating: number;
  stock: number;
  volumeMl?: number | null;
  releaseYear?: number | null;
  image?: string | null;
  // kartın üzerine gelince gösterilen ikinci görsel (ör. kutu)
  hoverImage?: string | null;
  // Boyut seçenekleri: variants boyuta özel fiyat taşır; sizes varsa hepsi ana fiyattan satılır
  variants?: SizeOption[];
  sizes?: string[];
  // API şu an bu alanı döndürmüyor; eklenirse otomatik kullanılır
  description?: string;
}

export interface SizeOption {
  size: string;
  price: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PerfumeListResponse {
  data: Perfume[];
  pagination: Pagination;
}

export interface CartItem {
  perfume: Perfume;
  size: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

export interface QuizOption {
  label: string;
  /** Backend'e gönderilen değer (puanlamada kullanılır) */
  value: string;
  /** Kartta başlığın altındaki kısa açıklama */
  description?: string;
  /** Kart arka plan görseli (örn. /images/banners/fresh-ocean.jpg) */
  image?: string | null;
  /** Görsel yokken veya yüklenemezse kullanılan CSS gradyanı */
  gradient?: string | null;
  /** Kırpmada görselin hangi kısmı ortada kalsın (CSS object-position, ör. "50% 40%") */
  imagePosition?: string;
}

export interface QuizQuestion {
  key: string;
  title: string;
  options: QuizOption[];
}

export interface QuizRecommendation {
  perfume: Perfume;
  score: number;
}

export type Season = 'all' | 'summer' | 'winter';
export type TimeOfDay = 'all' | 'day' | 'night';
export type ScentFamily = 'all' | 'woody' | 'floral' | 'fresh' | 'spicy';

// ---------------------------------------------------------------------------
// Müşteri değerlendirmeleri
// ---------------------------------------------------------------------------

export interface Review {
  id: number;
  perfumeId: number;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  /** Ürünü satın aldığı doğrulanmış müşteri */
  verifiedBuyer: boolean;
  /** ISO 8601 tarih */
  createdAt: string;
}

export interface ReviewSummary {
  /** Ortalama puan (tek ondalık); hiç yorum yoksa null */
  average: number | null;
  count: number;
  /** Her yıldız değerine düşen yorum sayısı */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewListResponse {
  data: Review[];
  summary: ReviewSummary;
  pagination: Pagination;
}

export interface NewReview {
  author: string;
  rating: number;
  title: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Öneri kartları (backend'in döndürdüğü sade ürün özeti)
// ---------------------------------------------------------------------------

export interface ProductCard {
  id: number;
  name: string;
  brand: string;
  concentration: string;
  /** Örn. "100 ml"; hacim bilinmiyorsa null */
  volumeLabel: string | null;
  price: number;
  image: string | null;
  hoverImage: string | null;
  rating: number | null;
  inStock: boolean;
}

// ---------------------------------------------------------------------------
// Akıllı Koku Bulucu filtre kartları (GET /api/finder/options)
// ---------------------------------------------------------------------------

export interface FinderFilter {
  /** /api/perfumes sorgu parametresinin adı */
  key: 'season' | 'time' | 'scentFamily';
  label: string;
  /** Kart seçenekleri; value'lar Season / TimeOfDay / ScentFamily değerleridir */
  options: QuizOption[];
}

// Sayfaların alt kısmındaki editoryal banner (GET /api/finder/options ve /api/quiz/questions -> banners)
export interface EditorialBanner {
  image: string;
  eyebrow: string;
  title: string;
  /** Tıklanınca uygulanacak Koku Bulucu filtresi; null ise yalnızca görsel */
  filter: { key: FinderFilter['key']; value: string } | null;
}

// Menü çubuğunun rengi: hero'daki aktif görselin tonlarına uyar; null = varsayılan (beyaz)
export interface NavTheme {
  /** Menü arka plan rengi (görselin baskın tonu) */
  background: string;
  /** true: koyu zemin, açık yazı */
  dark: boolean;
}

// ---------------------------------------------------------------------------
// Üyelik
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  /** JWT; isteklerde "Authorization: Bearer <token>" olarak gönderilir */
  token: string;
}

// ---------------------------------------------------------------------------
// Siparişler
// ---------------------------------------------------------------------------

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'troy' | 'kart';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
}

export interface OrderItem {
  perfumeId: number;
  name: string;
  brand: string;
  image: string | null;
  size: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  /** Misafir siparişinde null */
  userId: number | null;
  /** Siparişte kullanılan e-posta (eski siparişlerde olmayabilir) */
  email?: string;
  /** Örn. ORD-8392 */
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  /** Sunucuda belirlenen kargo bilgisi */
  shipping: {
    method: string;
    cost: number;
    estimatedDelivery: { minBusinessDays: number; maxBusinessDays: number; from: string; to: string };
    /** Kargoya verilince atanır */
    trackingNumber: string | null;
  };
  /** Kart bilgisinden yalnızca tür ve son 4 hane saklanır */
  payment: { brand: CardBrand; last4: string };
  totalAmount: number;
  paymentStatus: 'paid' | 'refunded';
  status: OrderStatus;
  statusLabel: string;
  statusHistory: { status: OrderStatus; at: string }[];
  /** Tüm durum adımları; tamamlananların completedAt değeri dolu */
  steps: { key: OrderStatus; label: string; completedAt: string | null }[];
  /** Kargoya verilmeden önce iptal edilebilir */
  cancellable: boolean;
  cancellation?: { reason: string | null; at: string; refundAmount: number };
  /** Teslimattan sonra 14 gün içinde iade talebi oluşturulabilir */
  returnable: boolean;
  returnDeadline: string | null;
  /** Henüz iade talebine konmamış ürünler ve adetleri */
  returnableItems: { perfumeId: number; size: string | null; quantity: number }[];
  returns: ReturnRequest[];
  createdAt: string;
}

export interface ReturnRequest {
  /** Örn. IAD-4K7Q9M */
  code: string;
  status: 'requested' | 'cancelled';
  statusLabel: string;
  cancelledAt?: string;
  reason: string;
  reasonLabel: string;
  note: string | null;
  items: { perfumeId: number; size: string | null; quantity: number; name: string; unitPrice: number; refundAmount: number }[];
  refundAmount: number;
  createdAt: string;
}

export type OrderStatus = 'received' | 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

/** Giriş yapmadan takip yanıtı: ödeme ve telefon bilgisi içermez */
export type TrackedOrder = Omit<Order, 'payment' | 'shippingAddress'> & {
  shippingAddress: Omit<ShippingAddress, 'phone'>;
};

export interface NewOrder {
  cartId: string;
  shippingAddress: ShippingAddress;
  payment: { brand: CardBrand; last4: string };
  /** Yalnızca misafir siparişinde (giriş yapılmamışsa) */
  email?: string;
}
