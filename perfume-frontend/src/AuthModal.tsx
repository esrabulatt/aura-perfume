import { useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type { AuthResponse } from './types';
import { api, errorMessage } from './api';

export type AuthMode = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  /** Formun üstünde gösterilecek bilgi (ör. "Oturumunuzun süresi doldu") */
  notice?: string | null;
  /** Başarılı giriş / kayıt: JWT ve kullanıcı App'e verilir */
  onAuthenticated: (result: AuthResponse) => void;
}

async function submitAuth(mode: AuthMode, form: { name: string; email: string; password: string }) {
  return mode === 'register' ? api.register(form.name, form.email, form.password) : api.login(form.email, form.password);
}

/**
 * Giriş Yap / Üye Ol penceresi: solda editoryal görsel, sağda sekmeli form.
 * POST /api/auth/login ve /api/auth/register'a istek atar.
 */
export default function AuthModal({ open, mode, onModeChange, onClose, notice, onAuthenticated }: AuthModalProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Açılınca ilk alana odaklan; Esc ile kapan; arka plan kaymasın
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, mode, onClose]);

  const switchMode = (next: AuthMode) => {
    setError(null);
    onModeChange(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await submitAuth(mode, form);
      setForm({ name: '', email: '', password: '' });
      onAuthenticated(result);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const isRegister = mode === 'register';
  const field =
    'w-full bg-transparent border-b border-neutral-300 focus:border-neutral-900 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors';
  const label = 'block text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl grid md:grid-cols-2"
      >
        {/* Sol: editoryal görsel (yalnızca geniş ekranda) */}
        <div className="relative hidden md:block min-h-[560px] bg-neutral-900">
          <img loading="lazy" decoding="async" src="/images/banners/lifestyle-desk.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="font-display text-[34px] font-light leading-tight">Aura Perfumé</p>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/80">
              {isRegister
                ? 'Üye olun; favorileriniz, sepetiniz ve size özel öneriler tek yerde.'
                : 'Tekrar hoş geldiniz. Kaldığınız yerden devam edin.'}
            </p>
          </div>
        </div>

        {/* Sağ: sekmeler + form */}
        <div className="relative px-7 sm:px-12 py-12">
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-900 cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.3} />
          </button>

          <div role="tablist" aria-label="Hesap" className="flex gap-8 border-b border-neutral-200">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`-mb-px pb-3 border-b-2 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                  mode === m ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {m === 'login' ? 'Giriş yap' : 'Üye ol'}
              </button>
            ))}
          </div>

          <h2 id={`${id}-title`} className="mt-8 font-display text-4xl font-light text-neutral-900">
            {isRegister ? 'Hesap oluşturun' : 'Hesabınıza giriş yapın'}
          </h2>

          {notice && (
            <p role="status" className="mt-6 rounded-md bg-neutral-100 px-4 py-3 text-[14px] text-neutral-800">
              {notice}
            </p>
          )}

          <form onSubmit={submit} className="mt-8 space-y-6" noValidate={false}>
            {isRegister && (
              <div>
                <label htmlFor={`${id}-name`} className={label}>
                  Ad soyad
                </label>
                <input
                  ref={firstFieldRef}
                  id={`${id}-name`}
                  required
                  maxLength={60}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Örn. Elif Kaya"
                  className={field}
                />
              </div>
            )}

            <div>
              <label htmlFor={`${id}-email`} className={label}>
                E-posta
              </label>
              <input
                ref={isRegister ? undefined : firstFieldRef}
                id={`${id}-email`}
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ornek@eposta.com"
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${id}-password`} className={label}>
                Şifre
              </label>
              <div className="relative">
                <input
                  id={`${id}-password`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isRegister ? 8 : undefined}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={isRegister ? 'En az 8 karakter, harf ve rakam' : '••••••••'}
                  className={`${field} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-900 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.4} /> : <Eye className="w-4 h-4" strokeWidth={1.4} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full h-14 bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-[12px] font-medium uppercase tracking-[0.22em] transition-colors cursor-pointer"
            >
              {sending ? 'Lütfen bekleyin…' : isRegister ? 'Üye ol' : 'Giriş yap'}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-neutral-500">
            {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
            <button
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="text-neutral-900 underline underline-offset-4 cursor-pointer"
            >
              {isRegister ? 'Giriş yapın' : 'Üye olun'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
