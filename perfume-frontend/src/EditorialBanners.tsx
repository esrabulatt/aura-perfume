import type { EditorialBanner } from './types';

// Banner'ların detay metinleri frontend'de tutulur (görsel dosya adına göre; backend verisine dokunmadan)
const BANNER_DETAILS: Record<string, { text: string; notes: string[] }> = {
  'night-collection.jpg': {
    text: 'Mum ışığında uzayan sohbetler ve paylaşılan kadehler için sıcak, derin ve kalıcı kokular. Amber ve vanilyanın yumuşaklığı, odunsu dip notalarla akşamın sonuna kadar tende kalır.',
    notes: ['Amber', 'Vanilya', 'Sandal ağacı'],
  },
  'lifestyle-desk.jpg': {
    text: 'Şehrin ışıkları yandığında, yanından geçtiğiniz herkesin hatırlayacağı bir iz. Yoğun konsantrasyonlu çiçeksi ve oryantal kompozisyonlar, gece boyunca zarif bir imza bırakır.',
    notes: ['Yasemin', 'Safran', 'Misk'],
  },
};

const fileName = (path: string) => path.split('/').pop() ?? path;

interface EditorialBannersProps {
  banners: EditorialBanner[];
}

/**
 * Dönüşümlü (zikzak) editoryal satırlar:
 * 1. satır: görsel solda (sayfanın yarısı), yazı sağda · 2. satır: yazı solda, görsel sağda …
 */
export default function EditorialBanners({ banners }: EditorialBannersProps) {
  if (banners.length === 0) return null;

  return (
    <section aria-label="Editoryal içerik" className="mt-20 space-y-16 md:space-y-24">
      {banners.map((banner, i) => {
        const detail = BANNER_DETAILS[fileName(banner.image)];
        const imageRight = i % 2 === 1;
        return (
          <article key={banner.image} className="grid md:grid-cols-2 items-center gap-8 md:gap-0">
            <figure
              className={`relative aspect-[4/5] md:aspect-auto md:h-[620px] overflow-hidden rounded-sm bg-neutral-900 ${
                imageRight ? 'md:order-2' : ''
              }`}
            >
              <img src={banner.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            </figure>

            <div className={`px-2 md:px-16 lg:px-24 ${imageRight ? 'md:order-1' : ''}`}>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">{banner.eyebrow}</p>
              <h3 className="mt-4 font-display text-4xl lg:text-5xl font-light leading-[1.08] text-neutral-900">
                {banner.title}
              </h3>
              {detail && (
                <>
                  <p className="mt-6 max-w-md text-[15px] leading-relaxed text-neutral-600">{detail.text}</p>
                  <div className="mt-8 max-w-md border-t border-neutral-200 pt-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Öne çıkan notalar</p>
                    <p className="mt-2 font-display text-[22px] font-light text-neutral-900">{detail.notes.join(' · ')}</p>
                  </div>
                </>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
