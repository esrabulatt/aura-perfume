import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Notes } from './types';

// ---------------------------------------------------------------------------
// Akordeon: ince çizgilerle ayrılmış satırlar, tıklanınca yumuşakça açılır
// ---------------------------------------------------------------------------

interface AccordionItemProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ title, open, onToggle, children }: AccordionItemProps) {
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className="border-b border-neutral-200">
      <h3>
        <button
          id={buttonId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group w-full flex items-center justify-between py-5 text-left cursor-pointer"
        >
          <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-neutral-900 group-hover:text-neutral-500 transition-colors">
            {title}
          </span>
          <Plus
            aria-hidden
            strokeWidth={1.2}
            className={`w-4 h-4 text-neutral-900 transition-transform duration-500 ease-out motion-reduce:transition-none ${
              open ? 'rotate-45' : ''
            }`}
          />
        </button>
      </h3>

      {/* grid-rows 0fr -> 1fr geçişi, içerik yüksekliği bilinmeden yumuşak açılma sağlar */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-8 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ürün detayları: ince alt çizgili iki sütunlu tablo
// ---------------------------------------------------------------------------

export interface SpecRow {
  label: string;
  value: React.ReactNode;
}

function SpecsTable({ description, rows }: { description?: string; rows: SpecRow[] }) {
  return (
    <div>
      {description && <p className="mb-6 text-[15px] leading-relaxed text-neutral-600">{description}</p>}
      <dl>
        {rows.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 py-3.5 border-b border-gray-100 last:border-b-0">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 self-center">{label}</dt>
            <dd className="text-[14px] leading-relaxed text-neutral-900 first-letter:uppercase">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Koku piramidi: üstten alta dikey akış; nokta büyüklüğü katmanın ağırlığını anlatır
// ---------------------------------------------------------------------------

const PYRAMID_LAYERS: { key: keyof Notes; label: string; hint: string; dot: string }[] = [
  { key: 'top', label: 'Üst notalar', hint: 'İlk izlenim · ilk 15 dakika', dot: 'w-1.5 h-1.5' },
  { key: 'middle', label: 'Orta notalar', hint: 'Kokunun kalbi · 2–4 saat', dot: 'w-2 h-2' },
  { key: 'base', label: 'Alt notalar', hint: 'Kalıcı iz · 6 saat ve sonrası', dot: 'w-2.5 h-2.5' },
];

function ScentPyramid({ notes }: { notes: Notes }) {
  return (
    <ol className="relative">
      {PYRAMID_LAYERS.map(({ key, label, hint, dot }, i) => {
        const layerNotes = notes[key];
        const isLast = i === PYRAMID_LAYERS.length - 1;
        return (
          <li key={key} className="relative grid grid-cols-[1.25rem_1fr] gap-x-3">
            {/* Sol: nokta ve katmanları birbirine bağlayan ince dikey çizgi */}
            <div className="relative flex justify-center">
              {!isLast && <span aria-hidden className="absolute top-2.5 bottom-0 w-px bg-neutral-200" />}
              <span aria-hidden className={`relative mt-[5px] rounded-full bg-neutral-900 ${dot}`} />
            </div>

            <div className={isLast ? '' : 'pb-5'}>
              {/* Başlık ve açıklama tek satırda: dikey alan kazanılır */}
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-800">{label}</span>
                <span className="text-[11px] tracking-wide text-neutral-400">{hint}</span>
              </p>
              {layerNotes.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {layerNotes.map((note) => (
                    <li
                      key={note}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[13px] text-neutral-800 first-letter:uppercase"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 text-[13px] text-neutral-300">—</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Gönderim ve iadeler
// ---------------------------------------------------------------------------

const SHIPPING_ROWS: SpecRow[] = [
  { label: 'Kargo', value: 'Siparişler 1–3 iş günü içinde özenle paketlenip kargoya verilir.' },
  { label: 'İade', value: 'Açılmamış ürünler teslimattan itibaren 14 gün içinde iade edilebilir.' },
  { label: 'Paketleme', value: 'Her parfüm, imzalı kutusunda ve koruyucu ambalajla gönderilir.' },
];

// ---------------------------------------------------------------------------
// Detay sayfasındaki bilgi bölümü: aynı anda tek satır açık kalır
// ---------------------------------------------------------------------------

type SectionKey = 'details' | 'notes' | 'shipping';

interface ProductInfoProps {
  description?: string;
  specs: SpecRow[];
  notes: Notes;
}

export default function ProductInfo({ description, specs, notes }: ProductInfoProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const toggle = (key: SectionKey) => setOpenSection((current) => (current === key ? null : key));

  return (
    <div className="border-t border-neutral-200">
      <AccordionItem title="Ürün detayları" open={openSection === 'details'} onToggle={() => toggle('details')}>
        <SpecsTable description={description} rows={specs} />
      </AccordionItem>
      <AccordionItem title="Koku notaları" open={openSection === 'notes'} onToggle={() => toggle('notes')}>
        <ScentPyramid notes={notes} />
      </AccordionItem>
      <AccordionItem title="Gönderim ve iadeler" open={openSection === 'shipping'} onToggle={() => toggle('shipping')}>
        <SpecsTable rows={SHIPPING_ROWS} />
      </AccordionItem>
    </div>
  );
}
