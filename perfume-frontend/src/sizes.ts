import type { Perfume, SizeOption } from './types';

/**
 * Ürünün boyut seçeneklerini tek biçime çevirir:
 * - variants: [{ size: "50ml", price: 3200 }, ...]  -> boyuta özel fiyat
 * - sizes: ["50ml", "100ml"]                         -> hepsi ürünün ana fiyatından
 * İkisi de yoksa boş dizi döner (ürün tek boyutlu).
 */
export function getSizeOptions(perfume: Perfume): SizeOption[] {
  if (perfume.variants?.length) return perfume.variants;
  if (perfume.sizes?.length) return perfume.sizes.map((size) => ({ size, price: perfume.price }));
  return [];
}

// Varsayılan seçim: ürünün ana hacmine uyan seçenek, yoksa ilki
export function getDefaultSize(perfume: Perfume, options: SizeOption[]): string | null {
  if (options.length === 0) return null;
  const normalize = (size: string) => size.replace(/\s+/g, '').toLowerCase();
  const main = perfume.volumeMl ? `${perfume.volumeMl}ml` : null;
  return (options.find((o) => main && normalize(o.size) === main) ?? options[0]).size;
}
