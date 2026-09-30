import { useEffect } from 'react';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Cart, Perfume } from './types';

interface CartDrawerProps {
  open: boolean;
  cart: Cart | null;
  error: string | null;
  /** "Ödemeye geç": checkout penceresini açar */
  onCheckout: () => void;
  onClose: () => void;
  onChangeQuantity: (id: number, size: string | null, quantity: number) => void;
  getImage: (perfume: Perfume) => string;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const formatPrice = (value: number) => `${value.toLocaleString('tr-TR')} TL`;

export default function CartDrawer({ open, cart, error, onCheckout, onClose, onChangeQuantity, getImage, onImageError }: CartDrawerProps) {
  // Satır ve genel toplamlar backend'de hesaplanır (GET /api/carts/:cartId)
  const items = cart?.items ?? [];
  const total = cart?.totalPrice ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sepetim"
        inert={!open}
        className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Favoriler paneliyle aynı üst çubuk */}
        <header className="h-[72px] px-6 flex items-center justify-between border-b border-neutral-100">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.22em] text-neutral-900">
            Sepetim <span className="text-neutral-400">({cart?.totalQuantity ?? 0})</span>
          </h2>
          <button onClick={onClose} aria-label="Sepeti kapat" className="p-1.5 hover:opacity-60 cursor-pointer">
            <X className="w-5 h-5" strokeWidth={1.3} />
          </button>
        </header>

        {error && (
          <p role="alert" className="px-6 py-3 text-[13px] text-red-600 bg-red-50">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
              <ShoppingBag className="w-9 h-9 text-neutral-300" strokeWidth={1.2} />
              <p className="font-display text-2xl font-light text-neutral-700">Sepetiniz boş</p>
              <p className="text-[13px] text-neutral-400">Beğendiğiniz parfümleri sepete ekleyin, burada görünsün.</p>
            </div>
          ) : (
            <ul>
              {items.map(({ perfume, size, quantity, lineTotal }) => (
                <li key={`${perfume.id}-${size ?? ''}`} className="flex gap-4 px-6 py-5 border-b border-neutral-100">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={getImage(perfume)}
                    alt={perfume.name}
                    className="w-24 h-28 object-cover shrink-0 bg-[#ececec]"
                    onError={onImageError}
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p lang="en" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      {perfume.brand}
                    </p>
                    <h3 className="mt-1 font-display text-[22px] font-light leading-tight text-neutral-900">{perfume.name}</h3>
                    <p className="mt-1 text-[12px] text-neutral-500">
                      {[perfume.concentration, size ?? (perfume.volumeMl ? `${perfume.volumeMl} ml` : null)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() => onChangeQuantity(perfume.id, size, quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-neutral-700 hover:text-neutral-900 cursor-pointer"
                          aria-label={quantity === 1 ? 'Ürünü sil' : 'Azalt'}
                        >
                          {quantity === 1 ? <Trash2 className="w-4 h-4" strokeWidth={1.4} /> : <Minus className="w-4 h-4" strokeWidth={1.4} />}
                        </button>
                        <span className="w-7 text-center text-[14px] tabular-nums">{quantity}</span>
                        <button
                          onClick={() => onChangeQuantity(perfume.id, size, quantity + 1)}
                          disabled={quantity >= perfume.stock}
                          className="w-9 h-9 flex items-center justify-center text-neutral-700 hover:text-neutral-900 disabled:text-neutral-300 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Arttır"
                        >
                          <Plus className="w-4 h-4" strokeWidth={1.4} />
                        </button>
                      </div>
                      <span className="text-[14px] tabular-nums text-neutral-900">{formatPrice(lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-neutral-200 px-6 pt-5 pb-6">
          <div className="flex items-baseline justify-between text-neutral-900">
            <span className="text-[13px] font-medium uppercase tracking-[0.22em]">Toplam</span>
            <span className="text-[18px] font-medium tabular-nums">{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">KDV dahil · Kargo ücretsiz</p>
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="mt-5 w-full h-14 rounded-md bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-[15px] transition-colors cursor-pointer"
          >
            Ödemeye geç
          </button>
        </footer>
      </aside>
    </div>
  );
}
