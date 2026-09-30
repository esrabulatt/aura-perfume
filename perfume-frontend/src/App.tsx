import { useState, useEffect, useRef, useCallback } from 'react';
import type { AuthResponse, Cart, NavTheme, Order, User, Perfume, ProductCard as ProductCardData, QuizQuestion, QuizRecommendation } from './types';
import HeroSlider from './HeroSlider';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import SearchBar from './SearchBar';
import Navbar, { SideMenu } from './Navbar';
import FavoritesDrawer from './FavoritesDrawer';
import FavoriteButton from './FavoriteButton';
import { FavoritesContext } from './favorites';
import AuthModal, { type AuthMode } from './AuthModal';
import CheckoutModal from './CheckoutModal';
import OrdersPage from './OrdersPage';
import FaqPage from './FaqPage';
import LegalPage from './LegalPage';
import ContactPage from './ContactPage';
import { AuthContext, loadToken, saveToken } from './auth';
import SizeSelector from './SizeSelector';
import ProductInfo from './ProductInfo';
import QuizOptionCard from './QuizOptionCard';
import ScentFinder from './ScentFinder';
import EditorialBanners from './EditorialBanners';
import { getSelectedId } from './routes';
import Reviews from './Reviews';
import Recommendations from './Recommendations';
import { getSizeOptions, getDefaultSize } from './sizes';
import { api, errorMessage, setUnauthorizedHandler, type ListPerfumesParams } from './api';
import { useApiQuery } from './useApiQuery';
import { ShoppingBag, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eef2ff"/><rect x="85" y="40" width="30" height="20" rx="3" fill="#a5b4fc"/><rect x="60" y="60" width="80" height="100" rx="14" fill="#c7d2fe" stroke="#818cf8" stroke-width="3"/></svg>`
  );

// Görseli olmayan parfümde başka bir markanın fotoğrafı yerine nötr bir şişe göster
const getImage = (perfume: Perfume) => perfume.image || PLACEHOLDER_IMAGE;

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
};

// Kart görseli: hoverImage varsa, kartın (group) üzerine gelince yumuşak geçişle o görünür
function CardImage({ perfume }: { perfume: Perfume }) {
  const zoom = 'h-full w-full object-cover transition-opacity duration-500';
  return (
    <>
      <img
        src={getImage(perfume)}
        alt={perfume.name}
        loading="lazy" decoding="async"
        className={`${zoom} ${perfume.hoverImage ? 'group-hover:opacity-0' : ''}`}
        onError={handleImageError}
      />
      {perfume.hoverImage && (
        // Hover görselleri beyaz zeminli ürün çekimleri: karta sığdırıp etrafında boşluk bırakıyoruz ki çok yakın durmasın
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <img
            src={perfume.hoverImage}
            alt=""
            aria-hidden
            loading="lazy" decoding="async"
            className="h-full w-full object-contain p-[14%]"
            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
          />
        </div>
      )}
    </>
  );
}

interface ProductCardProps {
  perfume: Perfume;
  onSelect: (id: number) => void;
  onAddToCart?: (perfume: Perfume) => void;
}

