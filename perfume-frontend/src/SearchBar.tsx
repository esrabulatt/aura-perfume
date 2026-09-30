import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Perfume } from './types';
import { api } from './api';
import { Search } from 'lucide-react';

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 200;

interface SearchBarProps {
  onSubmit: (query: string) => void;
  onSelectPerfume: (id: number) => void;
  getImage: (perfume: Perfume) => string;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Arama paneli açılınca imleç doğrudan kutuya gelsin */
  autoFocus?: boolean;
}

export default function SearchBar({ onSubmit, onSelectPerfume, getImage, onImageError, autoFocus }: SearchBarProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Öneriler hangi arama terimine ait, onu da saklıyoruz; eski sonuç yeni terim için gösterilmez
  const [result, setResult] = useState<{ term: string; items: Perfume[]; failed?: boolean }>({ term: '', items: [] });

  const term = input.trim();
  const showDropdown = open && term.length > 0;
  const isLoading = result.term !== term;
  const suggestions = isLoading ? [] : result.items;

  // Yazmayı bırakınca backend'de ara: GET /api/perfumes?q=...&limit=6
  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .listPerfumes({ q: term, limit: MAX_SUGGESTIONS }, controller.signal)
        .then((res) => setResult({ term, items: res.data }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ term, items: [], failed: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  useEffect(() => {
    if (!showDropdown) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showDropdown]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const selectPerfume = (id: number) => {
    close();
    onSelectPerfume(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectPerfume(suggestions[activeIndex].id);
      return;
    }
    close();
    onSubmit(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  return (
    <>
      {showDropdown &&
        createPortal(<div className="fixed inset-0 z-20 bg-black/50 transition-opacity" aria-hidden />, document.body)}

      <div ref={containerRef} className="relative w-full">
        {/* Görseldeki gibi: şeffaf, altı çizgili; renk menüden (currentColor) gelir */}
        <form onSubmit={handleSubmit} role="search" className="flex items-center h-14 border-b border-current/70 focus-within:border-current transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ara"
            aria-label="Marka, parfüm adı veya nota ara"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            role="combobox"
            autoComplete="off"
            autoFocus={autoFocus}
            className="flex-1 min-w-0 h-full bg-transparent px-5 text-[17px] text-current placeholder:text-current placeholder:opacity-80 focus:outline-none"
          />
          <button type="submit" aria-label="Ara" className="px-5 h-full text-current opacity-90 hover:opacity-100 cursor-pointer">
            <Search className="w-5 h-5" strokeWidth={1.4} />
          </button>
        </form>

        {showDropdown && (
          <div
            id="search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 bg-white text-neutral-900 shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
          >
            {isLoading ? (
              <p className="px-6 py-6 text-center text-[14px] text-neutral-400">Aranıyor…</p>
            ) : result.failed ? (
              <p className="px-6 py-6 text-center text-[14px] text-red-600">Arama yapılamadı. API sunucusu çalışıyor mu?</p>
            ) : suggestions.length === 0 ? (
              <p className="px-6 py-6 text-center text-[14px] text-neutral-500">"{term}" için sonuç bulunamadı.</p>
            ) : (
              suggestions.map((perfume, index) => (
                <button
                  key={perfume.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => selectPerfume(perfume.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex gap-4 px-5 py-4 text-left border-b border-neutral-100 last:border-b-0 transition-colors cursor-pointer ${
                    index === activeIndex ? 'bg-neutral-50' : 'bg-white'
                  }`}
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src={getImage(perfume)}
                    alt=""
                    className="w-16 h-20 object-cover shrink-0 bg-[#ececec]"
                    onError={onImageError}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p lang="en" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 line-clamp-1">
                          {perfume.brand}
                        </p>
                        <p className="mt-0.5 font-display text-[22px] font-light leading-tight line-clamp-1">{perfume.name}</p>
                      </div>
                      <span className="text-[14px] tabular-nums whitespace-nowrap">{perfume.price.toLocaleString('tr-TR')} TL</span>
                    </div>
                    <p className="mt-1 text-[12px] text-neutral-500 line-clamp-1 first-letter:uppercase">
                      {perfume.concentration} · {perfume.notes.top.join(', ')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
