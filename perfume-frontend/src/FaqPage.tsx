import { useEffect, useId, useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { api, errorMessage } from './api';

export interface FaqSection {
  id: string;
  title: string;
  items: { q: string; a: string }[];
}

interface FaqPageProps {
  open: boolean;
  /** Açılınca doğrudan bu bölüme git (ör. footer > "Gönderim ve iadeler" -> "iptal-iade") */
  initialSection?: string | null;
  onClose: () => void;
  onGoHome: () => void;
  onTrackOrder: () => void;
  onContact: () => void;
}

// Aramada Türkçe büyük/küçük harf farkı gözetilmez
const normalize = (text: string) => text.toLocaleLowerCase('tr-TR');

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const id = useId();
  return (
    <div className="border-b border-neutral-200">
      <h3>
        <button
          id={`${id}-q`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          className="w-full flex items-start justify-between gap-6 py-5 text-left text-[17px] text-neutral-900 hover:text-neutral-600 cursor-pointer"
        >
          {q}
          <Plus
            aria-hidden
            strokeWidth={1.3}
            className={`mt-1 w-5 h-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-45' : ''}`}
          />
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-6 pr-10 text-[15px] leading-relaxed text-neutral-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

// Sıkça sorulan sorular: GET /api/faq. Solda bölümler, sağda akordeon; üstte arama.
export default function FaqPage({ open, initialSection, onClose, onGoHome, onTrackOrder, onContact }: FaqPageProps) {
  const [sections, setSections] = useState<FaqSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || sections) return;
    api
      .getFaq()
      .then(setSections)
      .catch((err) => setError(errorMessage(err)));
  }, [open, sections]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // İstenen bölüme kaydır (veri geldikten sonra)
  useEffect(() => {
    if (open && sections && initialSection) {
      requestAnimationFrame(() => document.getElementById(`faq-${initialSection}`)?.scrollIntoView({ block: 'start' }));
    }
  }, [open, sections, initialSection]);

  if (!open) return null;

  const term = normalize(query.trim());
  const visible = (sections ?? [])
    .map((s) => ({ ...s, items: term ? s.items.filter((i) => normalize(`${i.q} ${i.a}`).includes(term)) : s.items }))
    .filter((s) => s.items.length > 0);
  const resultCount = visible.reduce((n, s) => n + s.items.length, 0);

  const scrollTo = (id: string) => document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div id="faq-scroll" role="dialog" aria-modal="true" aria-labelledby="faq-title" className="fixed inset-0 z-[60] overflow-y-auto bg-white">
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
        <h1 id="faq-title" className="text-[40px] sm:text-[46px] font-normal leading-tight text-neutral-900">
          Sıkça sorulan sorular
        </h1>
        <div className="mt-6 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" strokeWidth={1.4} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sorunuzu arayın (ör. iade, kargo, iptal)"
            aria-label="Sıkça sorulan sorularda ara"
            className="w-full h-14 rounded-md border border-neutral-400 focus:border-neutral-900 bg-white pl-12 pr-4 text-[16px] focus:outline-none"
          />
        </div>
      </div>

      <div className="px-6 sm:px-12 lg:px-[8%] py-12 grid lg:grid-cols-[240px_1fr] gap-12">
        {/* Bölümler */}
        <nav aria-label="SSS bölümleri" className="hidden lg:block">
          <ul className="sticky top-[104px] space-y-1">
            {(sections ?? []).map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollTo(s.id)}
                  className="w-full text-left py-2 text-[15px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl">
          {error && (
            <p role="alert" className="text-[15px] text-red-600">
              {error}
            </p>
          )}
          {!sections && !error && <p className="text-[15px] text-neutral-500">Yükleniyor…</p>}
          {sections && term && (
            <p className="mb-6 text-[14px] text-neutral-500" aria-live="polite">
              "{query.trim()}" için {resultCount} sonuç
            </p>
          )}
          {sections && visible.length === 0 && (
            <p className="text-[16px] text-neutral-700">Aramanızla eşleşen bir soru bulunamadı.</p>
          )}

          {visible.map((section) => (
            <section key={section.id} id={`faq-${section.id}`} aria-labelledby={`faq-h-${section.id}`} className="scroll-mt-[96px] mb-14">
              <h2 id={`faq-h-${section.id}`} className="text-[24px] font-semibold text-neutral-900">
                {section.title}
              </h2>
              <div className="mt-4 border-t border-neutral-200">
                {section.items.map((item) => (
                  // Arama yapılırken eşleşen yanıtlar açık gelir
                  <FaqItem key={`${item.q}-${term}`} q={item.q} a={item.a} defaultOpen={Boolean(term)} />
                ))}
              </div>
            </section>
          ))}

          {sections && (
            <div className="rounded-md bg-neutral-100 p-8">
              <p className="text-[18px] font-semibold text-neutral-900">Aradığınızı bulamadınız mı?</p>
              <p className="mt-2 text-[15px] text-neutral-600">
                Siparişinizin durumunu hemen sorgulayabilir veya bize mesaj bırakabilirsiniz.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={onTrackOrder} className="h-12 px-8 rounded-md bg-neutral-900 hover:bg-neutral-700 text-white text-[15px] cursor-pointer">
                  Siparişimi takip et
                </button>
                <button
                  onClick={onContact}
                  className="h-12 px-8 rounded-md border border-neutral-400 hover:border-neutral-900 text-neutral-900 text-[15px] cursor-pointer"
                >
                  Bize ulaşın
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
