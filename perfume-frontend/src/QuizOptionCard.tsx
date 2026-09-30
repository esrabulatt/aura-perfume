import { useState } from 'react';
import { Check } from 'lucide-react';
import type { QuizOption } from './types';

interface QuizOptionCardProps {
  option: QuizOption;
  selected: boolean;
  disabled?: boolean;
  /**
   * portrait: 4'lü ızgarada dikey kart · landscape: 2'li ızgarada yatay kart
   * compact: Akıllı Koku Bulucu filtreleri için alçak kart
   */
  shape?: 'portrait' | 'landscape' | 'compact';
  onSelect: () => void;
}

const SHAPE_CLASSES = {
  portrait: 'aspect-[4/3] sm:aspect-[5/4] lg:aspect-[3/4]',
  landscape: 'aspect-[4/3] sm:aspect-[16/11]',
  compact: 'aspect-[4/5] sm:aspect-[4/3]',
} as const;

// Varsayılan zemin: seçenekte ne görsel ne gradyan varsa
const FALLBACK_GRADIENT = 'linear-gradient(135deg, #171717 0%, #525252 100%)';

/**
 * Koku testi seçenek kartı: tema görseli + karartma katmanı üzerinde serif başlık.
 * Üzerine gelince hafifçe yükselir, gölgesi belirginleşir ve görsel yakınlaşır; tıklanınca hafifçe içe basar.
 * Seçili kartın etrafında siyah çerçeve ve sağ üstte onay işareti belirir.
 */
export default function QuizOptionCard({ option, selected, disabled, shape = 'landscape', onSelect }: QuizOptionCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(option.image) && !imageFailed;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled && !selected}
      onClick={onSelect}
      style={{ backgroundImage: option.gradient ?? FALLBACK_GRADIENT }}
      className={`group relative w-full overflow-hidden ${SHAPE_CLASSES[shape]} rounded-sm text-left cursor-pointer
        transition-all duration-300 ease-out motion-reduce:transition-none
        hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4
        disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:opacity-60
        ${selected ? 'ring-2 ring-neutral-900 ring-offset-4 shadow-xl' : 'ring-1 ring-black/5'}`}
    >
      {showImage && (
        <img
          src={option.image!}
          alt=""
          loading="lazy" decoding="async"
          onError={() => setImageFailed(true)}
          style={{ objectPosition: option.imagePosition ?? '50% 50%' }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
      )}

      {/* Okunabilirlik: alt kısımda yoğunlaşan siyah karartma (pembe/yeşil gibi açık görsellerde de yazı net kalır) */}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      {/* Seçilince tüm kart hafifçe koyulaşır */}
      <span
        aria-hidden
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${selected ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Seçim onayı: siyah daire, altın tonlu ince çerçeve ve tik */}
      <span
        aria-hidden
        className={`absolute ${shape === 'compact' ? 'top-3 right-3 w-7 h-7' : 'top-4 right-4 w-8 h-8'} rounded-full bg-neutral-950 ring-1 ring-[#c9a96e] text-[#c9a96e] flex items-center justify-center shadow-lg shadow-black/40 transition-all duration-300 ease-out motion-reduce:transition-none ${
          selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={2.25} />
      </span>

      <span
        className={`absolute inset-x-0 bottom-0 text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] ${
          shape === 'compact' ? 'p-3 sm:p-4' : 'p-5 sm:p-6'
        }`}
      >
        <span
          className={`block font-display font-light leading-tight ${
            shape === 'compact' ? 'text-[19px] sm:text-[21px]' : 'text-[26px] sm:text-[30px]'
          }`}
        >
          {option.label}
        </span>
        {option.description && (
          <span
            className={`uppercase text-white/85 ${
              shape === 'compact' ? 'mt-1 text-[10px] tracking-[0.14em] line-clamp-2 sm:line-clamp-1' : 'block mt-1.5 text-[11px] tracking-[0.2em]'
            }`}
          >
            {option.description}
          </span>
        )}
      </span>
    </button>
  );
}
