import { useRef } from 'react';
import type { SizeOption } from './types';

const formatPrice = (price: number) => `${price.toLocaleString('tr-TR')} TL`;

// "70ml" -> "70 ml" (sayı ile birim arasında boşluk)
const formatSize = (size: string) => size.replace(/(\d)\s*([a-zA-Z]+)$/, '$1 $2');

interface SizeSelectorProps {
  options: SizeOption[];
  value: string | null;
  onChange: (size: string) => void;
  label?: string;
}

/**
 * Boyut seçici: görselsiz, sade metin butonları ("70 ml — 16.900 TL").
 * Seçili buton siyah dolgulu; diğerleri ince gri çerçeveli.
 * Erişilebilirlik: radiogroup; ok tuşlarıyla seçenekler arasında gezilebilir.
 */
export default function SizeSelector({ options, value, onChange, label = 'Hacim' }: SizeSelectorProps) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.size === value));

  const focusAndSelect = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next].size);
    buttonsRef.current[next]?.focus();
  };

  return (
    <div>
      <p id="size-selector-label" className="text-[17px] font-medium tracking-wide uppercase">
        {label}:
      </p>

      <div role="radiogroup" aria-labelledby="size-selector-label" className="mt-5 flex flex-wrap gap-3">
        {options.map((option, i) => {
          const selected = i === selectedIndex;
          return (
            <button
              key={option.size}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.size)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  focusAndSelect(i + 1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  focusAndSelect(i - 1);
                }
              }}
              className={`h-12 px-5 border text-[14px] tabular-nums whitespace-nowrap cursor-pointer transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2
                ${
                  selected
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900'
                }`}
            >
              {formatSize(option.size)}
              <span className={selected ? 'text-white/60' : 'text-neutral-400'}> — </span>
              {formatPrice(option.price)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
