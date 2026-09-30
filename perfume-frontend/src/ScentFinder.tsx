import { useState } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import type { FinderFilter, Perfume, ScentFamily, Season, TimeOfDay } from './types';
import QuizOptionCard from './QuizOptionCard';
import { CLIENT_SCENT_FAMILY_RULES, FINDER_FILTERS } from './finderFilters';
import { api } from './api';
import { useApiQuery } from './useApiQuery';

// ---------------------------------------------------------------------------
// Filtre grubu: seçenekler editoryal görselli, koyu karartmalı kartlar (Koku Testi ile aynı bileşen)
// ---------------------------------------------------------------------------

interface FilterGroupProps {
  filter: FinderFilter;
  value: string;
  onChange: (value: string) => void;
}

// 5 seçenekli grupta (koku ailesi) geniş ekranda 5 sütun, 3 seçenekli gruplarda 3 sütun
const gridFor = (count: number) => (count > 2 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2');

// 2 seçenekli gruplar (mevsim, zaman) geniş ekranda yan yana; 4 seçenekli grup (koku ailesi) tam satır
const groupSpan = (count: number) => (count > 2 ? 'lg:col-span-2' : '');

function FilterGroup({ filter, value, onChange }: FilterGroupProps) {
  const labelId = `finder-${filter.key}`;
  return (
    <div>
      <p id={labelId} className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
        {filter.label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={`mt-4 grid gap-3 ${gridFor(filter.options.length)}`}>
        {filter.options.map((option) => (
          <QuizOptionCard
            key={option.value}
            option={option}
            shape="compact"
            selected={option.value === value}
            onSelect={() => onChange(option.value === value ? 'all' : option.value)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sonuç kartı: yuvarlatılmış çerçeve, görsel iç boşluklu; altta ad, marka, nota rozetleri, fiyat ve puan
// ---------------------------------------------------------------------------

interface FinderCardProps {
  perfume: Perfume;
  getImage: (perfume: Perfume) => string;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onSelect: (id: number) => void;
}

const MAX_NOTE_BADGES = 4;

function FinderCard({ perfume, getImage, onImageError, onSelect }: FinderCardProps) {
  // Önce üst, sonra orta notalar: kokunun ilk izlenimini anlatır
  const notes = [...perfume.notes.top, ...perfume.notes.middle];
  const shown = notes.slice(0, MAX_NOTE_BADGES);
  const hidden = notes.length - shown.length;

  return (
    <button
      onClick={() => onSelect(perfume.id)}
      className="group w-full text-left flex flex-col rounded-2xl bg-white border border-neutral-200/80 p-3 cursor-pointer
        transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-neutral-300 active:scale-[0.99]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f4f2ee]">
        <img
          src={getImage(perfume)}
          alt={perfume.name}
          loading="lazy" decoding="async"
          onError={onImageError}
          className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03] ${
            perfume.hoverImage ? 'group-hover:opacity-0' : ''
          }`}
        />
        {perfume.hoverImage && (
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <img src={perfume.hoverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-[14%]" />
          </span>
        )}
        {perfume.stock === 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-600">
            Tükendi
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-5 pb-2">
        <p lang="en" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          {perfume.brand}
        </p>
        <h3 className="mt-1.5 font-display lining-nums text-[24px] font-light leading-tight text-neutral-900">{perfume.name}</h3>

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Öne çıkan notalar">
          {shown.map((note) => (
            <li key={note} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-700 first-letter:uppercase">
              {note}
            </li>
          ))}
          {hidden > 0 && <li className="rounded-full px-1.5 py-1 text-[11px] text-neutral-400">+{hidden}</li>}
        </ul>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-[15px] font-medium text-neutral-900 tabular-nums">
              {perfume.price.toLocaleString('tr-TR')} TL
            </span>
            {perfume.rating != null && (
              <span className="inline-flex items-center gap-1 text-[13px] text-neutral-600 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-[#c9a96e] text-[#c9a96e]" strokeWidth={1.2} />
                {perfume.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Filtrelerle parfüm listesi arasındaki geniş hero banner (frontend/public/images/hero/citrus-nature.jpg)
// ---------------------------------------------------------------------------

function FinderHeroBanner({ onShowFresh }: { onShowFresh: () => void }) {
  return (
    <section aria-labelledby="finder-banner-heading" className="relative mt-12 h-[420px] sm:h-[480px] overflow-hidden rounded-2xl bg-neutral-900">
      <img
        src="/images/hero/citrus-nature.jpg"
        alt="Yeşil yapraklar ve portakal dilimleri arasında cam parfüm şişesi"
        loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      {/* Okunabilirlik: soldan sağa açılan karartma (şişe tarafı aydınlık kalır) */}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

      <div className="relative h-full flex flex-col justify-end sm:justify-center px-8 sm:px-14 pb-10 sm:pb-0 max-w-xl text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">Doğadan ilham</p>
        <h2 id="finder-banner-heading" className="mt-4 font-display text-4xl sm:text-5xl font-light leading-[1.05]">
          Narenciyenin ve yeşilin ferahlığı
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/85">
          Portakal çiçeği, bergamot ve taze yapraklar; tende hafif, gün boyu ferah.
        </p>
        <button
          onClick={onShowFresh}
          className="mt-8 w-fit h-12 px-8 bg-white hover:bg-neutral-100 text-neutral-900 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
        >
          Fresh kokuları göster
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sayfa: filtreler değiştikçe GET /api/perfumes?season=&time=&scentFamily= ile backend'den süzülür
// ---------------------------------------------------------------------------

interface ScentFinderProps {
  onSelectPerfume: (id: number) => void;
  getImage: (perfume: Perfume) => string;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function ScentFinder({ onSelectPerfume, getImage, onImageError }: ScentFinderProps) {
  const [season, setSeason] = useState<Season>('all');
  const [time, setTime] = useState<TimeOfDay>('all');
  const [scentFamily, setScentFamily] = useState<ScentFamily>('all');

  // Filtre kartları frontend'de tanımlı (görseller public klasöründen); seçim bu state'lerde tutulur
  const values: Record<FinderFilter['key'], string> = { season, time, scentFamily };
  const setters: Record<FinderFilter['key'], (value: string) => void> = {
    season: (v) => setSeason(v as Season),
    time: (v) => setTime(v as TimeOfDay),
    scentFamily: (v) => setScentFamily(v as ScentFamily),
  };

  // Mevsim ve zaman backend'de süzülür; koku ailesi için frontend kuralı varsa (ör. Baharatlı)
  // o aile API'ye gönderilmez, gelen liste burada süzülür.
  const clientRule = CLIENT_SCENT_FAMILY_RULES[scentFamily];
  const results = useApiQuery(
    (signal) => api.listPerfumes({ season, time, scentFamily: clientRule ? 'all' : scentFamily, limit: 100 }, signal),
    [season, time, scentFamily]
  );
  const perfumes = clientRule ? (results.data?.data ?? []).filter(clientRule) : (results.data?.data ?? []);
  const hasFilters = season !== 'all' || time !== 'all' || scentFamily !== 'all';

  // Sonuç listesine yumuşakça kaydır (sonuçlar citrus banner'ın altında)
  const scrollToResults = () =>
    document.getElementById('finder-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const clearFilters = () => {
    setSeason('all');
    setTime('all');
    setScentFamily('all');
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">Akıllı koku bulucu</p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-light leading-tight text-neutral-900">
          Sana en uygun kokuyu bul
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          Mevsime, günün saatine ve sevdiğin koku ailesine göre filtrele; eşleşmeler anında güncellensin.
        </p>
      </header>

      <div
        id="finder-filters"
        className="mt-10 scroll-mt-28 grid lg:grid-cols-2 gap-x-8 gap-y-10 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-8 shadow-sm"
      >
        {FINDER_FILTERS.map((filter) => (
          <div key={filter.key} className={groupSpan(filter.options.length)}>
            <FilterGroup
              filter={filter}
              value={values[filter.key]}
              onChange={(value) => {
                setters[filter.key](value);
                // Mevsim, kullanım zamanı ve koku ailesinin üçü de seçilince (son seçimde)
                // filtrelenmiş parfümlere in; ara seçimlerde sayfa yerinde kalır
                const next = { ...values, [filter.key]: value };
                if (value !== 'all' && Object.values(next).every((v) => v !== 'all')) scrollToResults();
              }}
            />
          </div>
        ))}
      </div>

      {/* Akış: filtreler -> narenciye hero banner -> parfüm listesi.
          Banner butonu Fresh filtresini uygular ve alttaki listeye kaydırır. */}
      <FinderHeroBanner
        onShowFresh={() => {
          setScentFamily('fresh');
          document.getElementById('finder-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      <div
        id="finder-results"
        className="mt-12 mb-6 scroll-mt-28 flex flex-wrap items-center justify-between gap-4"
        aria-live="polite"
      >
        <p className="inline-flex items-center gap-2 text-[13px] text-neutral-500">
          {results.data ? (
            <>
              <span className="font-medium text-neutral-900">{perfumes.length}</span> parfüm eşleşti
            </>
          ) : (
            'Eşleşmeler aranıyor…'
          )}
          {results.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400" aria-label="Yükleniyor" />}
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[13px] text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors cursor-pointer"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {results.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-[14px] text-red-700">{results.error}</p>
          <button
            onClick={results.reload}
            className="mt-4 h-10 px-6 rounded-full bg-neutral-900 text-white text-[12px] uppercase tracking-[0.18em] cursor-pointer"
          >
            Tekrar dene
          </button>
        </div>
      ) : results.data && perfumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="font-display text-2xl font-light text-neutral-700">Bu seçimlere uygun parfüm bulunamadı.</p>
          <p className="mt-2 text-[13px] text-neutral-400">Bir filtreyi gevşetmeyi ya da temizlemeyi deneyebilirsin.</p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${
            results.loading ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {perfumes.map((perfume) => (
            <FinderCard
              key={perfume.id}
              perfume={perfume}
              getImage={getImage}
              onImageError={onImageError}
              onSelect={onSelectPerfume}
            />
          ))}
        </div>
      )}
    </div>
  );
}
