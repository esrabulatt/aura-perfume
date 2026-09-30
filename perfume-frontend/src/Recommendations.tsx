import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProductCard } from './types';

interface RecommendationCardProps {
  product: ProductCard;
  onSelect: (id: number) => void;
  onAddToCart: (id: number) => void;
  placeholderImage: string;
}

// Kart: gri zeminde görsel (üzerine gelince kutu görseli), altta bilgiler;
// hover'da görselin altından "Sepete ekle / İncele" çubuğu yükselir (dokunmatik ekranlarda hep görünür)
function RecommendationCard({ product, onSelect, onAddToCart, placeholderImage }: RecommendationCardProps) {
  return (
    <article className="group relative shrink-0 snap-start w-[72%] sm:w-[calc((100%-2px)/2)] lg:w-[calc((100%-6px)/4)] bg-white">
      <div className="relative aspect-[4/5] bg-[#ececec] overflow-hidden">
        <button
          onClick={() => onSelect(product.id)}
          aria-label={`${product.name} ürününü incele`}
          className="absolute inset-0 cursor-pointer"
        >
          <img
            src={product.image ?? placeholderImage}
            alt=""
            loading="lazy" decoding="async"
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              product.hoverImage ? 'group-hover:opacity-0' : ''
            }`}
          />
          {product.hoverImage && (
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <img src={product.hoverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-[14%]" />
            </span>
          )}
        </button>

        {!product.inStock && (
          <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-600">
            Tükendi
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 lg:translate-y-full lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0 transition-transform duration-500 ease-out motion-reduce:transition-none">
          <button
            onClick={() => onAddToCart(product.id)}
            disabled={!product.inStock}
            className="h-12 bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white text-[11px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
          >
            {product.inStock ? 'Sepete ekle' : 'Tükendi'}
          </button>
          <button
            onClick={() => onSelect(product.id)}
            className="h-12 bg-white hover:bg-neutral-100 text-neutral-900 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
          >
            İncele
          </button>
        </div>
      </div>

      <button onClick={() => onSelect(product.id)} className="block w-full text-left px-3 pt-4 pb-6 cursor-pointer">
        {/* Yabancı marka adları büyük harfe Türkçe kurallarıyla (İ) çevrilmesin */}
        <p lang="en" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          {product.brand}
        </p>
        <h3 className="mt-1.5 text-[15px] font-medium text-neutral-900 leading-snug">{product.name}</h3>
        <p className="mt-1 text-[13px] text-neutral-500">
          {[product.concentration, product.volumeLabel].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-2 text-[13px] text-neutral-900">{product.price.toLocaleString('tr-TR')} TL</p>
      </button>
    </article>
  );
}

interface RecommendationsProps {
  title?: string;
  eyebrow?: string;
  products: ProductCard[];
  onSelect: (id: number) => void;
  onAddToCart: (id: number) => void;
  placeholderImage: string;
}

// Yana kaydırılan öneri şeridi: fare tekerleği / dokunma ile kayar, oklar bir ekran kaydırır
export default function Recommendations({
  title = 'Sizin İçin Seçtiklerimiz',
  eyebrow = 'Benzer kokular',
  products,
  onSelect,
  onAddToCart,
  placeholderImage,
}: RecommendationsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [products, updateEdges]);

  const scroll = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  const arrow =
    'w-11 h-11 rounded-full border border-neutral-300 hover:border-neutral-900 text-neutral-900 flex items-center justify-center disabled:opacity-30 disabled:hover:border-neutral-300 disabled:cursor-default transition-colors cursor-pointer';

  return (
    <section aria-labelledby="recommendations-heading" className="py-20 border-t border-neutral-200 bg-white">
      <div className="px-6 sm:px-12 lg:px-24 mb-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">{eyebrow}</p>
            <h2 id="recommendations-heading" className="mt-3 font-display text-4xl sm:text-5xl font-light text-neutral-900">
              {title}
            </h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => scroll(-1)} disabled={edges.start} aria-label="Önceki ürünler" className={arrow}>
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => scroll(1)} disabled={edges.end} aria-label="Sonraki ürünler" className={arrow}>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex gap-[2px] overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            onSelect={onSelect}
            onAddToCart={onAddToCart}
            placeholderImage={placeholderImage}
          />
        ))}
      </div>
    </section>
  );
}
