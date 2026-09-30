import { Heart } from 'lucide-react';
import { useFavorites } from './favorites';
import type { Perfume } from './types';

interface FavoriteButtonProps {
  perfume: Perfume;
  className?: string;
  size?: string;
}

// Kalp: dolu = favoride. Tıklama kartın kendi tıklamasını (detaya gitme) tetiklemez.
export default function FavoriteButton({ perfume, className = '', size = 'w-5 h-5' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(perfume.id);
  const perfumeName = perfume.name;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(perfume);
      }}
      aria-pressed={active}
      aria-label={active ? `${perfumeName} favorilerden çıkar` : `${perfumeName} favorilere ekle`}
      title={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className={`cursor-pointer transition-transform active:scale-90 ${className}`}
    >
      <Heart
        className={`${size} transition-colors ${active ? 'fill-neutral-900 text-neutral-900' : 'text-neutral-900'}`}
        strokeWidth={1.3}
      />
    </button>
  );
}
