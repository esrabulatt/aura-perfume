import { useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import type { ProductCard } from './types';

interface FavoritesDrawerProps {
  open: boolean;
  items: ProductCard[];
  onClose: () => void;
  onRemove: (perfumeId: number) => void;
  onSelect: (perfumeId: number) => void;
  placeholderImage: string;
}

// Sağdan açılan favoriler paneli (favoriler hesaba bağlıdır: /api/favorites)
export default function FavoritesDrawer({ open, items, onClose, onRemove, onSelect, placeholderImage }: FavoritesDrawerProps) {
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
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Favorilerim"
        inert={!open}
        className={`absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="h-[72px] px-6 flex items-center justify-between border-b border-neutral-100">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.22em] text-neutral-900">
            Favorilerim <span className="text-neutral-400">({items.length})</span>
          </h2>
          <button onClick={onClose} aria-label="Favorileri kapat" className="p-1.5 hover:opacity-60 cursor-pointer">
            <X className="w-5 h-5" strokeWidth={1.3} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
              <Heart className="w-9 h-9 text-neutral-300" strokeWidth={1.2} />
              <p className="font-display text-2xl font-light text-neutral-700">Henüz favoriniz yok</p>
              <p className="text-[13px] text-neutral-400">Beğendiğiniz parfümlerdeki kalbe dokunun; favorileriniz hesabınıza kaydedilir.</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-5 border-b border-neutral-100">
                  <button
                    onClick={() => onSelect(item.id)}
                    className="shrink-0 w-24 h-28 bg-[#ececec] overflow-hidden cursor-pointer"
                    aria-label={`${item.name} ürününü incele`}
                  >
                    <img loading="lazy" decoding="async" src={item.image ?? placeholderImage} alt="" className="h-full w-full object-cover" />
                  </button>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p lang="en" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      {item.brand}
                    </p>
                    <button
                      onClick={() => onSelect(item.id)}
                      className="mt-1 text-left font-display text-[22px] font-light leading-tight hover:text-neutral-500 cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <p className="mt-1 text-[12px] text-neutral-500">
                      {[item.concentration, item.volumeLabel].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-[14px] tabular-nums">{item.price.toLocaleString('tr-TR')} TL</span>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-[12px] text-neutral-500 underline underline-offset-4 hover:text-neutral-900 cursor-pointer"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
