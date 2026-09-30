import { createContext, useContext } from 'react';
import type { Perfume } from './types';

// Favoriler hesaba bağlıdır (backend: /api/favorites, JWT gerekir).
// Giriş yapılmamışsa kalbe basınca giriş penceresi açılır.
export interface FavoritesContextValue {
  isFavorite: (perfumeId: number) => boolean;
  toggleFavorite: (perfume: Perfume) => void;
}

export const FavoritesContext = createContext<FavoritesContextValue>({
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export const useFavorites = () => useContext(FavoritesContext);
