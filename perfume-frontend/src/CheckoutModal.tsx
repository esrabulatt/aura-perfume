import { useEffect, useId, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronRight, Lock, Truck } from 'lucide-react';
import type { Cart, Order, ShippingAddress, User } from './types';
import { api, errorMessage } from './api';
import { PROVINCES } from './turkeyLocations';
import {
  BRAND_LABELS,
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validateCard,
  type CardErrors,
} from './card';

interface CheckoutModalProps {
  open: boolean;
  cart: Cart | null;
  cartId: string;
  /** Giriş yapılmamışsa null: misafir olarak sipariş verilir (e-posta formdan alınır) */
  user: User | null;
  token: string | null;
  onClose: () => void;
  /** Misafir: "Giriş yapın" bağlantısı (giriş sonrası ödeme yeniden açılır) */
  onLogin: () => void;
  /** Logo: ödemeden çıkıp ana sayfaya döner */
  onGoHome: () => void;
  /** POST /api/orders başarılı olunca (App sepeti yeniler) */
  onOrderPlaced: (order: Order) => void;
  /** Onay adımından sipariş takibine geçiş */
  onTrackOrder: (order: Order) => void;
}

type Step = 1 | 2 | 3;
const STEPS: { step: Step; label: string; title: string }[] = [
  { step: 1, label: '1. Gönderim', title: '1. Adresinize teslimat' },
  { step: 2, label: '2. Ödeme Yöntemi', title: '2. Ödeme yöntemi' },
  { step: 3, label: '3. Sipariş Onayı', title: '3. Sipariş onayı' },
];

const VAT_RATE = 0.2; // fiyatlara KDV dahil
const DELIVERY_TEXT = '1-3 İş Günü';

// "2026-10-05" -> "5 Ekim Pazartesi"
const formatDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
const formatPrice = (value: number) => `${value.toLocaleString('tr-TR')} TL`;

// ---------------------------------------------------------------------------
// Çerçeveli alan: etiket kutunun içinde; yazmaya başlayınca yukarı küçülür
// ---------------------------------------------------------------------------

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  trailing?: React.ReactNode;
}

