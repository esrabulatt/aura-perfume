import { useEffect, useState } from 'react';
import { Copy, RotateCcw, XCircle } from 'lucide-react';
import type { Order, ReturnRequest } from './types';
import { api, errorMessage } from './api';

const formatPrice = (value: number) => `${value.toLocaleString('tr-TR')} TL`;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const button =
  'h-12 px-6 rounded-md text-[15px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const primary = `${button} bg-neutral-900 hover:bg-neutral-700 text-white`;
const secondary = `${button} border border-neutral-400 hover:border-neutral-900 text-neutral-900`;

// ---------------------------------------------------------------------------
// İade kodu kartı: kod + kopyala + sonraki adımlar
// ---------------------------------------------------------------------------

interface ReturnCodeCardProps {
  request: ReturnRequest;
  orderNumber: string;
  token: string;
  onUpdated: (o: Order) => void;
}

function ReturnCodeCard({ request, orderNumber, token, onUpdated }: ReturnCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelled = request.status === 'cancelled';

  // POST /api/orders/:orderNumber/returns/:code/cancel
  const cancelReturn = async () => {
    setSending(true);
    setError(null);
    try {
      onUpdated(await api.cancelReturn(token, orderNumber, request.code));
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  // İptal edilmiş talep: sade, soluk bir özet
  if (cancelled) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-5 text-[14px] text-neutral-500">
        <span className="font-medium tracking-[0.08em] line-through">{request.code}</span> · {request.statusLabel}
        {request.cancelledAt && ` · ${formatDate(request.cancelledAt)}`}
        <span className="block mt-1">Bu talepteki ürünler için yeniden iade talebi oluşturabilirsiniz.</span>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // pano izni yoksa kullanıcı kodu elle seçebilir
    }
  };
  return (
    <div className="rounded-md border border-neutral-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-neutral-500">İade kodu</p>
          <p className="mt-1 text-[26px] font-semibold tracking-[0.12em] text-neutral-900 select-all">{request.code}</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            {request.statusLabel} · {formatDate(request.createdAt)}
          </p>
        </div>
        <button onClick={copy} className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-neutral-300 hover:border-neutral-900 text-[14px] cursor-pointer">
          <Copy className="w-4 h-4" strokeWidth={1.5} />
          {copied ? 'Kopyalandı' : 'Kodu kopyala'}
        </button>
      </div>
      <ul className="mt-4 text-[14px] text-neutral-700 space-y-1">
        {request.items.map((i) => (
          <li key={`${i.perfumeId}-${i.size ?? ''}`} className="flex justify-between gap-3">
            <span>
              {i.name} {i.size ? `· ${i.size}` : ''} · {i.quantity} adet
            </span>
            <span className="tabular-nums">{formatPrice(i.refundAmount)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] text-neutral-700">
        Neden: {request.reasonLabel} · İade tutarı: <span className="font-medium">{formatPrice(request.refundAmount)}</span>
      </p>
      <ol className="mt-5 border-t border-neutral-200 pt-4 list-decimal pl-5 text-[14px] leading-relaxed text-neutral-600 space-y-1">
        <li>Ürünleri orijinal kutusunda, açılmamış şekilde paketleyin.</li>
        <li>İade kodunu paketin üzerine yazın veya içine bir not olarak koyun.</li>
        <li>Paketi anlaşmalı kargo şubesine ücretsiz olarak teslim edin.</li>
        <li>Ürünler bize ulaşıp kontrol edildikten sonra tutar kartınıza iade edilir.</li>
      </ol>

      {/* İade talebini iptal et (ürünü göndermekten vazgeçildiyse) */}
      <div className="mt-5 border-t border-neutral-200 pt-4">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-[14px] text-neutral-600 underline underline-offset-4 hover:text-neutral-900 cursor-pointer"
          >
            İade talebini iptal et
          </button>
        ) : (
          <div>
            <p className="text-[14px] text-neutral-800">
              {request.code} kodlu iade talebini iptal etmek istediğinize emin misiniz? İade kodu geçersiz olur.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button onClick={cancelReturn} disabled={sending} className={`${primary} h-10 px-5 text-[14px]`}>
                {sending ? 'İptal ediliyor…' : 'Evet, iptal et'}
              </button>
              <button onClick={() => setConfirming(false)} disabled={sending} className={`${secondary} h-10 px-5 text-[14px]`}>
                Vazgeç
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-[14px] text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// İptal: kargoya verilmeden önce
// ---------------------------------------------------------------------------

function CancelPanel({ order, token, onUpdated }: { order: Order; token: string; onUpdated: (o: Order) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      onUpdated(await api.cancelOrder(token, order.orderNumber, reason));
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${secondary} inline-flex items-center gap-2`}>
        <XCircle className="w-4 h-4" strokeWidth={1.5} />
        Siparişi iptal et
      </button>
    );
  }

  return (
    <div className="rounded-md border border-neutral-300 p-6">
      <h4 className="text-[17px] font-semibold text-neutral-900">Siparişi iptal etmek istediğinize emin misiniz?</h4>
      <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
        Siparişiniz henüz kargoya verilmediği için iptal edebilirsiniz. {formatPrice(order.totalAmount)} tutarındaki ödemeniz
        kartınıza iade edilir. Bu işlem geri alınamaz.
      </p>
      <label className="mt-4 block">
        <span className="text-[13px] text-neutral-500">İptal nedeni (isteğe bağlı)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          rows={2}
          className="mt-1 w-full rounded-md border border-neutral-300 focus:border-neutral-900 p-3 text-[15px] focus:outline-none resize-none"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-[14px] text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={submit} disabled={sending} className={primary}>
          {sending ? 'İptal ediliyor…' : 'Evet, iptal et'}
        </button>
        <button onClick={() => setOpen(false)} disabled={sending} className={secondary}>
          Vazgeç
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// İade talebi: teslimattan sonra 14 gün içinde; ürün + adet + neden seçilir
// ---------------------------------------------------------------------------

function ReturnPanel({ order, token, onUpdated }: { order: Order; token: string; onUpdated: (o: Order) => void }) {
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<{ value: string; label: string }[]>([]);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  // Kalem anahtarı -> iade adedi (0 = seçili değil)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && reasons.length === 0) api.getReturnReasons().then(setReasons).catch(() => {});
  }, [open, reasons.length]);

  const keyOf = (i: { perfumeId: number; size: string | null }) => `${i.perfumeId}|${i.size ?? ''}`;
  const lineOf = (i: { perfumeId: number; size: string | null }) =>
    order.items.find((l) => l.perfumeId === i.perfumeId && l.size === i.size)!;

  const startReturn = () => {
    setQuantities(Object.fromEntries(order.returnableItems.map((i) => [keyOf(i), i.quantity])));
    setOpen(true);
  };

  const selected = order.returnableItems
    .map((i) => ({ perfumeId: i.perfumeId, size: i.size, quantity: quantities[keyOf(i)] ?? 0 }))
    .filter((i) => i.quantity > 0);
  const refund = selected.reduce((n, i) => n + lineOf(i).unitPrice * i.quantity, 0);

  const submit = async () => {
    if (!reason) return setError('Lütfen bir iade nedeni seçin.');
    if (selected.length === 0) return setError('Lütfen iade edilecek en az bir ürün seçin.');
    setSending(true);
    setError(null);
    try {
      const result = await api.createReturn(token, order.orderNumber, { reason, note: note || undefined, items: selected });
      onUpdated(result.order);
      setOpen(false);
      setReason('');
      setNote('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button onClick={startReturn} className={`${secondary} inline-flex items-center gap-2`}>
        <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
        İade talebi oluştur
      </button>
    );
  }

  return (
    <div className="rounded-md border border-neutral-300 p-6">
      <h4 className="text-[17px] font-semibold text-neutral-900">İade talebi</h4>
      {order.returnDeadline && (
        <p className="mt-1 text-[14px] text-neutral-600">Son iade tarihi: {formatDate(order.returnDeadline)}</p>
      )}

      <fieldset className="mt-5">
        <legend className="text-[13px] text-neutral-500">İade edilecek ürünler</legend>
        <ul className="mt-2 divide-y divide-neutral-100 border-y border-neutral-100">
          {order.returnableItems.map((item) => {
            const line = lineOf(item);
            const k = keyOf(item);
            const qty = quantities[k] ?? 0;
            return (
              <li key={k} className="flex flex-wrap items-center gap-4 py-3">
                <label className="flex flex-1 min-w-[200px] items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qty > 0}
                    onChange={(e) => setQuantities((q) => ({ ...q, [k]: e.target.checked ? item.quantity : 0 }))}
                    className="h-5 w-5 accent-neutral-900"
                  />
                  <span className="text-[15px] text-neutral-900">
                    {line.name}
                    {line.size ? ` · ${line.size}` : ''}
                  </span>
                </label>
                {item.quantity > 1 && (
                  <select
                    aria-label={`${line.name} iade adedi`}
                    value={qty}
                    onChange={(e) => setQuantities((q) => ({ ...q, [k]: Number(e.target.value) }))}
                    className="h-10 rounded-md border border-neutral-300 px-3 text-[14px]"
                  >
                    {Array.from({ length: item.quantity + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n} adet
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[14px] tabular-nums text-neutral-700">{formatPrice(line.unitPrice * qty)}</span>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-[13px] text-neutral-500">İade nedeni</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full h-12 rounded-md border border-neutral-300 focus:border-neutral-900 px-3 text-[15px] focus:outline-none"
        >
          <option value="" disabled>
            Bir neden seçin
          </option>
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block">
        <span className="text-[13px] text-neutral-500">Açıklama (isteğe bağlı)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded-md border border-neutral-300 focus:border-neutral-900 p-3 text-[15px] focus:outline-none resize-none"
        />
      </label>

      <p className="mt-4 text-[15px] text-neutral-900">
        İade edilecek tutar: <span className="font-semibold tabular-nums">{formatPrice(refund)}</span>
      </p>
      {error && (
        <p role="alert" className="mt-3 text-[14px] text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={submit} disabled={sending} className={primary}>
          {sending ? 'Oluşturuluyor…' : 'İade kodu oluştur'}
        </button>
        <button onClick={() => setOpen(false)} disabled={sending} className={secondary}>
          Vazgeç
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sipariş ayrıntısındaki işlemler bölümü
// ---------------------------------------------------------------------------

interface OrderActionsProps {
  order: Order;
  token: string;
  onUpdated: (order: Order) => void;
}

export default function OrderActions({ order, token, onUpdated }: OrderActionsProps) {
  const hasActions = order.cancellable || order.returnable;
  if (!hasActions && order.returns.length === 0 && !order.cancellation) return null;

  return (
    <section className="mt-8 space-y-5">
      {order.cancellation && (
        <div className="rounded-md bg-neutral-100 p-6 text-[15px] leading-relaxed text-neutral-800">
          <p className="font-semibold text-neutral-900">Bu sipariş {formatDate(order.cancellation.at)} tarihinde iptal edildi.</p>
          <p>
            {formatPrice(order.cancellation.refundAmount)} tutarındaki ödemeniz kartınıza iade edilecektir.
            {order.cancellation.reason && ` İptal nedeni: ${order.cancellation.reason}`}
          </p>
        </div>
      )}

      {order.returns.map((r) => (
        <ReturnCodeCard key={`${r.code}-${r.status}`} request={r} orderNumber={order.orderNumber} token={token} onUpdated={onUpdated} />
      ))}

      {order.cancellable && <CancelPanel order={order} token={token} onUpdated={onUpdated} />}
      {order.returnable && <ReturnPanel key={order.returns.length} order={order} token={token} onUpdated={onUpdated} />}
      {order.status === 'delivered' && !order.returnable && order.returnableItems.length > 0 && (
        <p className="text-[14px] text-neutral-500">Bu sipariş için iade süresi (14 gün) dolmuştur.</p>
      )}
    </section>
  );
}
