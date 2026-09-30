import { useState } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { api, errorMessage } from './api';

interface FooterProps {
  onOpenCollection: () => void;
  onOpenFinder: () => void;
  onOpenQuiz: () => void;
  onOpenCart: () => void;
  onTrackOrder: () => void;
  /** SSS sayfası; section verilirse o bölüm açılır */
  onOpenFaq: (section?: string) => void;
  /** Yasal metin (slug: yasal-uyari, gizlilik-politikasi, cerez-politikasi, satin-alma-hukumleri) */
  onOpenLegal: (slug: string) => void;
  onContact: () => void;
}

interface FooterLink {
  label: string;
  onClick?: () => void;
}

const headingClass = 'text-[13px] font-semibold uppercase tracking-wide text-neutral-900';
const linkClass = 'text-[13px] uppercase tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors text-left';

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className={headingClass}>{title}</h3>
      <ul className="mt-7 space-y-5">
        {links.map(({ label, onClick }) => (
          <li key={label}>
            {onClick ? (
              <button onClick={onClick} className={`${linkClass} cursor-pointer`}>
                {label}
              </button>
            ) : (
              // Henüz sayfası olmayan bağlantılar (sunum için yer tutucu)
              <span className={`${linkClass} cursor-default hover:text-neutral-600`}>{label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Bülten kaydı backend'e gider: POST /api/newsletter
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading' });
    try {
      const { message } = await api.subscribeNewsletter(email);
      setStatus({ type: 'success', message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: errorMessage(err) });
    }
  };

  return (
    <div>
      <h3 className={headingClass}>Bülten</h3>
      <p className="mt-7 text-[13px] leading-relaxed text-neutral-600">
        Yeni kokulardan ve koleksiyonlardan ilk sen haberdar ol.
      </p>
      <form onSubmit={submit} className="mt-5 flex items-center border-b border-neutral-900">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresin"
          aria-label="E-posta adresin"
          className="flex-1 min-w-0 bg-transparent py-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status.type === 'loading'}
          aria-label="Bültene kaydol"
          className="p-2 text-neutral-900 hover:text-neutral-500 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </form>
      {status.message && (
        <p
          role="status"
          className={`mt-3 text-[12px] ${status.type === 'error' ? 'text-red-600' : 'text-neutral-600'}`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

export default function Footer({
  onOpenCollection,
  onOpenFinder,
  onOpenQuiz,
  onOpenCart,
  onTrackOrder,
  onOpenFaq,
  onOpenLegal,
  onContact,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200 overflow-hidden">
      <div className="px-6 sm:px-10 pt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
        <LinkColumn
          title="İletişim"
          links={[
            { label: 'Bize ulaşın', onClick: onContact },
        
          ]}
        />
        <LinkColumn
          title="Destek"
          links={[
            { label: 'Sepetim', onClick: onOpenCart },
            { label: 'Siparişinizi takip edin', onClick: onTrackOrder },
            { label: 'SSS', onClick: () => onOpenFaq() },
            { label: 'Gönderim ve iadeler', onClick: () => onOpenFaq('iptal-iade') },
          ]}
        />
        <LinkColumn
          title="Keşfet"
          links={[
            { label: 'Koleksiyon', onClick: onOpenCollection },
            { label: 'Scent Finder', onClick: onOpenFinder },
            { label: 'Koku testi', onClick: onOpenQuiz },
          ]}
        />
        <LinkColumn
          title="Yasal"
          links={[
            { label: 'Yasal uyarı', onClick: () => onOpenLegal('yasal-uyari') },
            { label: 'Gizlilik politikası', onClick: () => onOpenLegal('gizlilik-politikasi') },
            { label: 'Çerez politikası', onClick: () => onOpenLegal('cerez-politikasi') },
            { label: 'Satın alma hükümleri', onClick: () => onOpenLegal('satin-alma-hukumleri') },
          ]}
        />
        <div className="col-span-2 md:col-span-1">
          <NewsletterForm />
        </div>
      </div>

      {/* Ekran genişliğini dolduran dev logo yazısı */}
      <svg
        viewBox="0 0 1000 215"
        className="block w-full h-auto mt-16 text-neutral-900 select-none"
        role="img"
        aria-label="Aura Perfumé"
      >
        <text
          x="500"
          y="165"
          textAnchor="middle"
          textLength="930"
          lengthAdjust="spacingAndGlyphs"
          className="font-display"
          fontSize="228"
          fontWeight="400"
          fill="currentColor"
        >
          Aura Perfumé
        </text>
      </svg>

      <div className="px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-4 text-[12px] text-neutral-700">
        <p>© Aura Perfumé {year} · Sunum projesi</p>
        <p className="inline-flex items-center gap-2.5 uppercase tracking-wide text-[13px]">
          <Globe className="w-5 h-5" strokeWidth={1.2} />
          Türkiye/Türkçe
        </p>
      </div>
    </footer>
  );
}