// Sade ürün kartı: gri zeminde uzun görsel (üzerine gelince hover görseli), altında isim, marka ve fiyat
function ProductCard({ perfume, onSelect, onAddToCart }: ProductCardProps) {
  const soldOut = perfume.stock === 0;
  return (
    <article className="group relative bg-white">
      <button onClick={() => onSelect(perfume.id)} className="block w-full text-left cursor-pointer">
        <div className="relative aspect-[4/5] bg-[#ececec] overflow-hidden">
          <CardImage perfume={perfume} />
          {soldOut && (
            <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-600">
              Tükendi
            </span>
          )}
        </div>
        <div className="px-3 pt-4 pb-6">
          <h3 className="text-[15px] font-medium text-neutral-900 leading-snug">
            {perfume.name}
            {perfume.volumeMl ? ` ${perfume.volumeMl} ml` : ''}
          </h3>
          <p className="mt-1 text-[13px] text-neutral-500">
            {perfume.brand} · {perfume.concentration}
          </p>
          <p className="mt-2 text-[13px] text-neutral-900">₺{perfume.price.toLocaleString('tr-TR')}</p>
        </div>
      </button>

      <FavoriteButton
        perfume={perfume}
        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
        size="w-[18px] h-[18px]"
      />

      {onAddToCart && !soldOut && (
        <button
          onClick={() => onAddToCart(perfume)}
          aria-label={`${perfume.name} sepete ekle`}
          title="Sepete Ekle"
          className="absolute top-16 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 flex items-center justify-center shadow-sm transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </article>
  );
}

// Kartlar arasında ince beyaz boşluk bırakan ızgara
const productGridClass = 'grid grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white';


// Her tarayıcının sepeti backend'de bu kimlikle tutulur
const CART_ID_KEY = 'aura-cart-id';

const getCartId = () => {
  const generate = () =>
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    localStorage.removeItem('aura-cart'); // eski, tarayıcıda tutulan sepet
    const saved = localStorage.getItem(CART_ID_KEY);
    if (saved) return saved;
    const id = generate();
    localStorage.setItem(CART_ID_KEY, id);
    return id;
  } catch {
    return generate();
  }
};

type TabType = 'collection' | 'finder' | 'quiz';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

// Her seçenek, backend'in sort/order sorgu parametrelerine karşılık gelir
const SORT_OPTIONS: { value: SortOption; label: string; params: Pick<ListPerfumesParams, 'sort' | 'order'> }[] = [
  { value: 'default', label: 'Önerilen', params: { sort: 'id', order: 'asc' } },
  { value: 'price-asc', label: 'Fiyata Göre (Artan)', params: { sort: 'price', order: 'asc' } },
  { value: 'price-desc', label: 'Fiyata Göre (Azalan)', params: { sort: 'price', order: 'desc' } },
  { value: 'rating', label: 'Puana Göre', params: { sort: 'rating', order: 'desc' } },
  { value: 'newest', label: 'Yeniden Eskiye', params: { sort: 'releaseYear', order: 'desc' } },
];

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" role="status">
      <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" strokeWidth={1.4} aria-hidden />
      <p className="text-[14px] text-neutral-500">{label}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="max-w-md mx-auto my-16 border border-neutral-300 bg-white px-8 py-10 text-center">
      <p className="text-[16px] text-neutral-900">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 h-11 px-8 rounded-md bg-neutral-900 hover:bg-neutral-700 text-white text-[14px] transition-colors cursor-pointer"
      >
        Tekrar dene
      </button>
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(getSelectedId);
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [cartId] = useState(getCartId);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  // Favoriler hesaba bağlı: giriş yapılınca GET /api/favorites ile yüklenir, çıkışta temizlenir
  // Liste hangi kullanıcıya ait, onunla birlikte tutulur; oturum yoksa / başka kullanıcıysa boş sayılır
  const [favoritesState, setFavoritesState] = useState<{ userId: number | null; items: ProductCardData[] }>({
    userId: null,
    items: [],
  });
  // Giriş yapmadan kalbe basılan parfüm: girişten sonra favorilere eklenir
  const pendingFavorite = useRef<number | null>(null);
  // Giriş penceresinde gösterilecek bilgi (ör. oturum süresi doldu)
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Üyelik: JWT localStorage'da; kullanıcı bilgisi GET /api/auth/me ile doğrulanır
  const [token, setToken] = useState<string | null>(loadToken);
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  // Ödeme: giriş yapılmadan "Ödemeye geç"e basılırsa, girişten sonra ödeme ekranı açılır
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAfterAuth, setCheckoutAfterAuth] = useState(false);
  // Her açılışta ödeme akışı 1. adımdan başlasın diye anahtar
  const [checkoutSession, setCheckoutSession] = useState(0);
  // Sipariş takibi: giriş yapılmışsa "Siparişlerim", değilse numara + e-posta ile sorgulama
  const [ordersOpen, setOrdersOpen] = useState(false);
  // SSS: null = kapalı; string = açık (boş dize: en baştan, aksi halde o bölüm)
  const [faqSection, setFaqSection] = useState<string | null>(null);
  // Yasal metinler: açık metnin slug'ı (null = kapalı)
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [guestOrder, setGuestOrder] = useState<Order | null>(null); // son misafir siparişi (takip için)
  // Menü rengi: hero'daki aktif görselden gelir (HeroSlider bildirir); null = beyaz
  const [heroTheme, setHeroTheme] = useState<NavTheme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const listScrollY = useRef(0);

  // GET /api/carts/:cartId -> sayfa açılınca backend'deki sepeti getir
  useEffect(() => {
    api
      .getCart(cartId)
      .then(setCart)
      .catch((err) => setCartError(errorMessage(err)));
  }, [cartId]);

  useEffect(() => {
    const onHashChange = () => {
      const id = getSelectedId();
      setSelectedId(id);
      requestAnimationFrame(() => window.scrollTo(0, id === null ? listScrollY.current : 0));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Sepet işlemleri backend'de yapılır; dönen güncel sepet ekrana yansıtılır
  const updateCart = async (action: () => Promise<Cart>) => {
    setCartError(null);
    try {
      setCart(await action());
    } catch (err) {
      setCartError(errorMessage(err));
    }
  };

  // size verilmezse backend ürünün varsayılan boyutunu kullanır (kartlardaki hızlı ekleme)
  const addToCart = (perfume: Perfume, quantity = 1, size?: string | null) => {
    setCartOpen(true);
    updateCart(() => api.addToCart(cartId, perfume.id, quantity, size));
  };

  // Öneri kartlarındaki hızlı ekleme: yalnızca id ile, varsayılan boyutta
  const addToCartById = (perfumeId: number) => {
    setCartOpen(true);
    updateCart(() => api.addToCart(cartId, perfumeId, 1));
  };

  const changeCartQuantity = (id: number, size: string | null, quantity: number) =>
    updateCart(() =>
      quantity <= 0 ? api.removeCartItem(cartId, id, size) : api.updateCartItem(cartId, id, size, quantity)
    );

  // Kayıtlı token varsa sayfa açılışında doğrula; geçersiz / süresi dolmuşsa temizle
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    api
      .me(token, controller.signal)
      .then(setUser)
      .catch(() => {
        if (controller.signal.aborted) return;
        saveToken(null);
        setToken(null);
        setUser(null);
      });
    return () => controller.abort();
  }, [token]);

  const handleAuthenticated = ({ user: signedIn, token: newToken }: AuthResponse) => {
    saveToken(newToken);
    setToken(newToken);
    setUser(signedIn);
    setAuthModal(null);
    setAuthNotice(null);
    if (checkoutAfterAuth) {
      setCheckoutAfterAuth(false);
      setCheckoutSession((n) => n + 1);
      setCheckoutOpen(true);
    }
  };

  // Üyelik zorunlu değil: giriş yapılmamışsa misafir olarak ödeme açılır
  const startCheckout = () => {
    setCartOpen(false);
    setCheckoutSession((n) => n + 1);
    setCheckoutOpen(true);
  };

  // POST /api/orders başarılı: sunucu sepeti boşalttı; güncel (boş) sepeti al.
  // Onay, ödeme akışının 3. adımında gösterilir.
  const handleOrderPlaced = () => {
    api
      .getCart(cartId)
      .then(setCart)
      .catch(() => setCart((c) => (c ? { ...c, items: [], totalQuantity: 0, totalPrice: 0 } : c)));
  };
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const closeOrders = useCallback(() => setOrdersOpen(false), []);

  // Tam sayfa görünümler (Siparişlerim, SSS, Ödeme) tarayıcı geçmişine tek bir kayıt olarak eklenir:
  // tarayıcının geri tuşu siteden çıkmak yerine açık görünümü kapatır.
  const overlayOpen = ordersOpen || faqSection !== null || checkoutOpen || legalSlug !== null || contactOpen;
  const overlayEntry = useRef(false); // geçmişe kayıt eklendi mi
  const skipHistoryBack = useRef(false); // kapanırken geçmişe dokunma (ör. logoyla ana sayfaya gidiş)
  useEffect(() => {
    if (overlayOpen && !overlayEntry.current) {
      window.history.pushState({ auraOverlay: true }, '');
      overlayEntry.current = true;
    } else if (!overlayOpen && overlayEntry.current) {
      overlayEntry.current = false;
      if (skipHistoryBack.current) skipHistoryBack.current = false;
      else window.history.back(); // butonla kapatıldı: eklenen kaydı geri al
    }
  }, [overlayOpen]);
  useEffect(() => {
    const onPopState = () => {
      if (!overlayEntry.current) return;
      overlayEntry.current = false; // kayıt zaten geri tuşuyla silindi
      setOrdersOpen(false);
      setFaqSection(null);
      setCheckoutOpen(false);
      setLegalSlug(null);
      setContactOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const closeFaq = useCallback(() => setFaqSection(null), []);
  const closeLegal = useCallback(() => setLegalSlug(null), []);
  const closeContact = useCallback(() => setContactOpen(false), []);
  // Ödeme onayından doğrudan sipariş takibine geçiş
  const openOrders = (order: Order) => {
    setCheckoutOpen(false);
    if (!user) setGuestOrder(order); // misafir: sipariş takip sayfasında doğrudan gösterilir
    setOrdersOpen(true);
  };

  const logout = () => {
    // Sunucuda token iptal edilir; istek başarısız olsa bile yerelde oturum kapanır
    if (token) api.logout(token).catch(() => {});
    saveToken(null);
    setToken(null);
    setUser(null);
    setCheckoutOpen(false);
  };

  // Oturumlu bir istek 401 dönerse (token geçersiz / süresi dolmuş): hata göstermeden oturumu
  // yerelde kapat ve giriş penceresini açıklamayla aç
  useEffect(() => {
    setUnauthorizedHandler(() => {
      saveToken(null);
      setToken(null);
      setUser(null);
      setCheckoutOpen(false);
      setOrdersOpen(false);
      setAuthNotice('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
      setAuthModal('login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Favoriler hesaba bağlı: giriş yoksa panel yerine giriş penceresi
  const openFavorites = () => {
    if (user) {
      setFavoritesOpen(true);
    } else {
      setAuthNotice('Favorilerinizi görmek için giriş yapın veya üye olun.');
      setAuthModal('login');
    }
  };
  const authContext = { user, openAuth: (mode: AuthMode = 'login') => setAuthModal(mode), logout };
  const closeAuth = useCallback(() => {
    setAuthModal(null);
    setAuthNotice(null);
    setCheckoutAfterAuth(false);
    pendingFavorite.current = null;
  }, []);

  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeFavorites = useCallback(() => setFavoritesOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Eski sürümden kalan, tarayıcıya kayıtlı favorileri temizle
  useEffect(() => {
    try {
      localStorage.removeItem('aura-favorites');
    } catch {
      // depolama kapalıysa yapılacak bir şey yok
    }
  }, []);

  // Giriş yapılınca favorileri hesaptan yükle; bekleyen (girişten önce seçilen) favoriyi ekle
  const favorites = user && favoritesState.userId === user.id ? favoritesState.items : [];
  const setFavoritesFor = (userId: number) => (items: ProductCardData[]) => setFavoritesState({ userId, items });

  useEffect(() => {
    if (!user || !token) return;
    const pending = pendingFavorite.current;
    pendingFavorite.current = null;
    (pending ? api.addFavorite(token, pending) : api.getFavorites(token))
      .then((items) => setFavoritesState({ userId: user.id, items }))
      .catch(() => {});
  }, [user, token]);

  const favoriteIds = new Set(favorites.map((f) => f.id));
  const toggleFavorite = (perfume: Perfume) => {
    if (!user || !token) {
      pendingFavorite.current = perfume.id;
      setAuthNotice('Favorilerinizi kaydetmek için giriş yapın veya üye olun.');
      setAuthModal('login');
      return;
    }
    const action = favoriteIds.has(perfume.id) ? api.removeFavorite : api.addFavorite;
    action(token, perfume.id).then(setFavoritesFor(user.id)).catch(() => {});
  };
  const removeFavorite = (perfumeId: number) => {
    if (user && token) api.removeFavorite(token, perfumeId).then(setFavoritesFor(user.id)).catch(() => {});
  };
  const favoritesContext = { isFavorite: (id: number) => favoriteIds.has(id), toggleFavorite };


  const openDetail = (id: number) => {
    listScrollY.current = window.scrollY;
    window.location.assign(`#/perfume/${id}`);
  };

  const goHome = () => {
    window.location.assign('#');
  };

  // Logo: her yerden ana sayfanın en üstüne döner (açık panelleri de kapatır)
  const goToHomePage = () => {
    // Açık tam sayfa görünüm kapanırken history.back() yapılmasın; aşağıdaki gezinme bozulmasın
    if (overlayEntry.current) skipHistoryBack.current = true;
    setCartOpen(false);
    setFavoritesOpen(false);
    setMenuOpen(false);
    setCheckoutOpen(false);
    setOrdersOpen(false);
    setFaqSection(null);
    setLegalSlug(null);
    setContactOpen(false);
    setActiveTab('collection');
    listScrollY.current = 0;
    if (getSelectedId() !== null) {
      goHome(); // hashchange işleyicisi sayfayı en üste kaydırır
    } else {
      // Zaten ana sayfadaysak adres değişmez; doğrudan en üste kaydır
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToCollection = () =>
    requestAnimationFrame(() => document.getElementById('koleksiyon')?.scrollIntoView({ behavior: 'smooth' }));

  // Footer'daki "Keşfet" bağlantıları: detay sayfasındaysak ana sayfaya dönüp ilgili bölümü açar
  const openView = (tab: TabType) => {
    setActiveTab(tab);
    if (selectedId !== null) {
      listScrollY.current = 0;
      goHome();
    }
    scrollToCollection();
  };

  const submitSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('collection');
    if (selectedId !== null) {
      listScrollY.current = 0;
      goHome();
    }
    scrollToCollection();
  };

  return (
    <AuthContext.Provider value={authContext}>
    <FavoritesContext.Provider value={favoritesContext}>
    <div className="min-h-screen bg-neutral-100/70 text-neutral-800">
      <Navbar
        theme={selectedId === null && activeTab === 'collection' ? heroTheme : null}
        cartCount={cart?.totalQuantity ?? 0}
        favoritesCount={favorites.length}
        onGoHome={goToHomePage}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenFavorites={openFavorites}
        onOpenOrders={() => setOrdersOpen(true)}
        onContact={() => setContactOpen(true)}
        renderSearch={(close) => (
          <SearchBar
            autoFocus
            onSubmit={(query) => {
              close();
              submitSearch(query);
            }}
            onSelectPerfume={(id) => {
              close();
              openDetail(id);
            }}
            getImage={getImage}
            onImageError={handleImageError}
          />
        )}
      />

      {selectedId === null && activeTab === 'collection' && (
        <HeroSlider
          onExploreCollection={scrollToCollection}
          onStartQuiz={() => {
            setActiveTab('quiz');
            scrollToCollection();
          }}
          onOpenFinder={() => {
            setActiveTab('finder');
            scrollToCollection();
          }}
          onThemeChange={setHeroTheme}
        />
      )}

      {/* Koleksiyon ızgarası ekranın iki kenarına kadar uzanır; diğer ekranlar ortalı kapta kalır */}
      <main
        id="koleksiyon"
        className={`scroll-mt-20 ${
          selectedId !== null ? '' : activeTab === 'collection' ? 'pt-8' : 'max-w-7xl mx-auto px-6 py-8'
        }`}
      >
        {/* 1. PARFÜM DETAY EKRANI */}
        {selectedId !== null && (
          <PerfumeDetailPage
            key={selectedId}
            id={selectedId}
            onBack={goHome}
            onAddToCart={addToCart}
            onAddToCartById={addToCartById}
          />
        )}

        {/* Scent Finder ve Koku Testi hero'dan açılır; menüde sekme olmadığı için geri dönüş bağlantısı */}
        {selectedId === null && activeTab !== 'collection' && (
          <button
            onClick={() => setActiveTab('collection')}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Koleksiyon
          </button>
        )}

        {/* 2. SCENT FINDER EKRANI */}
        {selectedId === null && activeTab === 'finder' && (
          <ScentFinder onSelectPerfume={openDetail} getImage={getImage} onImageError={handleImageError} />
        )}

        {/* 3. KOKU TESTİ (QUIZ) EKRANI */}
        {selectedId === null && activeTab === 'quiz' && (
          <Quiz onSelectPerfume={openDetail} onGoToCollection={() => setActiveTab('collection')} />
        )}

        {/* 4. KOLEKSİYON (ANA LİSTE) EKRANI */}
        {selectedId === null && activeTab === 'collection' && (
          <Collection
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onSelectPerfume={openDetail}
            onAddToCart={addToCart}
          />
        )}
      </main>

      <Footer
        onOpenCollection={() => openView('collection')}
        onOpenFinder={() => openView('finder')}
        onOpenQuiz={() => openView('quiz')}
        onOpenCart={() => setCartOpen(true)}
        onTrackOrder={() => setOrdersOpen(true)}
        onOpenFaq={(section) => setFaqSection(section ?? '')}
        onOpenLegal={setLegalSlug}
        onContact={() => setContactOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        error={cartError}
        onCheckout={startCheckout}
        onClose={closeCart}
        onChangeQuantity={changeCartQuantity}
        getImage={getImage}
        onImageError={handleImageError}
      />

      <FavoritesDrawer
        open={favoritesOpen}
        items={favorites}
        onClose={closeFavorites}
        onRemove={removeFavorite}
        onSelect={(id) => {
          setFavoritesOpen(false);
          openDetail(id);
        }}
        placeholderImage={PLACEHOLDER_IMAGE}
      />

      <SideMenu
        open={menuOpen}
        onClose={closeMenu}
        links={[
          { label: 'Koleksiyon', onClick: () => openView('collection') },
          { label: 'Akıllı Koku Bulucu', onClick: () => openView('finder') },
          { label: 'Koku Testi', onClick: () => openView('quiz') },
          { label: user ? 'Siparişlerim' : 'Sipariş takibi', onClick: () => setOrdersOpen(true) },
          { label: 'Favorilerim', onClick: openFavorites },
          { label: 'Sepetim', onClick: () => setCartOpen(true) },
          { label: 'Bize ulaşın', onClick: () => setContactOpen(true) },
          user
            ? { label: 'Çıkış yap', onClick: logout }
            : { label: 'Giriş yap / Üye ol', onClick: () => setAuthModal('login') },
        ]}
      />
      <CheckoutModal
          key={`${user?.id ?? 'misafir'}-${checkoutSession}`}
          open={checkoutOpen}
          cart={cart}
          cartId={cartId}
          user={user}
          token={token}
          onClose={closeCheckout}
          onLogin={() => {
            setCheckoutOpen(false);
            setCheckoutAfterAuth(true);
            setAuthModal('login');
          }}
          onGoHome={goToHomePage}
          onOrderPlaced={handleOrderPlaced}
          onTrackOrder={openOrders}
        />

      <LegalPage slug={legalSlug} onChange={setLegalSlug} onClose={closeLegal} onGoHome={goToHomePage} />

      <FaqPage
        open={faqSection !== null}
        initialSection={faqSection || null}
        onClose={closeFaq}
        onGoHome={goToHomePage}
        onTrackOrder={() => {
          setFaqSection(null);
          setOrdersOpen(true);
        }}
        onContact={() => {
          setFaqSection(null);
          setContactOpen(true);
        }}
      />

      <ContactPage
        key={`contact-${user?.id ?? 'misafir'}`}
        open={contactOpen}
        user={user}
        token={token}
        onClose={closeContact}
        onGoHome={goToHomePage}
        onOpenFaq={() => {
          setContactOpen(false);
          setFaqSection('');
        }}
        onTrackOrder={() => {
          setContactOpen(false);
          setOrdersOpen(true);
        }}
      />

      <OrdersPage
        key={`orders-${user?.id ?? 'misafir'}`}
        open={ordersOpen}
        user={user}
        token={token}
        onClose={closeOrders}
        onGoHome={goToHomePage}
        guestOrder={user ? null : guestOrder}
        onLogin={() => {
          setOrdersOpen(false);
          setAuthModal('login');
        }}
      />

      <AuthModal
        open={authModal !== null}
        mode={authModal ?? 'login'}
        onModeChange={setAuthModal}
        onClose={closeAuth}
        notice={authNotice}
        onAuthenticated={handleAuthenticated}
      />
    </div>
    </FavoritesContext.Provider>
    </AuthContext.Provider>
  );
}

interface CollectionProps {
  searchQuery: string;
  onClearSearch: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onSelectPerfume: (id: number) => void;
  onAddToCart: (perfume: Perfume) => void;
}

function Collection({ searchQuery, onClearSearch, sortOption, onSortChange, onSelectPerfume, onAddToCart }: CollectionProps) {
  // Arama ve sıralama backend'de: GET /api/perfumes?q=...&sort=...&order=...
  const sortParams = SORT_OPTIONS.find((o) => o.value === sortOption)!.params;
  const list = useApiQuery(
    (signal) => api.listPerfumes({ q: searchQuery, ...sortParams, limit: 100 }, signal),
    [searchQuery, sortOption]
  );

  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (!list.data) return <LoadingState label="Koleksiyon yükleniyor..." />;

  const perfumes = list.data.data;
  const total = list.data.pagination.total;

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 min-h-10">
          {searchQuery ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white pl-4 pr-1.5 py-1.5 text-[13px]">
              "{searchQuery}" için {total} sonuç
              <button
                onClick={onClearSearch}
                className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
                aria-label="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </span>
          ) : (
            <span className="text-[13px] text-neutral-500">
              <span className="text-neutral-900 font-medium">{total}</span> parfüm
            </span>
          )}
          {list.loading && <RefreshCw className="w-3.5 h-3.5 text-neutral-400 animate-spin" strokeWidth={1.6} aria-label="Yükleniyor" />}
        </div>

        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          aria-label="Sıralama"
          className="sm:w-60 h-11 bg-white border border-neutral-300 hover:border-neutral-900 focus:border-neutral-900 rounded-md px-4 text-[14px] text-neutral-900 focus:outline-none transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {perfumes.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-16 text-center bg-white border border-dashed border-neutral-300">
            <p className="font-display text-2xl font-light text-neutral-800">"{searchQuery}" için sonuç bulunamadı.</p>
            <p className="mt-2 text-[13px] text-neutral-500">Farklı bir marka, isim veya nota deneyebilirsin.</p>
          </div>
        </div>
      ) : (
        <div className={`${productGridClass} transition-opacity ${list.loading ? 'opacity-60' : ''}`}>
          {perfumes.map((perfume) => (
            <ProductCard key={perfume.id} perfume={perfume} onSelect={onSelectPerfume} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </>
  );
}

interface PerfumeDetailPageProps {
  id: number;
  onBack: () => void;
  onAddToCart: (perfume: Perfume, quantity: number, size?: string | null) => void;
  onAddToCartById: (perfumeId: number) => void;
}

// GET /api/perfumes/:id -> detay sayfası kendi verisini backend'den çeker
function PerfumeDetailPage({ id, onBack, onAddToCart, onAddToCartById }: PerfumeDetailPageProps) {
  const detail = useApiQuery((signal) => api.getPerfume(id, signal), [id]);
  // GET /api/perfumes/:id/recommendations -> benzer parfümler şeridi
  const recommendations = useApiQuery((signal) => api.getRecommendations(id, signal), [id]);

  const openPerfume = (nextId: number) => window.location.assign(`#/perfume/${nextId}`);

  if (detail.loading && !detail.data) return <LoadingState label="Parfüm yükleniyor..." />;
  const perfume = detail.data?.data;
  return (
    <>
      <PerfumeDetail
        perfume={perfume}
        navigation={detail.data?.navigation}
        error={detail.error}
        onBack={onBack}
        onNavigate={openPerfume}
        onAddToCart={onAddToCart}
      />

      {perfume && (
        <>
          {/* Akordeonların altında: müşteri değerlendirmeleri, ardından öneriler (footer'dan hemen önce) */}
          <Reviews perfumeId={perfume.id} />
          <Recommendations
            products={recommendations.data ?? []}
            onSelect={openPerfume}
            onAddToCart={onAddToCartById}
            placeholderImage={PLACEHOLDER_IMAGE}
          />
        </>
      )}
    </>
  );
}

const GENDER_LABELS: Record<Perfume['gender'], string> = { erkek: 'Erkek', kadın: 'Kadın', unisex: 'Unisex' };

const CONCENTRATION_LABELS: Record<string, string> = {
  EDC: 'Eau de Cologne',
  EDT: 'Eau de Toilette',
  EDP: 'Eau de Parfum',
  Parfum: 'Parfum',
  Extrait: 'Extrait de Parfum',
};

interface PerfumeDetailProps {
  perfume?: Perfume;
  navigation?: { prevId: number; nextId: number };
  error?: string;
  onBack: () => void;
  onNavigate: (id: number) => void;
  onAddToCart: (perfume: Perfume, quantity: number, size?: string | null) => void;
}

// Detay sayfası: solda tam yükseklikte alt alta görseller, sağda sabit duran beyaz bilgi paneli
function PerfumeDetail({ perfume, navigation, error, onBack, onNavigate, onAddToCart }: PerfumeDetailProps) {
  const sizeOptions = perfume ? getSizeOptions(perfume) : [];
  const [selectedSize, setSelectedSize] = useState<string | null>(() =>
    perfume ? getDefaultSize(perfume, sizeOptions) : null
  );
  const backButton = (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
      Koleksiyon
    </button>
  );

  if (!perfume) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        {backButton}
        <p className="text-2xl text-neutral-800 text-center py-16">{error ?? 'Parfüm bulunamadı.'}</p>
      </div>
    );
  }

  const soldOut = perfume.stock === 0;
  const concentration = CONCENTRATION_LABELS[perfume.concentration] ?? perfume.concentration;
  // Seçilen boyut fiyatı ve başlıktaki hacmi belirler
  const selectedOption = sizeOptions.find((o) => o.size === selectedSize);
  const price = selectedOption?.price ?? perfume.price;
  const volumeLabel = selectedOption
    ? selectedOption.size.replace(/(\d)\s*ml$/i, '$1\u00a0ml')
    : perfume.volumeMl
      ? `${perfume.volumeMl}\u00a0ml`
      : null;
  // Hacim ve birimi aynı satırda kalsın diye bölünmez boşluk
  const title = [perfume.name, concentration, volumeLabel]
    .filter(Boolean)
    .join(' ');

  const specs = [
    { label: 'Marka', value: perfume.brand },
    { label: 'Konsantrasyon', value: concentration },
    { label: 'Koku ailesi', value: perfume.family },
    { label: 'Cinsiyet', value: GENDER_LABELS[perfume.gender] ?? perfume.gender },
    {
      label: 'Hacim',
      value: sizeOptions.length > 0 ? sizeOptions.map((o) => o.size).join(' / ') : perfume.volumeMl ? `${perfume.volumeMl} ml` : '—',
    },
    { label: 'Çıkış yılı', value: perfume.releaseYear ?? '—' },
    { label: 'Puan', value: perfume.rating ?? '—' },
    { label: 'Stok', value: soldOut ? 'Tükendi' : `${perfume.stock} adet` },
  ];

  return (
    <article className="grid md:grid-cols-2 bg-white text-neutral-900">
      {/* SOL: masaüstünde görseller alt alta; mobilde yana kaydırılır (ikinci görsel kenardan görünür) */}
      <div className="flex md:flex-col gap-1.5 bg-white overflow-x-auto md:overflow-visible snap-x snap-mandatory [scrollbar-width:none]">
        <div
          className={`relative shrink-0 snap-start h-[62svh] md:h-[calc(100svh-72px)] min-h-[380px] md:min-h-[420px] bg-[#e9e4dc] overflow-hidden ${
            perfume.hoverImage ? 'w-[88%] md:w-full' : 'w-full'
          }`}
        >
          <img
            src={getImage(perfume)}
            alt={perfume.name}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
            onError={handleImageError}
          />
        </div>
        {perfume.hoverImage && (
          <div className="relative shrink-0 snap-start w-[88%] md:w-full h-[62svh] md:h-[calc(100svh-72px)] min-h-[380px] md:min-h-[420px] bg-[#f4f2ee] md:bg-white">
            <img
              src={perfume.hoverImage}
              alt={`${perfume.name} — kutusuyla`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain p-[12%]"
              onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
            />
          </div>
        )}
      </div>

      {/* SAĞ: kaydırırken ekranda sabit kalan bilgi paneli */}
      <div className="md:sticky md:top-[72px] md:h-[calc(100svh-72px)] md:overflow-y-auto flex flex-col px-6 sm:px-12 lg:px-24 py-8 md:py-10">
        <div className="flex items-center justify-between">
          {backButton}
          {navigation && (
            <div className="flex items-center gap-5 text-sm text-neutral-500">
              <button
                onClick={() => onNavigate(navigation.prevId)}
                className="inline-flex items-center gap-1 hover:text-neutral-900 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Önceki
              </button>
              <button
                onClick={() => onNavigate(navigation.nextId)}
                className="inline-flex items-center gap-1 hover:text-neutral-900 cursor-pointer"
              >
                Sonraki
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        <div className="my-auto pt-12 md:pt-0">
          <div className="flex items-start justify-between gap-6">
            <h1 className="text-3xl lg:text-[2.4rem] font-normal leading-tight tracking-tight">{title}</h1>
            <FavoriteButton perfume={perfume} className="mt-2 p-1 shrink-0" size="w-6 h-6" />
          </div>
          <p className="mt-3 text-lg font-medium tabular-nums" aria-live="polite">
            {price.toLocaleString('tr-TR')} TL
          </p>

          <hr className="my-10 border-neutral-200" />

          {sizeOptions.length > 0 ? (
            <SizeSelector
              options={sizeOptions}
              value={selectedSize}
              onChange={setSelectedSize}
            />
          ) : (
            perfume.volumeMl && (
              <p className="text-[17px] font-medium tracking-wide">
                HACİM: <span className="font-normal text-neutral-500">{perfume.volumeMl} ml</span>
              </p>
            )
          )}

          <button
            onClick={() => onAddToCart(perfume, 1, selectedSize)}
            disabled={soldOut}
            className="mt-10 w-full h-16 rounded-md bg-[#1b1c1e] hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-[17px] font-semibold transition-colors cursor-pointer"
          >
            {soldOut ? 'Stokta yok' : 'Sepete ekleyin'}
          </button>

          <div className="mt-12">
            <ProductInfo description={perfume.description} specs={specs} notes={perfume.notes} />
          </div>
        </div>
      </div>
    </article>
  );
}


interface QuizProps {
  onSelectPerfume: (id: number) => void;
  onGoToCollection: () => void;
}

// Koku Testi'nde bazı seçeneklerin görselini frontend'de değiştir (backend verisine dokunmadan).
// "Ferah ve doğal", Koku Bulucu'daki Fresh kartıyla aynı görseli kullanmasın diye sisli yeşil vadi.
const QUIZ_IMAGE_OVERRIDES: Record<string, string> = {
  fresh: '/images/quiz/fresh-nature.jpg',
};

// Seçilen kartın onay animasyonu görünsün diye bir sonraki soruya kısa bir gecikmeyle geçilir
const QUIZ_ADVANCE_DELAY_MS = 450;

function Quiz({ onSelectPerfume, onGoToCollection }: QuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [advancing, setAdvancing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  // Sorular backend'den gelir: GET /api/quiz/questions
  const questionsQuery = useApiQuery((signal) => api.getQuizQuestions(signal), []);
  const questions: QuizQuestion[] = questionsQuery.data?.data ?? [];
  const finished = questions.length > 0 && step >= questions.length;

  // Puanlama backend'de yapılır: POST /api/quiz/recommendations
  const recommendations = useApiQuery<QuizRecommendation[] | null>(
    (signal) => (finished ? api.getQuizRecommendations(answers, signal) : Promise.resolve(null)),
    [finished, answers]
  );
  const recommendedPerfumes = recommendations.data?.map((r) => r.perfume) ?? [];

  const handleSelectOption = (key: string, value: string) => {
    if (advancing) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setAdvancing(true);
    advanceTimer.current = setTimeout(() => {
      setStep((prev) => prev + 1);
      setAdvancing(false);
    }, QUIZ_ADVANCE_DELAY_MS);
  };

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setAdvancing(false);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers({});
  };

  if (questionsQuery.error) return <ErrorState message={questionsQuery.error} onRetry={questionsQuery.reload} />;
  if (!questionsQuery.data) return <LoadingState label="Test yükleniyor..." />;

  const smallCaps = 'text-[11px] font-medium uppercase tracking-[0.25em]';
  const question = questions[step];

  return (
    <>
    <div className="max-w-5xl mx-auto py-10">
      {!finished ? (
        <div>
          {/* İlerleme: ince çizgi parçaları */}
          <div className="flex items-center justify-between gap-6">
            <span className={`${smallCaps} text-neutral-500`}>
              Soru {step + 1} / {questions.length}
            </span>
            <div className="flex gap-1.5" aria-hidden>
              {questions.map((q, i) => (
                <span
                  key={q.key}
                  className={`h-0.5 w-10 transition-colors duration-500 ${i <= step ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                />
              ))}
            </div>
          </div>

          <h3 id="quiz-question" className="mt-6 font-display text-4xl sm:text-5xl font-light leading-tight text-neutral-900">
            {question.title}
          </h3>

          <div
            role="radiogroup"
            aria-labelledby="quiz-question"
            className={`mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 ${question.options.length > 2 ? 'lg:grid-cols-4' : ''}`}
          >
            {question.options.map((option) => (
              <QuizOptionCard
                key={option.value}
                option={QUIZ_IMAGE_OVERRIDES[option.value] ? { ...option, image: QUIZ_IMAGE_OVERRIDES[option.value] } : option}
                selected={answers[question.key] === option.value}
                disabled={advancing}
                shape={question.options.length > 2 ? 'portrait' : 'landscape'}
                onSelect={() => handleSelectOption(question.key, option.value)}
              />
            ))}
          </div>

          {step > 0 && (
            <button
              onClick={goBack}
              className="mt-10 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Önceki soru
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className={`${smallCaps} text-neutral-500`}>Sonuç</p>
          <h3 className="mt-4 font-display text-4xl sm:text-5xl font-light text-neutral-900">Sana özel koku önerilerimiz</h3>
          <p className="mt-3 text-[15px] text-neutral-500">
            Verdiğin yanıtlara göre tarzına en çok uyan parfümleri eşleştirdik.
          </p>

          {recommendations.error && <ErrorState message={recommendations.error} onRetry={recommendations.reload} />}
          {recommendations.loading && <LoadingState label="Öneriler hazırlanıyor..." />}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-[2px] bg-white text-left">
            {recommendedPerfumes.map((perfume) => (
              <ProductCard key={perfume.id} perfume={perfume} onSelect={onSelectPerfume} />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={resetQuiz}
              className="h-12 px-8 border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              Testi tekrar et
            </button>
            <button
              onClick={onGoToCollection}
              className="h-12 px-8 bg-neutral-900 hover:bg-neutral-700 text-white text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              Tüm koleksiyonu incele
            </button>
          </div>
        </div>
      )}

    </div>

    {/* Sayfanın alt kısmı: dönüşümlü editoryal satırlar (testin dar kolonunun dışında, sayfa genişliğinde) */}
    <EditorialBanners banners={questionsQuery.data.banners} />
    </>
  );
}