function Field({ label, error, trailing, id, required, className = '', ...input }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={fieldId}
          required={required}
          placeholder=" "
          aria-invalid={Boolean(error)}
          className={`peer w-full h-[72px] rounded-md border bg-white px-5 pt-6 pb-2 text-[16px] text-neutral-900 transition-colors focus:outline-none
            read-only:bg-neutral-50 read-only:text-neutral-600
            ${error ? 'border-red-500' : 'border-neutral-400 focus:border-neutral-900'} ${trailing ? 'pr-32' : ''}`}
          {...input}
        />
        <label
          htmlFor={fieldId}
          className="pointer-events-none absolute left-5 top-3 text-[12px] text-neutral-500 transition-all
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[16px]
            peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[12px]"
        >
          {label}
          {required && <sup className="ml-0.5">*</sup>}
        </label>
        {trailing && <span className="absolute right-5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && <p className="mt-1.5 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Açılır liste: Field ile aynı çerçeve ve etiket; tıklayınca tüm seçenekler listelenir
// ---------------------------------------------------------------------------

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  placeholder: string;
  error?: string;
}

function SelectField({ label, options, placeholder, error, id, required, className = '', value, disabled, ...select }: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const empty = !value;
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`w-full h-[72px] appearance-none rounded-md border bg-white pl-5 pr-12 pt-6 pb-2 text-[16px] transition-colors focus:outline-none cursor-pointer
            disabled:cursor-not-allowed disabled:bg-neutral-50
            ${empty ? 'text-transparent' : 'text-neutral-900'}
            ${error ? 'border-red-500' : 'border-neutral-400 focus:border-neutral-900'}`}
          {...select}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="text-neutral-900">
              {option}
            </option>
          ))}
        </select>
        <label
          htmlFor={fieldId}
          className={`pointer-events-none absolute left-5 transition-all ${
            empty ? 'top-1/2 -translate-y-1/2 text-[16px]' : 'top-3 text-[12px]'
          } ${disabled ? 'text-neutral-400' : 'text-neutral-500'}`}
        >
          {empty && disabled ? placeholder : label}
          {required && !(empty && disabled) && <sup className="ml-0.5">*</sup>}
        </label>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
          strokeWidth={1.5}
        />
      </div>
      {error && <p className="mt-1.5 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sağ panel: sipariş özeti + açılır bilgi satırları
// ---------------------------------------------------------------------------

function CardBadges() {
  const badge = 'h-8 w-12 rounded bg-neutral-100 flex items-center justify-center';
  return (
    <div className="flex gap-2.5" aria-label="Kabul edilen kartlar: Visa, Mastercard, Troy">
      <span className={`${badge} text-[11px] font-black italic text-[#1a1f71]`}>VISA</span>
      <span className={badge}>
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
      </span>
      <span className={`${badge} text-[11px] font-bold italic text-[#1a4d8f]`}>troy</span>
    </div>
  );
}

function InfoRow({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left text-[16px] font-medium text-neutral-900 cursor-pointer"
      >
        {title}
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>
      {open && <div className="pb-6 text-[15px] leading-relaxed text-neutral-700">{children}</div>}
    </div>
  );
}

interface SummaryLine {
  key: string;
  name: string;
  detail: string;
  quantity: number;
  image: string | null;
}

function OrderSummary({ lines, total }: { lines: SummaryLine[]; total: number }) {
  const vat = Math.round(total - total / (1 + VAT_RATE));
  return (
    <div>
      <h2 className="text-[26px] font-semibold text-neutral-900">Sipariş özetiniz</h2>
      <ul className="mt-8 space-y-6">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-5">
            <div className="w-28 h-36 shrink-0 bg-[#ece8e1] overflow-hidden">
              {line.image && <img loading="lazy" decoding="async" src={line.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="text-[16px] leading-snug text-neutral-900 space-y-2.5">
              <p>{line.name}</p>
              <p>{line.detail}</p>
              <p>Miktar: {line.quantity}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-8 border-t border-neutral-200 pt-6 space-y-3 text-[16px] text-neutral-900">
        <div className="flex justify-between">
          <dt>Alt Toplam</dt>
          <dd className="tabular-nums">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Gönderim</dt>
          <dd>Ücretsiz</dd>
        </div>
        <div className="flex justify-between">
          <dt>Vergiler (KDV dahil)</dt>
          <dd className="tabular-nums">{formatPrice(vat)}</dd>
        </div>
        <div className="flex justify-between pt-6 text-[24px] font-semibold">
          <dt>Toplam</dt>
          <dd className="tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <InfoRow title="Güvenli ödeme" defaultOpen>
          <p>
            Güvenliğiniz Aura Perfumé için önemlidir. Kart numaranız ve güvenlik kodunuz sunucularımıza gönderilmez ve
            saklanmaz.
          </p>
          <div className="mt-5">
            <CardBadges />
          </div>
        </InfoRow>
        <InfoRow title="Yardıma mı ihtiyacınız var? Bize ulaşın">
          <p>Sorularınız için menüdeki "Bize ulaşın" sayfasından mesaj bırakabilirsiniz; size bir talep numarası verilir.</p>
        </InfoRow>
        <InfoRow title="Ücretsiz gönderim ve iade">
          <p>Tüm siparişlerde gönderim ücretsizdir. Açılmamış ürünleri teslimattan itibaren 14 gün içinde iade edebilirsiniz.</p>
        </InfoRow>
        <div className="border-t border-neutral-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ödeme sayfası: 1. Gönderim → 2. Ödeme yöntemi → 3. Sipariş onayı
// Kart numarası ve CVC tarayıcıda doğrulanır ve sunucuya GÖNDERİLMEZ;
// POST /api/orders'a yalnızca kart türü ve son 4 hane gider (ödeme simüle edilir).
// ---------------------------------------------------------------------------

type AddressErrors = Partial<Record<'firstName' | 'lastName' | 'phone' | 'address' | 'district' | 'city' | 'postalCode', string>>;

export default function CheckoutModal({ open, cart, cartId, user, token, onClose, onLogin, onGoHome, onOrderPlaced, onTrackOrder }: CheckoutModalProps) {
  const [firstName, ...rest] = (user?.name ?? '').split(' ');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    firstName,
    lastName: rest.join(' '),
    phone: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
  });
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [card, setCard] = useState({ holder: user?.name ?? '', number: '', expiry: '', cvc: '' });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: key === 'postalCode' ? digitsOnly(e.target.value).slice(0, 5) : e.target.value }));

  const shippingAddress: ShippingAddress = {
    fullName: `${form.firstName} ${form.lastName}`.trim(),
    phone: form.phone,
    address: form.address,
    district: form.district,
    city: form.city,
    postalCode: form.postalCode,
  };

  const validateAddress = () => {
    const e: AddressErrors = {};
    if (!form.firstName.trim()) e.firstName = 'Adınızı girin.';
    if (!form.lastName.trim()) e.lastName = 'Soyadınızı girin.';
    if (digitsOnly(form.phone).length < 10) e.phone = 'En az 10 haneli bir telefon numarası girin.';
    if (!form.address.trim()) e.address = 'Adresinizi girin.';
    if (!form.city) e.city = 'İl seçin.';
    if (!form.district) e.district = form.city ? 'İlçe seçin.' : 'Önce il, ardından ilçe seçin.';
    if (!/^\d{5}$/.test(form.postalCode)) e.postalCode = '5 haneli posta kodunu girin.';
    setAddressErrors(e);
    const mailError = !user && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guestEmail.trim()) ? 'Geçerli bir e-posta adresi girin.' : undefined;
    setEmailError(mailError);
    return Object.keys(e).length === 0 && !mailError;
  };

  const goToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) {
      setStep(2);
      window.requestAnimationFrame(() => document.getElementById('checkout-scroll')?.scrollTo({ top: 0 }));
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors = validateCard(card);
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSending(true);
    try {
      const placed = await api.createOrder(token, {
        cartId,
        shippingAddress,
        payment: { brand: detectBrand(card.number), last4: digitsOnly(card.number).slice(-4) },
        ...(user ? {} : { email: guestEmail.trim() }),
      });
      setCard({ holder: user?.name ?? '', number: '', expiry: '', cvc: '' }); // kart bilgisi bellekte tutulmaz
      setOrder(placed);
      setStep(3);
      onOrderPlaced(placed);
      document.getElementById('checkout-scroll')?.scrollTo({ top: 0 });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // Özet: 3. adımda sipariş kaydından, öncesinde sepetten
  const lines: SummaryLine[] = order
    ? order.items.map((i) => ({
        key: `${i.perfumeId}-${i.size ?? ''}`,
        name: `${i.name}${i.size ? ` ${i.size.replace(/(\d)\s*ml$/i, '$1 ml')}` : ''}`,
        detail: i.brand,
        quantity: i.quantity,
        image: i.image,
      }))
    : (cart?.items ?? []).map((i) => ({
        key: `${i.perfume.id}-${i.size ?? ''}`,
        name: `${i.perfume.name}${i.size ? ` ${i.size.replace(/(\d)\s*ml$/i, '$1 ml')}` : ''}`,
        detail: i.perfume.brand,
        quantity: i.quantity,
        image: i.perfume.image ?? null,
      }));
  const total = order ? order.totalAmount : (cart?.totalPrice ?? 0);
  const current = STEPS[step - 1];
  const brand = detectBrand(card.number);

  const sectionTitle = 'text-[26px] font-semibold text-neutral-900';
  const primaryButton =
    'w-full sm:w-auto sm:min-w-[320px] h-16 rounded-md bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-[16px] font-medium transition-colors cursor-pointer';

  return (
    <div id="checkout-scroll" role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      {/* Üst çubuk */}
      <div className="sticky top-0 z-10 h-[72px] border-b border-neutral-200 bg-white px-4 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          onClick={onClose}
          disabled={sending}
          aria-label={step === 3 ? 'Alışverişe dön' : 'Sepete dön'}
          className="justify-self-start -m-2 p-2 sm:m-0 sm:p-0 inline-flex items-center gap-2 text-[14px] text-neutral-700 hover:text-neutral-900 disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{step === 3 ? 'Alışverişe dön' : 'Sepete dön'}</span>
        </button>
        <button
          onClick={onGoHome}
          disabled={sending}
          aria-label="Ana sayfaya dön"
          className="font-display text-[24px] sm:text-[30px] leading-none whitespace-nowrap hover:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          Aura Perfumé
        </button>
        <span className="justify-self-end inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
          <Lock className="w-4 h-4" strokeWidth={1.4} />
          <span className="hidden sm:inline">Güvenli ödeme</span>
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_600px] min-h-[calc(100%-72px)]">
        {/* SOL */}
        <div>
          <div className="bg-[#f7f7f7] px-6 sm:px-12 lg:px-[10%] pt-8 pb-10">
            <nav aria-label="Ödeme adımları">
              <ol className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[16px]">
                {STEPS.map((s, i) => {
                  const reachable = !order && s.step < step;
                  return (
                    <li key={s.step} className="inline-flex items-center gap-5">
                      {reachable ? (
                        <button onClick={() => setStep(s.step)} className="text-neutral-600 hover:text-neutral-900 cursor-pointer">
                          {s.label}
                        </button>
                      ) : (
                        <span
                          aria-current={s.step === step ? 'step' : undefined}
                          className={s.step === step ? 'font-medium text-neutral-900 underline underline-offset-[6px] decoration-1' : 'text-neutral-600'}
                        >
                          {s.label}
                        </span>
                      )}
                      {i < STEPS.length - 1 && <ChevronRight className="w-5 h-5 text-neutral-600" strokeWidth={1.4} />}
                    </li>
                  );
                })}
              </ol>
            </nav>
            <h1 id="checkout-title" className="mt-6 text-[40px] sm:text-[46px] font-normal leading-tight text-neutral-900">
              {current.title}
            </h1>
          </div>

          <div className="px-6 sm:px-12 lg:px-[10%] py-12 max-w-[1100px]">
            {/* 1. GÖNDERİM */}
            {step === 1 && (
              <form onSubmit={goToPayment} noValidate>
                <p className="text-[14px] text-neutral-600">
                  Zorunlu alanlar <sup>*</sup>
                </p>

                <h2 className={`mt-12 ${sectionTitle}`}>İletişim bilgileri</h2>
                {user ? (
                  <>
                    <p className="mt-5 text-[17px] leading-relaxed text-neutral-800">
                      Siparişiniz, bu e-posta adresiyle giriş yaptığınız hesaba kaydedilecektir.
                    </p>
                    <Field className="mt-8" label="E-posta adresi" required readOnly value={user.email} type="email" />
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-[17px] leading-relaxed text-neutral-800">
                      Üye olmadan devam ediyorsunuz. Sipariş numaranız ve bu e-posta adresiyle siparişinizi takip edebilirsiniz.
                    </p>
                    <p className="mt-2 text-[15px] text-neutral-600">
                      Hesabınız var mı?{' '}
                      <button type="button" onClick={onLogin} className="text-neutral-900 underline underline-offset-4 cursor-pointer">
                        Giriş yapın
                      </button>
                    </p>
                    <Field
                      className="mt-8"
                      label="E-posta adresi"
                      required
                      type="email"
                      autoComplete="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      error={emailError}
                    />
                  </>
                )}

                <h2 className={`mt-16 ${sectionTitle}`}>Gönderim adresi:</h2>
                <p className="mt-4 text-[17px] text-neutral-800">Konum: Türkiye</p>
                <div className="mt-8 grid sm:grid-cols-2 gap-x-7 gap-y-6">
                  <Field label="Adı" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={addressErrors.firstName} />
                  <Field label="Soyadı" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} error={addressErrors.lastName} />
                  <Field
                    className="sm:col-span-2"
                    label="Adres"
                    required
                    autoComplete="street-address"
                    maxLength={300}
                    value={form.address}
                    onChange={set('address')}
                    error={addressErrors.address}
                  />
                  <SelectField
                    label="İl"
                    placeholder="İl seçin"
                    required
                    autoComplete="address-level1"
                    options={PROVINCES.map((p) => p.name)}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, district: '' }))}
                    error={addressErrors.city}
                  />
                  <SelectField
                    label="İlçe"
                    placeholder={form.city ? 'İlçe seçin' : 'Önce il seçin'}
                    required
                    autoComplete="address-level2"
                    disabled={!form.city}
                    options={PROVINCES.find((p) => p.name === form.city)?.districts ?? []}
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    error={addressErrors.district}
                  />
                  <Field
                    label="Posta kodu"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={form.postalCode}
                    onChange={set('postalCode')}
                    error={addressErrors.postalCode}
                  />
                  <Field
                    label="Telefon"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    error={addressErrors.phone}
                  />
                </div>

                <button type="submit" className={`mt-12 ${primaryButton}`}>
                  Ödeme yöntemine devam et
                </button>
              </form>
            )}

            {/* 2. ÖDEME YÖNTEMİ */}
            {step === 2 && (
              <form onSubmit={placeOrder} noValidate>
                {/* Kart alanlarının üstünde: teslimat & kargo adresi (1. adımda girilen) */}
                <h2 className={sectionTitle}>Teslimat & Kargo Adresi</h2>
                <div className="mt-6 rounded-md border border-neutral-200 divide-y divide-neutral-200">
                  <div className="p-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="text-[15px] leading-relaxed text-neutral-800">
                      <p className="text-neutral-900 font-medium">{shippingAddress.fullName}</p>
                      <p>{shippingAddress.phone}</p>
                      <p className="mt-2">{shippingAddress.address}</p>
                      <p>
                        {shippingAddress.postalCode} {shippingAddress.district} / {shippingAddress.city}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-[15px] underline underline-offset-4 cursor-pointer">
                      Düzenle
                    </button>
                  </div>
                  <div className="p-6 flex items-center gap-4 text-[15px] text-neutral-800">
                    <Truck className="w-5 h-5 shrink-0 text-neutral-900" strokeWidth={1.4} />
                    <span>
                      Standart kargo · <span className="font-medium">Ücretsiz</span> · Tahmini teslimat {DELIVERY_TEXT}
                    </span>
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
                  <h2 className={sectionTitle}>Kredi / banka kartı</h2>
                  <CardBadges />
                </div>
                <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-neutral-600">
                  <Lock className="w-4 h-4" strokeWidth={1.4} />
                  Kart numaranız ve CVC kodunuz sunucuya gönderilmez.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-x-7 gap-y-6">
                  <Field
                    className="col-span-2"
                    label="Kart üzerindeki isim"
                    required
                    autoComplete="cc-name"
                    value={card.holder}
                    onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value }))}
                    error={cardErrors.holder}
                  />
                  <Field
                    className="col-span-2"
                    label="Kart numarası"
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                    error={cardErrors.number}
                    trailing={
                      digitsOnly(card.number).length >= 2 && (
                        <span lang="en" className="text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                          {BRAND_LABELS[brand]}
                        </span>
                      )
                    }
                  />
                  <Field
                    label="Son kullanma tarihi (AA/YY)"
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={card.expiry}
                    onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    error={cardErrors.expiry}
                  />
                  <Field
                    label="CVC"
                    required
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={card.cvc}
                    onChange={(e) => setCard((c) => ({ ...c, cvc: digitsOnly(e.target.value) }))}
                    error={cardErrors.cvc}
                  />
                </div>

                {error && (
                  <p role="alert" className="mt-6 text-[15px] text-red-600">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={sending || lines.length === 0} className={`mt-12 ${primaryButton}`}>
                  {sending ? 'İşleniyor…' : `Ödemeyi tamamla · ${formatPrice(total)}`}
                </button>
                <p className="mt-4 text-[13px] text-neutral-500">Demo mağaza: gerçek bir ödeme alınmaz, kartınızdan çekim yapılmaz.</p>
              </form>
            )}

            {/* 3. SİPARİŞ ONAYI */}
            {step === 3 && order && (
              <div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-[#c9a96e]">
                  <Check className="w-6 h-6" strokeWidth={2} />
                </span>
                <h2 className={`mt-8 ${sectionTitle}`}>Teşekkür ederiz, siparişiniz alındı.</h2>
                <p className="mt-4 text-[17px] leading-relaxed text-neutral-800">
                  {user ? (
                    <>
                      Siparişiniz <span className="font-medium">{user.email}</span> hesabınıza kaydedildi.
                    </>
                  ) : (
                    <>
                      Siparişinizi, sipariş numaranız ve <span className="font-medium">{guestEmail.trim()}</span> e-posta adresinizle
                      takip edebilirsiniz.
                    </>
                  )}
                </p>

                <div className="mt-10 rounded-md border border-neutral-200 p-6 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-[15px] text-neutral-600">Sipariş numarası</span>
                  <span className="text-[22px] font-semibold tracking-wide">{order.orderNumber}</span>
                </div>

                {/* Kargo ve teslimat bilgisi */}
                <section aria-labelledby="delivery-card-title" className="mt-6 rounded-md border border-neutral-200">
                  <div className="px-6 pt-6 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-neutral-900" strokeWidth={1.4} />
                    <h3 id="delivery-card-title" className="text-[18px] font-semibold text-neutral-900">
                      Kargo ve Teslimat Bilgisi
                    </h3>
                  </div>
                  <div className="p-6 grid sm:grid-cols-2 gap-6 text-[15px] leading-relaxed text-neutral-800">
                    <div>
                      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">Teslimat Adresi:</p>
                      <p className="mt-2 text-neutral-900 font-medium">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.phone}</p>
                      <p className="mt-1">{order.shippingAddress.address}</p>
                      <p>
                        {order.shippingAddress.postalCode} {order.shippingAddress.district} / {order.shippingAddress.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">Tahmini Teslimat:</p>
                      <p className="mt-2 text-neutral-900 font-medium">{DELIVERY_TEXT}</p>
                      {order.shipping && (
                        <p>
                          {formatDay(order.shipping.estimatedDelivery.from)} – {formatDay(order.shipping.estimatedDelivery.to)}
                        </p>
                      )}
                      <p className="mt-1">{order.shipping?.method ?? 'Standart kargo'} · Ücretsiz</p>
                    </div>
                  </div>
                  <div className="border-t border-neutral-200 px-6 py-4 text-[14px] text-neutral-600">
                    Ödeme: {BRAND_LABELS[order.payment.brand]} •••• {order.payment.last4} ·{' '}
                    {order.paymentStatus === 'paid' ? 'Ödendi' : order.paymentStatus}
                  </div>
                </section>

                <div className="mt-12 flex flex-wrap gap-4">
                  <button onClick={() => onTrackOrder(order)} className={primaryButton}>
                    Siparişimi takip et
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto h-16 px-10 rounded-md border border-neutral-400 hover:border-neutral-900 text-[16px] text-neutral-900 transition-colors cursor-pointer"
                  >
                    Alışverişe devam et
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: sipariş özeti */}
        <aside className="border-t lg:border-t-0 lg:border-l border-neutral-200 px-6 sm:px-12 lg:px-20 py-12 lg:pt-[120px]">
          <OrderSummary lines={lines} total={total} />
        </aside>
      </div>
    </div>
  );
}
