import { useEffect, useId, useState } from 'react';
import { ArrowLeft, Check, HelpCircle, Package } from 'lucide-react';
import type { User } from './types';
import { api, errorMessage } from './api';

interface ContactPageProps {
  open: boolean;
  user: User | null;
  token: string | null;
  onClose: () => void;
  onGoHome: () => void;
  onOpenFaq: () => void;
  onTrackOrder: () => void;
}

const field =
  'w-full rounded-md border border-neutral-400 focus:border-neutral-900 bg-white px-4 text-[16px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none';
const label = 'block text-[13px] text-neutral-600 mb-1.5';

// Bize ulaşın: POST /api/contact. Giriş yapılmışsa ad ve e-posta hazır gelir.
export default function ContactPage({ open, user, token, onClose, onGoHome, onOpenFaq, onTrackOrder }: ContactPageProps) {
  const id = useId();
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', subject: '', orderNumber: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  useEffect(() => {
    if (open && subjects.length === 0) api.getContactSubjects().then(setSubjects).catch(() => {});
  }, [open, subjects.length]);

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

  if (!open) return null;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const showOrderField = form.subject === 'order' || form.subject === 'return';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await api.sendContact(
        { ...form, orderNumber: showOrderField ? form.orderNumber.trim() : '' },
        token
      );
      setTicket(result.ticket);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="contact-title" className="fixed inset-0 z-[60] overflow-y-auto bg-white">
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
        <h1 id="contact-title" className="text-[40px] sm:text-[46px] font-normal leading-tight text-neutral-900">
          Bize ulaşın
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-neutral-600">
          Sorunuzu veya talebinizi yazın; mesajınız kaydedilir ve size bir talep numarası verilir.
        </p>
      </div>

      <div className="px-6 sm:px-12 lg:px-[8%] py-12 grid lg:grid-cols-[1fr_340px] gap-12 max-w-[1300px]">
        <div className="max-w-2xl">
          {ticket ? (
            <div role="status" className="rounded-md border border-neutral-900 p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-[#c9a96e]">
                <Check className="w-5 h-5" strokeWidth={2} />
              </span>
              <h2 className="mt-6 text-[24px] font-semibold text-neutral-900">Mesajınız alındı</h2>
              <p className="mt-2 text-[15px] text-neutral-600">Talep numaranız</p>
              <p className="mt-1 text-[28px] font-semibold tracking-[0.12em] text-neutral-900 select-all">{ticket}</p>
              <p className="mt-4 text-[14px] leading-relaxed text-neutral-500">
                Bu bir sunum projesi olduğu için mesajlara gerçek bir ekip yanıt vermez ve e-posta gönderilmez; mesajınız
                sunucuda kayıtlıdır.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setTicket(null);
                    setForm((f) => ({ ...f, subject: '', orderNumber: '', message: '' }));
                  }}
                  className="h-12 px-6 rounded-md border border-neutral-400 hover:border-neutral-900 text-[15px] cursor-pointer"
                >
                  Yeni mesaj gönder
                </button>
                <button onClick={onClose} className="h-12 px-6 rounded-md bg-neutral-900 hover:bg-neutral-700 text-white text-[15px] cursor-pointer">
                  Alışverişe dön
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`${id}-name`} className={label}>
                    Ad soyad *
                  </label>
                  <input id={`${id}-name`} required maxLength={80} autoComplete="name" value={form.name} onChange={set('name')} className={`${field} h-14`} />
                </div>
                <div>
                  <label htmlFor={`${id}-email`} className={label}>
                    E-posta *
                  </label>
                  <input
                    id={`${id}-email`}
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    className={`${field} h-14`}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`${id}-subject`} className={label}>
                    Konu *
                  </label>
                  <select id={`${id}-subject`} required value={form.subject} onChange={set('subject')} className={`${field} h-14 cursor-pointer`}>
                    <option value="" disabled>
                      Konu seçin
                    </option>
                    {subjects.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {showOrderField && (
                  <div>
                    <label htmlFor={`${id}-order`} className={label}>
                      Sipariş numarası (isteğe bağlı)
                    </label>
                    <input
                      id={`${id}-order`}
                      value={form.orderNumber}
                      onChange={set('orderNumber')}
                      placeholder="ORD-1234"
                      className={`${field} h-14 uppercase placeholder:normal-case`}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor={`${id}-message`} className={label}>
                  Mesajınız *
                </label>
                <textarea
                  id={`${id}-message`}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  value={form.message}
                  onChange={set('message')}
                  className={`${field} py-3 resize-y`}
                />
                <p className="mt-1 text-right text-[12px] text-neutral-400 tabular-nums">{form.message.length}/2000</p>
              </div>

              {error && (
                <p role="alert" className="text-[14px] text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="h-14 px-10 rounded-md bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-[16px] cursor-pointer"
              >
                {sending ? 'Gönderiliyor…' : 'Mesajı gönder'}
              </button>
            </form>
          )}
        </div>

        {/* Yan: hızlı yardım */}
        <aside className="space-y-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-neutral-500">Hızlı yardım</p>
          <button
            onClick={onTrackOrder}
            className="w-full text-left rounded-md border border-neutral-200 hover:border-neutral-900 p-5 flex gap-4 transition-colors cursor-pointer"
          >
            <Package className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.4} />
            <span>
              <span className="block text-[16px] text-neutral-900">Siparişimi takip et</span>
              <span className="block mt-1 text-[14px] text-neutral-500">Sipariş durumu, kargo takip numarası, iptal ve iade</span>
            </span>
          </button>
          <button
            onClick={onOpenFaq}
            className="w-full text-left rounded-md border border-neutral-200 hover:border-neutral-900 p-5 flex gap-4 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.4} />
            <span>
              <span className="block text-[16px] text-neutral-900">Sıkça sorulan sorular</span>
              <span className="block mt-1 text-[14px] text-neutral-500">Kargo, iade, ödeme ve üyelikle ilgili yanıtlar</span>
            </span>
          </button>
        </aside>
      </div>
    </div>
  );
}
