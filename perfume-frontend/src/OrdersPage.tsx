import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Package, Truck, X } from 'lucide-react';
import type { Order, TrackedOrder, User } from './types';
import { api, errorMessage } from './api';
import { BRAND_LABELS } from './card';
import OrderActions from './OrderActions';

interface OrdersPageProps {
  open: boolean;
  user: User | null;
  token: string | null;
  onClose: () => void;
  /** Logo: ana sayfaya döner */
  onGoHome: () => void;
  onLogin: () => void;
  /** Misafir siparişi verildikten sonra "Siparişimi takip et": sipariş doğrudan gösterilir */
  guestOrder?: TrackedOrder | null;
}

const formatPrice = (value: number) => `${value.toLocaleString('tr-TR')} TL`;
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

type AnyOrder = Order | TrackedOrder;
const hasPayment = (o: AnyOrder): o is Order => 'payment' in o;

// ---------------------------------------------------------------------------
// Durum çizelgesi: tamamlanan adımlar siyah, sıradaki gri
// ---------------------------------------------------------------------------

function StatusTimeline({ order }: { order: AnyOrder }) {
  const currentIndex = order.steps.findIndex((s) => s.key === order.status);
  return (
    <ol className="relative">
      {order.steps.map((step, i) => {
        const done = step.completedAt !== null;
        const current = i === currentIndex;
        const isLast = i === order.steps.length - 1;
        return (
          <li key={step.key} className="relative grid grid-cols-[2rem_1fr] gap-x-4">
            <div className="relative flex justify-center">
              {!isLast && (
                <span aria-hidden className={`absolute top-8 bottom-0 w-px ${i < currentIndex ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
              )}
              <span
                className={`relative mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                  done ? 'border-neutral-900 bg-neutral-900 text-[#c9a96e]' : 'border-neutral-300 bg-white'
                }`}
              >
                {done &&
                  (step.key === 'cancelled' ? (
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ))}
              </span>
            </div>
            <div className={isLast ? 'pb-1' : 'pb-7'}>
              <p className={`text-[16px] ${current ? 'font-semibold text-neutral-900' : done ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {step.label}
                {current && <span className="sr-only"> (güncel durum)</span>}
              </p>
              {step.completedAt && <p className="mt-0.5 text-[13px] text-neutral-500">{formatDateTime(step.completedAt)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Sipariş ayrıntısı: durum, kargo, adres, ürünler
// ---------------------------------------------------------------------------

function OrderDetail({
  order,
  onAdvance,
  advancing,
  actions,
}: {
  order: AnyOrder;
  onAdvance?: () => void;
  advancing?: boolean;
  /** İptal / iade işlemleri (yalnızca giriş yapmış kullanıcı) */
  actions?: React.ReactNode;
}) {
  const delivered = order.status === 'delivered';
  const cancelled = order.status === 'cancelled';
  const est = order.shipping.estimatedDelivery;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-neutral-500">Sipariş numarası</p>
          <p className="mt-1 text-[28px] font-semibold tracking-wide text-neutral-900">{order.orderNumber}</p>
          <p className="mt-1 text-[14px] text-neutral-500">{formatDate(order.createdAt)}</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium ${
            delivered ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900'
          }`}
        >
          {cancelled ? (
            <X className="w-4 h-4" strokeWidth={2} />
          ) : delivered ? (
            <Check className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Truck className="w-4 h-4" strokeWidth={1.5} />
          )}
          {order.statusLabel}
        </span>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <section className="rounded-md border border-neutral-200 p-6">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">Sipariş durumu</h3>
          <div className="mt-5">
            <StatusTimeline order={order} />
          </div>
          {onAdvance && !delivered && !cancelled && (
            <button
              onClick={onAdvance}
              disabled={advancing}
              className="mt-6 w-full h-11 rounded-md border border-dashed border-neutral-400 text-[13px] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"
              title="Gerçek bir kargo sistemi olmadığı için sunumda durumu elle ilerletmek içindir"
            >
              {advancing ? 'Güncelleniyor…' : 'Demo: durumu bir adım ilerlet'}
            </button>
          )}
        </section>

        <section className="rounded-md border border-neutral-200 p-6 text-[15px] leading-relaxed text-neutral-800">
          <h3 className="text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">Kargo ve teslimat</h3>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-[13px] text-neutral-500">Kargo takip numarası</dt>
              <dd className="mt-0.5 text-neutral-900 font-medium tracking-wide">
                {order.shipping.trackingNumber ?? 'Kargoya verildiğinde burada görünecek'}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-neutral-500">{delivered ? 'Teslim tarihi' : 'Tahmini teslimat'}</dt>
              <dd className="mt-0.5 text-neutral-900">
                {cancelled
                  ? 'Sipariş iptal edildi'
                  : delivered
                  ? formatDateTime(order.statusHistory.find((h) => h.status === 'delivered')!.at)
                  : `${formatDay(est.from)} – ${formatDay(est.to)} (${est.minBusinessDays}-${est.maxBusinessDays} iş günü)`}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-neutral-500">Teslimat adresi</dt>
              <dd className="mt-0.5">
                <span className="text-neutral-900">{order.shippingAddress.fullName}</span>
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.district} / {order.shippingAddress.city}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {actions}

      <section className="mt-8 rounded-md border border-neutral-200">
        <h3 className="px-6 pt-6 text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-500">Ürünler</h3>
        <ul className="px-6 divide-y divide-neutral-100">
          {order.items.map((item) => (
            <li key={`${item.perfumeId}-${item.size ?? ''}`} className="flex gap-4 py-4">
              <div className="w-16 h-20 shrink-0 bg-[#ece8e1] overflow-hidden">
                {item.image && <img loading="lazy" decoding="async" src={item.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0 text-[15px]">
                <p className="text-neutral-900">{item.name}</p>
                <p className="text-[13px] text-neutral-500">
                  {[item.brand, item.size, `${item.quantity} adet`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-[15px] tabular-nums">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-200 px-6 py-4 flex flex-wrap justify-between gap-2 text-[15px]">
          <span className="text-neutral-600">
            {hasPayment(order)
              ? `${BRAND_LABELS[order.payment.brand]} •••• ${order.payment.last4}${order.paymentStatus === 'refunded' ? ' · İade edildi' : ''}`
              : order.paymentStatus === 'refunded'
                ? 'İade edildi'
                : 'Ödendi'}
          </span>
          <span className="font-semibold tabular-nums">Toplam {formatPrice(order.totalAmount)}</span>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Giriş yapmadan takip formu: GET /api/orders/track
// ---------------------------------------------------------------------------

function TrackForm({
  defaultEmail,
  defaultOrderNumber = '',
  onFound,
}: {
  defaultEmail: string;
  defaultOrderNumber?: string;
  onFound: (o: TrackedOrder) => void;
}) {
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      onFound(await api.trackOrder(orderNumber.trim(), email.trim()));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const input =
    'w-full h-14 rounded-md border border-neutral-400 focus:border-neutral-900 bg-white px-4 text-[16px] focus:outline-none';
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-start">
      <label className="block">
        <span className="sr-only">Sipariş numarası</span>
        <input required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Sipariş numarası (ör. ORD-8392)" className={input} />
      </label>
      <label className="block">
        <span className="sr-only">E-posta</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Siparişi verdiğiniz e-posta" className={input} />
      </label>
      <button
        type="submit"
        disabled={sending}
        className="h-14 px-8 rounded-md bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-[15px] cursor-pointer"
      >
        {sending ? 'Aranıyor…' : 'Sorgula'}
      </button>
      {error && (
        <p role="alert" className="sm:col-span-3 text-[14px] text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sayfa: giriş yapılmışsa "Siparişlerim" listesi + ayrıntı; her durumda takip formu
// ---------------------------------------------------------------------------

export default function OrdersPage({ open, user, token, onClose, onGoHome, onLogin, guestOrder }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  // GET /api/orders/my-orders
  useEffect(() => {
    if (!open || !token) return;
    const controller = new AbortController();
    api
      .getMyOrders(token, controller.signal)
      .then((list) => {
        setOrders(list);
        setSelected((cur) => cur ?? list[0]?.orderNumber ?? null);
      })
      .catch((err) => !controller.signal.aborted && setError(errorMessage(err)));
    return () => controller.abort();
  }, [open, token]);

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

  const current = orders?.find((o) => o.orderNumber === selected) ?? null;

  const advance = async () => {
    if (!token || !current) return;
    setAdvancing(true);
    try {
      const updated = await api.advanceOrder(token, current.orderNumber);
      setOrders((list) => list?.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)) ?? list);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="orders-title" className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 h-[72px] border-b border-neutral-200 bg-white px-4 sm:px-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button onClick={onClose} aria-label="Alışverişe dön" className="justify-self-start -m-2 p-2 sm:m-0 sm:p-0 inline-flex items-center gap-2 text-[14px] text-neutral-700 hover:text-neutral-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Alışverişe dön</span>
        </button>
        <button
          onClick={onGoHome}
          aria-label="Ana sayfaya dön"
          className="font-display text-[24px] sm:text-[30px] leading-none whitespace-nowrap hover:opacity-70 transition-opacity cursor-pointer"
        >
          Aura Perfumé
        </button>
        <span aria-hidden />
      </div>

      <div className="bg-[#f7f7f7] px-6 sm:px-12 lg:px-[8%] pt-10 pb-10">
        <h1 id="orders-title" className="text-[40px] sm:text-[46px] font-normal leading-tight text-neutral-900">
          {user ? 'Siparişlerim' : 'Sipariş takibi'}
        </h1>
        <p className="mt-3 text-[16px] text-neutral-600">
          {user ? 'Siparişlerinizin durumunu ve kargo bilgilerini buradan takip edebilirsiniz.' : 'Sipariş numaranız ve e-posta adresinizle siparişinizi sorgulayın.'}
        </p>
      </div>

      <div className="px-6 sm:px-12 lg:px-[8%] py-12">
        {!user && (
          <div className="max-w-4xl">
            <TrackForm
              key={guestOrder?.orderNumber ?? 'bos'}
              defaultEmail={guestOrder?.email ?? ''}
              defaultOrderNumber={guestOrder?.orderNumber}
              onFound={setTracked}
            />
            <p className="mt-6 text-[14px] text-neutral-500">
              Tüm siparişlerinizi görmek için{' '}
              <button onClick={onLogin} className="text-neutral-900 underline underline-offset-4 cursor-pointer">
                giriş yapın
              </button>
              .
            </p>
            {(tracked ?? guestOrder) && (
              <div className="mt-12">
                <OrderDetail order={(tracked ?? guestOrder)!} />
              </div>
            )}
          </div>
        )}

        {user && (
          <>
            {error && (
              <p role="alert" className="mb-6 text-[14px] text-red-600">
                {error}
              </p>
            )}
            {!orders && !error && <p className="text-[15px] text-neutral-500">Siparişler yükleniyor…</p>}
            {orders && orders.length === 0 && (
              <div className="rounded-md border border-dashed border-neutral-300 py-16 text-center">
                <Package className="mx-auto w-9 h-9 text-neutral-300" strokeWidth={1.2} />
                <p className="mt-4 text-[18px] text-neutral-800">Henüz siparişiniz yok.</p>
                <button onClick={onClose} className="mt-6 h-12 px-8 rounded-md bg-neutral-900 text-white text-[15px] cursor-pointer">
                  Alışverişe başla
                </button>
              </div>
            )}
            {orders && orders.length > 0 && (
              <div className="grid lg:grid-cols-[320px_1fr] gap-10">
                <ul className="space-y-3" aria-label="Siparişler">
                  {orders.map((o) => (
                    <li key={o.orderNumber}>
                      <button
                        onClick={() => setSelected(o.orderNumber)}
                        aria-current={o.orderNumber === selected}
                        className={`w-full text-left rounded-md border p-4 transition-colors cursor-pointer ${
                          o.orderNumber === selected ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold tracking-wide">{o.orderNumber}</span>
                          <span className="tabular-nums">{formatPrice(o.totalAmount)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-neutral-500">
                          {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} ürün
                        </p>
                        <p className="mt-2 text-[13px] font-medium text-neutral-900">{o.statusLabel}</p>
                      </button>
                    </li>
                  ))}
                </ul>
                {current && token && (
                  <OrderDetail
                    order={current}
                    onAdvance={advance}
                    advancing={advancing}
                    actions={
                      <OrderActions
                        key={current.orderNumber}
                        order={current}
                        token={token}
                        onUpdated={(updated) =>
                          setOrders((list) => list?.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)) ?? list)
                        }
                      />
                    }
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
