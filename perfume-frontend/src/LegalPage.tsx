import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api, errorMessage } from './api';

export interface LegalDocument {
  slug: string;
  title: string;
  updatedAt: string;
  /** Demo projesi açıklaması */
  notice?: string;
  sections: { heading: string; body: string[] }[];
}

const LEGAL_LINKS = [
  { slug: 'yasal-uyari', title: 'Yasal uyarı' },
  { slug: 'gizlilik-politikasi', title: 'Gizlilik politikası' },
  { slug: 'cerez-politikasi', title: 'Çerez politikası' },
  { slug: 'satin-alma-hukumleri', title: 'Satın alma hükümleri' },
];

interface LegalPageProps {
  /** Açık metnin slug'ı; null = kapalı */
  slug: string | null;
  onChange: (slug: string) => void;
  onClose: () => void;
  onGoHome: () => void;
}

const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

// Yasal metinler: GET /api/legal/:slug. Solda metinler arası geçiş, sağda içerik.
export default function LegalPage({ slug, onChange, onClose, onGoHome }: LegalPageProps) {
  const [docs, setDocs] = useState<Record<string, LegalDocument>>({});
  const [error, setError] = useState<string | null>(null);
  const doc = slug ? docs[slug] : undefined;

  useEffect(() => {
    if (!slug || docs[slug]) return;
    const controller = new AbortController();
    api
      .getLegal(slug, controller.signal)
      .then((d) => {
        setDocs((all) => ({ ...all, [d.slug]: d }));
        setError(null);
      })
      .catch((err) => !controller.signal.aborted && setError(errorMessage(err)));
    return () => controller.abort();
  }, [slug, docs]);

  useEffect(() => {
    if (!slug) return;
    document.getElementById('legal-scroll')?.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [slug, onClose]);

  if (!slug) return null;
  const title = LEGAL_LINKS.find((l) => l.slug === slug)?.title ?? 'Yasal';

  return (
    <div id="legal-scroll" role="dialog" aria-modal="true" aria-labelledby="legal-title" className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 h-[72px] border-b border-neutral-200 bg-white px-4 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button onClick={onClose} aria-label="Geri dön" className="justify-self-start -m-2 p-2 sm:m-0 sm:p-0 inline-flex items-center gap-2 text-[14px] text-neutral-700 hover:text-neutral-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Geri dön</span>
        </button>
        <button onClick={onGoHome} aria-label="Ana sayfaya dön" className="font-display text-[24px] sm:text-[30px] leading-none whitespace-nowrap hover:opacity-70 cursor-pointer">
          Aura Perfumé
        </button>
        <span aria-hidden />
      </div>

      <div className="bg-[#f7f7f7] px-6 sm:px-12 lg:px-[8%] pt-10 pb-10">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-neutral-500">Yasal</p>
        <h1 id="legal-title" className="mt-3 text-[40px] sm:text-[46px] font-normal leading-tight text-neutral-900">
          {title}
        </h1>
        {doc && <p className="mt-3 text-[14px] text-neutral-500">Son güncelleme: {formatDate(doc.updatedAt)}</p>}
      </div>

      <div className="px-6 sm:px-12 lg:px-[8%] py-12 grid lg:grid-cols-[240px_1fr] gap-12">
        <nav aria-label="Yasal metinler">
          <ul className="lg:sticky lg:top-[104px] flex lg:block flex-wrap gap-2 lg:space-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.slug}>
                <button
                  onClick={() => onChange(link.slug)}
                  aria-current={link.slug === slug ? 'page' : undefined}
                  className={`text-left py-2 text-[15px] cursor-pointer transition-colors ${
                    link.slug === slug
                      ? 'text-neutral-900 font-medium underline underline-offset-[6px] decoration-1'
                      : 'text-neutral-600 hover:text-neutral-900'
                  } max-lg:px-4 max-lg:rounded-full max-lg:border max-lg:border-neutral-200 max-lg:no-underline`}
                >
                  {link.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-3xl">
          {error && (
            <p role="alert" className="text-[15px] text-red-600">
              {error}
            </p>
          )}
          {!doc && !error && <p className="text-[15px] text-neutral-500">Yükleniyor…</p>}
          {doc?.notice && (
            <p className="mb-10 rounded-md border border-neutral-300 bg-neutral-50 px-5 py-4 text-[15px] leading-relaxed text-neutral-700">
              {doc.notice}
            </p>
          )}
          {doc?.sections.map((section, i) => (
            <section key={section.heading} className={i > 0 ? 'mt-10' : ''}>
              <h2 className="text-[22px] font-semibold text-neutral-900">
                {i + 1}. {section.heading}
              </h2>
              <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-neutral-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
