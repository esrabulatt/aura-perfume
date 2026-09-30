import { useEffect, useRef, useState } from 'react';
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import type { NavTheme } from './types';
import { useAuth } from './auth';

// ---------------------------------------------------------------------------
// Üst menü: solda Menü + Ara, ortada logo, sağda Bize ulaşın + profil + favoriler + sepet.
// Rengi hero'daki aktif görselin tonlarına uyar (theme); hero bitince beyaza döner.
// ---------------------------------------------------------------------------

interface NavbarProps {
  theme: NavTheme | null;
  cartCount: number;
  favoritesCount: number;
  onGoHome: () => void;
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenOrders: () => void;
  onContact: () => void;
  /** Arama paneli içeriği; close çağrılınca panel kapanır */
  renderSearch: (close: () => void) => React.ReactNode;
}

function CountBadge({ count, dark }: { count: number; dark: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full text-[10px] font-medium transition-colors duration-700 ${
        dark ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
      }`}
    >
      {count}
    </span>
  );
}

export default function Navbar({
  theme,
  cartCount,
  favoritesCount,
  onGoHome,
  onOpenMenu,
  onOpenCart,
  onOpenFavorites,
  onOpenOrders,
  onContact,
  renderSearch,
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, openAuth, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);

  const dark = theme?.dark ?? false;
  const background = theme?.background ?? 'rgba(255, 255, 255, 0.96)';

  // Profil paneli: dışarı tıklayınca veya Esc ile kapanır
  useEffect(() => {
    if (!profileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setProfileOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  const textButton = 'items-center gap-2.5 text-[14px] hover:opacity-70 transition-opacity cursor-pointer';
  const iconButton = 'relative p-1 sm:p-1.5 hover:opacity-70 transition-opacity cursor-pointer';

  return (
    <header
      style={{ backgroundColor: background }}
      className={`sticky top-0 z-30 backdrop-blur-md transition-[background-color,color,border-color] duration-700 ease-out border-b ${
        dark ? 'text-white' : 'text-neutral-900'
      } ${theme ? 'border-transparent' : 'border-neutral-200'}`}
    >
      <div className="relative h-[72px] px-3 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Sol: Menü ve Ara */}
        <div className="flex items-center gap-3 sm:gap-8">
          <button onClick={onOpenMenu} className={`${textButton} inline-flex`} aria-label="Menüyü aç">
            <Menu className="w-5 h-5" strokeWidth={1.3} />
            <span className="hidden sm:inline">Menü</span>
          </button>
          <button
            onClick={() => setSearchOpen((o) => !o)}
            aria-expanded={searchOpen}
            className={`${textButton} inline-flex`}
            aria-label={searchOpen ? 'Aramayı kapat' : 'Ara'}
          >
            {searchOpen ? <X className="w-5 h-5" strokeWidth={1.3} /> : <Search className="w-5 h-5" strokeWidth={1.3} />}
            <span className="hidden sm:inline">Ara</span>
          </button>
        </div>

        {/* Orta: logo */}
        <button
          onClick={onGoHome}
          className="font-display text-[23px] sm:text-[38px] leading-none tracking-tight whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer"
        >
          Aura Perfumé
        </button>

        {/* Sağ: Bize ulaşın, profil, favoriler, sepet */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-6">
          <button onClick={onContact} className={`${textButton} hidden lg:inline-flex`}>
            Bize ulaşın
          </button>

          {/* Oturum yoksa ikon doğrudan Giriş Yap / Üye Ol penceresini açar; varsa ad + hesap menüsü */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => (user ? setProfileOpen((o) => !o) : openAuth('login'))}
              aria-expanded={user ? profileOpen : undefined}
              aria-label={user ? `Hesabım: ${user.name}` : 'Giriş yap veya üye ol'}
              className={`${iconButton} inline-flex items-center gap-2`}
            >
              <User className="w-[22px] h-[22px]" strokeWidth={1.3} />
              {user && <span className="hidden xl:inline max-w-[120px] truncate text-[14px]">{user.name.split(' ')[0]}</span>}
            </button>
            {user && profileOpen && (
              <div className="absolute right-0 top-full mt-4 w-72 bg-white text-neutral-900 shadow-2xl border border-neutral-100 p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">Hesabım</p>
                <p className="mt-3 font-display text-2xl font-light leading-tight">Merhaba, {user.name}</p>
                <p className="mt-1 text-[13px] text-neutral-500 truncate">{user.email}</p>
                <div className="mt-5 border-t border-neutral-100 pt-4 space-y-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenOrders();
                    }}
                    className="w-full flex items-center justify-between py-2 text-[14px] hover:text-neutral-500 transition-colors cursor-pointer"
                  >
                    Siparişlerim
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenFavorites();
                    }}
                    className="w-full flex items-center justify-between py-2 text-[14px] hover:text-neutral-500 transition-colors cursor-pointer"
                  >
                    Favorilerim <span className="text-neutral-400 tabular-nums">{favoritesCount}</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenCart();
                    }}
                    className="w-full flex items-center justify-between py-2 text-[14px] hover:text-neutral-500 transition-colors cursor-pointer"
                  >
                    Sepetim <span className="text-neutral-400 tabular-nums">{cartCount}</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="mt-4 w-full h-11 inline-flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-900 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.4} />
                  Çıkış yap
                </button>
              </div>
            )}
          </div>

          <button onClick={onOpenFavorites} aria-label={`Favorilerim (${favoritesCount})`} className={iconButton}>
            <Heart className="w-[22px] h-[22px]" strokeWidth={1.3} />
            <CountBadge count={favoritesCount} dark={dark} />
          </button>

          <button onClick={onOpenCart} aria-label={`Sepeti aç (${cartCount})`} className={iconButton}>
            <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={1.3} />
            <CountBadge count={cartCount} dark={dark} />
          </button>
        </div>
      </div>

      {/* Arama paneli: logonun altında, menüyle aynı zeminde, altı çizgili alan */}
      {searchOpen && (
        <div
          style={{ backgroundColor: background }}
          className="absolute inset-x-0 top-full pb-8 pt-2 px-4 backdrop-blur-md transition-colors duration-700"
        >
          <div className="max-w-2xl mx-auto">{renderSearch(() => setSearchOpen(false))}</div>
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Yan menü (soldan açılır)
// ---------------------------------------------------------------------------

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  links: { label: string; onClick: () => void }[];
}

export function SideMenu({ open, onClose, links }: SideMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <nav
        aria-label="Site menüsü"
        inert={!open}
        className={`absolute inset-y-0 left-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-neutral-100">
          <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">Menü</span>
          <button onClick={onClose} aria-label="Menüyü kapat" className="p-1.5 hover:opacity-60 cursor-pointer">
            <X className="w-5 h-5" strokeWidth={1.3} />
          </button>
        </div>
        <ul className="px-6 py-8 space-y-1">
          {links.map(({ label, onClick }) => (
            <li key={label}>
              <button
                onClick={() => {
                  onClose();
                  onClick();
                }}
                className="w-full text-left py-3 font-display text-[32px] font-light text-neutral-900 hover:text-neutral-500 transition-colors cursor-pointer"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
