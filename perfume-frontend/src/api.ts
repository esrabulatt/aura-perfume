import type {
  AuthResponse,
  NewOrder,
  Order,
  TrackedOrder,
  ReturnRequest,
  Cart,
  User,
  EditorialBanner,
  NewReview,
  Perfume,
  PerfumeListResponse,
  ProductCard,
  QuizQuestion,
  QuizRecommendation,
  Review,
  ReviewListResponse,
  ReviewSummary,
  ScentFamily,
  Season,
  TimeOfDay,
} from './types';

import type { FaqSection } from './FaqPage';
import type { LegalDocument } from './LegalPage';

const API_URL = 'http://localhost:3000/api';

// Oturumlu bir istek 401 dönerse (token geçersiz / süresi dolmuş) App'e haber verilir:
// App oturumu yerelde kapatır ve giriş penceresini açar.
let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

// Tüm backend istekleri buradan geçer; hata olursa API'nin döndürdüğü mesaj fırlatılır
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('API sunucusuna ulaşılamadı. Backend çalışıyor mu? (http://localhost:3000)', { cause: err });
  }

  const body = await response.json().catch(() => null);
  const sentToken = new Headers(init.headers).has('Authorization');
  // /auth/me: sayfa açılışındaki sessiz doğrulama; App geçersiz token'ı pencere açmadan temizler
  if (response.status === 401 && sentToken && path !== '/auth/me') unauthorizedHandler?.();
  if (!response.ok) {
    // 422 gibi yanıtlarda asıl bilgi "details" listesindedir (ör. "Şifre en az 8 karakter olmalıdır.")
    const details: string[] | undefined = body?.error?.details;
    throw new Error(
      details?.length ? details.join(' ') : (body?.error?.message ?? `İstek başarısız oldu (HTTP ${response.status}).`)
    );
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

// Aynı parfümün farklı boyutları sepette ayrı satırdır; hangisi olduğu ?size= ile belirtilir
const cartItemPath = (cartId: string, perfumeId: number, size: string | null) =>
  `/carts/${cartId}/items/${perfumeId}${size ? `?size=${encodeURIComponent(size)}` : ''}`;

export interface ListPerfumesParams {
  q?: string;
  sort?: 'id' | 'price' | 'rating' | 'releaseYear';
  order?: 'asc' | 'desc';
  limit?: number;
  // Scent Finder filtreleri ('all' = filtre yok)
  season?: Season;
  time?: TimeOfDay;
  scentFamily?: ScentFamily;
}

export const api = {
  // Parfümler
  listPerfumes: (params: ListPerfumesParams, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    return request<PerfumeListResponse>(`/perfumes?${query}`, { signal });
  },
  getPerfume: (id: number, signal?: AbortSignal) =>
    request<{ data: Perfume; navigation: { prevId: number; nextId: number } }>(`/perfumes/${id}`, { signal }),
  getStats: (signal?: AbortSignal) =>
    request<{ data: { totalPerfumes: number } }>('/stats', { signal }).then((r) => r.data),

  // Koku testi
  getQuizQuestions: (signal?: AbortSignal) =>
    request<{ data: QuizQuestion[]; banners: EditorialBanner[] }>('/quiz/questions', { signal }),
  getQuizRecommendations: (answers: Record<string, string>, signal?: AbortSignal) =>
    request<{ data: QuizRecommendation[] }>('/quiz/recommendations', {
      method: 'POST',
      body: json(answers),
      signal,
    }).then((r) => r.data),

  // Sepet
  getCart: (cartId: string) => request<{ data: Cart }>(`/carts/${cartId}`).then((r) => r.data),
  addToCart: (cartId: string, perfumeId: number, quantity: number, size?: string | null) =>
    request<{ data: Cart }>(`/carts/${cartId}/items`, {
      method: 'POST',
      body: json({ perfumeId, quantity, size: size ?? undefined }),
    }).then((r) => r.data),
  updateCartItem: (cartId: string, perfumeId: number, size: string | null, quantity: number) =>
    request<{ data: Cart }>(cartItemPath(cartId, perfumeId, size), {
      method: 'PATCH',
      body: json({ quantity }),
    }).then((r) => r.data),
  removeCartItem: (cartId: string, perfumeId: number, size: string | null) =>
    request<{ data: Cart }>(cartItemPath(cartId, perfumeId, size), { method: 'DELETE' }).then((r) => r.data),

  // Yorumlar ve öneriler
  getReviews: (perfumeId: number, page: number, limit: number, signal?: AbortSignal) =>
    request<ReviewListResponse>(`/perfumes/${perfumeId}/reviews?page=${page}&limit=${limit}`, { signal }),
  createReview: (perfumeId: number, review: NewReview) =>
    request<{ message: string; data: Review; summary: ReviewSummary }>(`/perfumes/${perfumeId}/reviews`, {
      method: 'POST',
      body: json(review),
    }),
  getRecommendations: (perfumeId: number, signal?: AbortSignal) =>
    request<{ data: ProductCard[] }>(`/perfumes/${perfumeId}/recommendations?limit=8`, { signal }).then((r) => r.data),

  // Üyelik (JWT)
  register: (name: string, email: string, password: string) =>
    request<{ data: AuthResponse }>('/auth/register', { method: 'POST', body: json({ name, email, password }) }).then(
      (r) => r.data
    ),
  login: (email: string, password: string) =>
    request<{ data: AuthResponse }>('/auth/login', { method: 'POST', body: json({ email, password }) }).then((r) => r.data),
  me: (token: string, signal?: AbortSignal) =>
    request<{ data: User }>('/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal }).then((r) => r.data),
  logout: (token: string) =>
    request<{ message: string }>('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),

  // Siparişler: üye girişi isteğe bağlı (token yoksa misafir siparişi, e-posta zorunlu)
  createOrder: (token: string | null, order: NewOrder) =>
    request<{ message: string; data: Order }>('/orders', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: json(order),
    }).then((r) => r.data),
  trackOrder: (orderNumber: string, email: string) =>
    request<{ data: TrackedOrder }>(
      `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
    ).then((r) => r.data),
  /** DEMO: siparişi bir sonraki duruma ilerletir (gerçek kargo sistemi yok) */
  advanceOrder: (token: string, orderNumber: string) =>
    request<{ data: Order }>(`/orders/${encodeURIComponent(orderNumber)}/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),
  cancelOrder: (token: string, orderNumber: string, reason: string) =>
    request<{ message: string; data: Order }>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: json({ reason }),
    }).then((r) => r.data),
  createReturn: (
    token: string,
    orderNumber: string,
    body: { reason: string; note?: string; items: { perfumeId: number; size: string | null; quantity: number }[] }
  ) =>
    request<{ message: string; data: { return: ReturnRequest; order: Order } }>(
      `/orders/${encodeURIComponent(orderNumber)}/returns`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: json(body) }
    ).then((r) => r.data),
  getLegal: (slug: string, signal?: AbortSignal) =>
    request<{ data: LegalDocument }>(`/legal/${encodeURIComponent(slug)}`, { signal }).then((r) => r.data),
  getContactSubjects: () => request<{ data: { value: string; label: string }[] }>('/contact/subjects').then((r) => r.data),
  // Oturum varsa token eklenir (mesaj hesaba bağlanır); zorunlu değil
  sendContact: (
    body: { name: string; email: string; subject: string; orderNumber?: string; message: string },
    token?: string | null
  ) =>
    request<{ message: string; data: { ticket: string } }>('/contact', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: json(body),
    }).then((r) => r.data),
  getFaq: () => request<{ data: FaqSection[] }>('/faq').then((r) => r.data),
  cancelReturn: (token: string, orderNumber: string, code: string) =>
    request<{ message: string; data: Order }>(
      `/orders/${encodeURIComponent(orderNumber)}/returns/${encodeURIComponent(code)}/cancel`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    ).then((r) => r.data),
  getReturnReasons: () => request<{ data: { value: string; label: string }[] }>('/returns/reasons').then((r) => r.data),
  getMyOrders: (token: string, signal?: AbortSignal) =>
    request<{ data: Order[] }>('/orders/my-orders', { headers: { Authorization: `Bearer ${token}` }, signal }).then(
      (r) => r.data
    ),

  // Favoriler (hesaba bağlı, JWT gerekir)
  getFavorites: (token: string, signal?: AbortSignal) =>
    request<{ data: ProductCard[] }>('/favorites', { headers: { Authorization: `Bearer ${token}` }, signal }).then((r) => r.data),
  addFavorite: (token: string, perfumeId: number) =>
    request<{ data: ProductCard[] }>(`/favorites/${perfumeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),
  removeFavorite: (token: string, perfumeId: number) =>
    request<{ data: ProductCard[] }>(`/favorites/${perfumeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  // E-bülten
  subscribeNewsletter: (email: string) =>
    request<{ message: string; data: { email: string; alreadySubscribed: boolean } }>('/newsletter', {
      method: 'POST',
      body: json({ email }),
    }),
};

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
