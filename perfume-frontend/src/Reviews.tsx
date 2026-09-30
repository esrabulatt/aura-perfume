import { useEffect, useId, useState } from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import type { NewReview, Review, ReviewSummary } from './types';
import { api, errorMessage } from './api';

const PAGE_SIZE = 4;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------------------------------------------------------------------------
// Yıldızlar: kesirli puanlar için dolu yıldızlar üst katmanda genişlikle kırpılır
// ---------------------------------------------------------------------------

function Stars({ value, size = 'w-3.5 h-3.5' }: { value: number; size?: string }) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (className: string) => (
    // w-max + shrink-0: dolu katman daraltıldığında yıldızlar küçülmez, sadece kırpılır
    <span className="flex w-max gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} shrink-0 ${className}`} strokeWidth={1.2} />
      ))}
    </span>
  );
  return (
    <span className="relative inline-flex" role="img" aria-label={`5 üzerinden ${value}`}>
      {row('text-neutral-300')}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
        {row('fill-neutral-900 text-neutral-900')}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Yorum formu: yumuşakça açılan panel; POST /api/perfumes/:id/reviews
// ---------------------------------------------------------------------------

interface ReviewFormProps {
  perfumeId: number;
  onCreated: (review: Review, summary: ReviewSummary) => void;
  onCancel: () => void;
}

function ReviewForm({ perfumeId, onCreated, onCancel }: ReviewFormProps) {
  const [form, setForm] = useState<NewReview>({ author: '', rating: 0, title: '', body: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const set = <K extends keyof NewReview>(key: K, value: NewReview[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      setError('Lütfen bir puan seçin.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { data, summary } = await api.createReview(perfumeId, form);
      onCreated(data, summary);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const field =
    'w-full bg-transparent border-b border-neutral-300 focus:border-neutral-900 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors';
  const label = 'block text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500';
  const shown = hoverRating || form.rating;

  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-x-12 gap-y-8 py-10">
      <div>
        <label htmlFor={`${id}-author`} className={label}>
          Adınız
        </label>
        <input
          id={`${id}-author`}
          required
          maxLength={60}
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
          placeholder="Örn. Elif K."
          className={field}
        />
      </div>

      <div>
        <span id={`${id}-rating`} className={label}>
          Puanınız
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-rating`} className="flex gap-1.5 pt-3" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={form.rating === n}
              aria-label={`${n} yıldız`}
              onClick={() => set('rating', n)}
              onMouseEnter={() => setHoverRating(n)}
              className="p-0.5 cursor-pointer"
            >
              <Star
                strokeWidth={1.2}
                className={`w-6 h-6 transition-colors ${n <= shown ? 'fill-neutral-900 text-neutral-900' : 'text-neutral-300'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <label htmlFor={`${id}-title`} className={label}>
          Başlık
        </label>
        <input
          id={`${id}-title`}
          required
          maxLength={120}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Deneyiminizi tek cümleyle özetleyin"
          className={field}
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor={`${id}-body`} className={label}>
          Yorumunuz
        </label>
        <textarea
          id={`${id}-body`}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Kalıcılık, yayılım, hangi notaları hissettiniz…"
          className={`${field} resize-none`}
        />
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="h-12 px-10 bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
        >
          {sending ? 'Gönderiliyor…' : 'Gönder'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-6 text-[12px] font-medium uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Vazgeç
        </button>
        {error && (
          <p role="alert" className="text-[13px] text-red-600">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tek yorum kartı
// ---------------------------------------------------------------------------

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex flex-col rounded-xl border border-neutral-100 bg-neutral-50/50 p-6">
      {/* Üst satır: kullanıcı ve rozet solda, tarih sağda */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[15px] font-medium text-neutral-900">{review.author}</p>
          {review.verifiedBuyer && (
            <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600">
              <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              Doğrulanmış alıcı
            </p>
          )}
        </div>
        <time dateTime={review.createdAt} className="text-[12px] text-neutral-400">
          {formatDate(review.createdAt)}
        </time>
      </header>

      <div className="mt-4">
        <Stars value={review.rating} />
      </div>
      <h3 className="mt-3 font-display text-[22px] font-light leading-snug text-neutral-900">{review.title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{review.body}</p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Bölüm: özet + dağılım + yorum listesi + daha fazla
// ---------------------------------------------------------------------------

export default function Reviews({ perfumeId }: { perfumeId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  // GET /api/perfumes/:id/reviews?page=...  — ilk sayfa değiştirir, sonrakiler listeye eklenir
  useEffect(() => {
    const controller = new AbortController();
    api
      .getReviews(perfumeId, page, PAGE_SIZE, controller.signal)
      .then((res) => {
        setSummary(res.summary);
        setHasNext(res.pagination.hasNext);
        setReviews((prev) => {
          const base = page === 1 ? [] : prev;
          const seen = new Set(base.map((r) => r.id));
          return [...base, ...res.data.filter((r) => !seen.has(r.id))];
        });
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [perfumeId, page]);

  const handleCreated = (review: Review, newSummary: ReviewSummary) => {
    setReviews((prev) => [review, ...prev]);
    setSummary(newSummary);
    setFormOpen(false);
    setThanks(true);
  };

  const loadMore = () => {
    setLoading(true);
    setPage((p) => p + 1);
  };

  const count = summary?.count ?? 0;

  return (
    <section aria-labelledby="reviews-heading" className="px-6 sm:px-12 lg:px-24 py-20 border-t border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Başlık ve buton */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">Müşteri değerlendirmeleri</p>
            <h2 id="reviews-heading" className="mt-3 font-display text-4xl sm:text-5xl font-light text-neutral-900">
              Kokuyu deneyenler anlatıyor
            </h2>
          </div>
          <button
            onClick={() => {
              setFormOpen((o) => !o);
              setThanks(false);
            }}
            aria-expanded={formOpen}
            className="h-12 px-8 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer"
          >
            {formOpen ? 'Formu kapat' : 'Değerlendir'}
          </button>
        </div>

        {/* Yorum formu (yumuşak açılır) */}
        <div
          inert={!formOpen}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
            formOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            {formOpen && (
              <ReviewForm perfumeId={perfumeId} onCreated={handleCreated} onCancel={() => setFormOpen(false)} />
            )}
          </div>
        </div>
        {thanks && (
          <p role="status" className="mt-6 text-[14px] text-neutral-700">
            Yorumunuz için teşekkürler, değerlendirmeniz yayınlandı.
          </p>
        )}

        {/* Puan özeti ve dağılım */}
        {summary && (
          <div className="mt-12 pb-12 border-b border-neutral-200">
            <div className="max-w-2xl mx-auto grid sm:grid-cols-[auto_1fr] gap-8 sm:gap-14 items-center">
              <div>
                <p className="font-display font-light text-neutral-900 leading-none">
                  <span className="text-7xl lining-nums">{summary.average?.toFixed(1) ?? '—'}</span>
                  <span className="ml-2 text-2xl text-neutral-400 lining-nums">/ 5.0</span>
                </p>
                <div className="mt-4">
                  <Stars value={summary.average ?? 0} size="w-4 h-4" />
                </div>
                <p className="mt-3 text-[13px] text-neutral-500">{count} değerlendirme</p>
              </div>

              <ul className="space-y-2.5" aria-label="Puan dağılımı">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const n = summary.distribution[star] ?? 0;
                  const width = count ? (n / count) * 100 : 0;
                  return (
                    <li key={star} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-4 text-[12px] text-neutral-500">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        {star}
                        <Star className="w-3 h-3 fill-neutral-900 text-neutral-900" strokeWidth={1.2} />
                      </span>
                      <span className="relative h-px bg-neutral-200">
                        <span className="absolute left-0 -top-px h-[3px] bg-neutral-900 transition-[width] duration-700" style={{ width: `${width}%` }} />
                      </span>
                      <span className="text-right tabular-nums">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* Yorum listesi */}
        {error && (
          <p role="alert" className="mt-10 text-[14px] text-red-600">
            {error}
          </p>
        )}
        {!error && summary && count === 0 && (
          <p className="py-12 font-display text-2xl font-light text-neutral-500">
            Henüz değerlendirme yok. İlk yorumu siz yazın.
          </p>
        )}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Daha fazla */}
        {(hasNext || (loading && reviews.length > 0)) && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-[12px] text-neutral-400">
              {count} yorumdan {reviews.length} tanesi gösteriliyor
            </p>
            <button
              onClick={loadMore}
              disabled={loading}
              className="h-12 px-10 border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-[12px] font-medium uppercase tracking-[0.2em] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Yükleniyor…' : 'Daha fazla yorum gör'}
            </button>
          </div>
        )}
        {loading && reviews.length === 0 && !error && (
          <p className="py-12 text-[13px] text-neutral-400">Değerlendirmeler yükleniyor…</p>
        )}
      </div>
    </section>
  );
}
