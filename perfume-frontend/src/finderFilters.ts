import type { FinderFilter, Perfume, ScentFamily } from './types';

// Akıllı Koku Bulucu filtre kartları. Görseller doğrudan frontend'in public klasöründen gelir.
// value'lar, parfüm listesinin çekildiği mevcut /api/perfumes sorgu parametreleriyle aynıdır.
// "Tümü" kartı yok: seçili bir karta tekrar tıklamak o filtreyi kaldırır.
export const FINDER_FILTERS: FinderFilter[] = [
  {
    key: 'season',
    label: 'Mevsim seçimi',
    options: [
      { value: 'summer', label: 'Yazlık / Ferah', description: 'Deniz, güneş, narenciye', image: '/images/banners/fresh-ocean.jpg', imagePosition: '50% 42%', gradient: 'linear-gradient(135deg, #0f3b4a 0%, #d8c39a 100%)' },
      { value: 'winter', label: 'Kışlık / Yoğun', description: 'Akşam, sıcaklık, derin notalar', image: '/images/banners/night-collection.jpg', imagePosition: '50% 38%', gradient: 'linear-gradient(135deg, #1a0f08 0%, #6b4424 100%)' },
    ],
  },
  {
    key: 'time',
    label: 'Kullanım zamanı',
    options: [
      { value: 'day', label: 'Gündüz', description: 'Kahve, gün ışığı, sade', image: '/images/banners/coffee-lifestyle.jpg', imagePosition: '60% 35%', gradient: 'linear-gradient(135deg, #3b2a1d 0%, #cbb89a 100%)' },
      { value: 'night', label: 'Gece / Davet', description: 'Şehir ışıkları, iz bırakan', image: '/images/banners/bleu-chanel-night.jpg', imagePosition: '50% 62%', gradient: 'linear-gradient(135deg, #0b1020 0%, #1f3a6b 100%)' },
    ],
  },
  {
    key: 'scentFamily',
    label: 'Koku ailesi',
    options: [
      { value: 'woody', label: 'Odunsu', description: 'Sedir, vetiver, paçuli', image: '/images/quiz/classic.jpg', gradient: 'linear-gradient(135deg, #2a1d14 0%, #7a5a3c 100%)' },
      { value: 'floral', label: 'Çiçeksi', description: 'Yasemin, gül, neroli', image: '/images/quiz/floral.jpg', gradient: 'linear-gradient(135deg, #4a2a3a 0%, #d9a3b3 100%)' },
      { value: 'fresh', label: 'Fresh', description: 'Bergamot, yeşillik, nane', image: '/images/quiz/fresh.jpg', gradient: 'linear-gradient(135deg, #1f3d2b 0%, #6f9a5b 100%)' },
      { value: 'spicy', label: 'Baharatlı', description: 'Safran, biber, tarçın', image: '/images/quiz/woody.jpg', gradient: 'linear-gradient(135deg, #3b2314 0%, #a0673d 100%)' },
    ],
  },
];

// Bazı koku aileleri frontend'de daha geniş yorumlanır (backend'e dokunmadan).
// Baharatlı: oryantal/gurme ailesi VEYA notalarında en az bir baharat bulunması yeterli
// (backend en az 2 baharat notası istiyor; bu yüzden biberli / tarçınlı parfümler dışarıda kalıyordu).
const SPICE_NOTES = /biber|safran|tarçın|kakule|karanfil|zencefil|baharat|muskat/i;

export const CLIENT_SCENT_FAMILY_RULES: Partial<Record<ScentFamily, (p: Perfume) => boolean>> = {
  spicy: (p) =>
    ['oryantal', 'gurme'].includes(p.family) ||
    [...p.notes.top, ...p.notes.middle, ...p.notes.base].some((note) => SPICE_NOTES.test(note)),
};
