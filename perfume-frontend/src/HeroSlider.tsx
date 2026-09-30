import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { NavTheme } from './types';

// Otomatik geçiş yok: görseller sayfa kaydırıldıkça sırayla değişir (sticky sahne);
// fare tekerleğinde her hareket tek bir görsel ilerletir

interface HeroSliderProps {
  onExploreCollection: () => void;
  onStartQuiz: () => void;
  onOpenFinder: () => void;
  /** Menü rengi: aktif görselin tonu; hero ekrandan çıkınca null */
  onThemeChange?: (theme: NavTheme | null) => void;
}

interface SlideProps {
  active: boolean;
  onAction: () => void;
}

// Aktif slaytta metin aşağıdan yumuşakça belirir
const reveal = (active: boolean, delay = '') =>
  `transition-all duration-700 ease-out ${delay} ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

// 1) Bölünmüş düzen: solda bej metin paneli, sağda fotoğraf
function RepertoireSlide({ active, onAction }: SlideProps) {
  return (
    <div className="h-full grid md:grid-cols-2 bg-[#c9bfa7] text-[#2f2d29]">
      <div className="relative order-2 md:order-1 flex items-center px-6 sm:px-12 lg:px-16 py-10">
        <span className="hidden lg:block absolute left-12 top-[22%] font-display text-4xl tracking-tight">
          Aura<span className="text-base align-top">.</span>
        </span>
        <div className="max-w-md lg:ml-[28%] lg:mr-6">
          <p className={`text-sm font-medium ${reveal(active)}`}>Eau de Parfum</p>
          <h2 className={`mt-4 text-4xl sm:text-5xl font-normal tracking-tight ${reveal(active, 'delay-100')}`}>
            Zengin bir repertuvar
          </h2>
          <p className={`mt-6 text-base sm:text-lg leading-relaxed text-[#3d3a35] ${reveal(active, 'delay-200')}`}>
            Odunsu, oryantal, çiçeksi ve ferah: koleksiyonumuz bu sınıfları incelikle ve kalıpların dışına çıkarak
            yeniden yorumluyor.
          </p>
          <button
            onClick={onAction}
            tabIndex={active ? 0 : -1}
            className={`mt-10 w-full sm:w-80 flex items-center justify-between border border-[#2f2d29]/30 hover:border-[#2f2d29] px-6 py-5 text-base font-medium transition-colors cursor-pointer ${reveal(active, 'delay-300')}`}
          >
            Kokuları Keşfet
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="order-1 md:order-2 relative min-h-56 overflow-hidden">
        <img
          src="/images/hero/koleksiyon-dolap.jpg"
          fetchPriority="high"
          alt="Ahşap bir dolabın rafında duran parfüm şişeleri"
          className={`absolute inset-0 h-full w-full object-cover object-[60%_center] transition-transform duration-[7000ms] ease-out ${
            active ? 'scale-105' : 'scale-100'
          }`}
        />
      </div>
    </div>
  );
}

// 2) Siyah zemin, sağda şişe; solda büyük beyaz serif başlık
function NightSlide({ active, onAction }: SlideProps) {
  return (
    <div className="relative h-full bg-[#07090c] text-white overflow-hidden">
      <img
        src="/images/hero/gece-siyah.jpg"
        alt="Siyah zemin üzerinde taşların arasında duran siyah parfüm şişesi"
        className="absolute inset-y-0 right-0 h-full w-full md:w-3/5 object-cover object-center opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#07090c] via-[#07090c]/80 md:via-[#07090c]/70 to-transparent" />

      <div className="relative h-full flex items-end md:items-center px-6 sm:px-12 lg:px-16 pb-24 md:pb-0">
        <div className="max-w-xl">
          <h2 className={`font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] ${reveal(active)}`}>
            <span className="font-semibold">Seni Anlatan</span>
            <br />
            Kokuları Keşfet
          </h2>
          <p className={`mt-6 text-base sm:text-lg text-white/75 max-w-sm leading-snug ${reveal(active, 'delay-150')}`}>
            Ruh haline, kimliğine ve yaşam tarzına göre seçilmiş parfümler.
          </p>
          <button
            onClick={onAction}
            tabIndex={active ? 0 : -1}
            className={`mt-10 rounded-full bg-[#2a2d31] hover:bg-[#3a3e44] px-10 py-4 font-display text-xl transition-colors cursor-pointer ${reveal(active, 'delay-300')}`}
          >
            Koku Testini Çöz
          </button>
        </div>
      </div>
    </div>
  );
}

// 3) Sıcak bej tonlar, ince serif başlık, altta üç anahtar kelime
function QuietLuxurySlide({ active, onAction }: SlideProps) {
  return (
    <div className="relative h-full bg-[#e7dccf] text-[#1d1a17] overflow-hidden">
      <img
        src="/images/hero/saten-chanel.jpg"
        alt="Saten kumaş üzerinde duran altın renkli parfüm şişesi"
        className="absolute inset-y-0 right-0 h-full w-full md:w-1/2 object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#e7dccf] via-[#e7dccf]/85 md:via-[#e7dccf]/60 to-transparent" />

      <div className="relative h-full flex flex-col justify-end md:justify-center px-6 sm:px-12 lg:px-16 pb-24 md:pb-0">
        <div className="max-w-lg">
          <p className={`text-xs tracking-[0.35em] uppercase text-[#9a8570] ${reveal(active)}`}>Aura Perfumé</p>
          <h2
            className={`mt-5 font-display font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.02] ${reveal(active, 'delay-100')}`}
          >
            Sessiz Lüksün
            <br />
            Sanatı
          </h2>
          <p className={`mt-6 font-display text-xl leading-relaxed text-[#4a423a] ${reveal(active, 'delay-200')}`}>
            Özenle seçilmiş, zamansız kokular;
            <br className="hidden sm:block" /> hissedilmek için tasarlandı, duyurulmak için değil.
          </p>
          <button
            onClick={onAction}
            tabIndex={active ? 0 : -1}
            className={`mt-10 bg-[#141210] hover:bg-[#2d2925] text-white px-10 py-4 font-display text-lg transition-colors cursor-pointer ${reveal(active, 'delay-300')}`}
          >
            Sana Uygun Kokuyu Bul
          </button>
        </div>

        <div
          className={`hidden md:flex absolute bottom-24 left-12 lg:left-16 gap-16 text-[11px] tracking-[0.3em] text-[#6b5f53] ${reveal(active, 'delay-500')}`}
        >
          <span>ZARAFET</span>
          <span>NİYET</span>
          <span>ÖZ</span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlider({ onExploreCollection, onStartQuiz, onOpenFinder, onThemeChange }: HeroSliderProps) {
  // navBg: menünün o görseldeyken alacağı renk (görselin baskın tonu)
  const slides = [
    { key: 'repertuvar', label: 'Zengin bir repertuvar', Component: RepertoireSlide, onAction: onExploreCollection, dark: false, navBg: '#c9bfa7' },
    { key: 'gece', label: 'Seni anlatan kokular', Component: NightSlide, onAction: onStartQuiz, dark: true, navBg: '#07090c' },
    { key: 'sessiz-luks', label: 'Sessiz lüksün sanatı', Component: QuietLuxurySlide, onAction: onOpenFinder, dark: false, navBg: '#e7dccf' },
  ];
  const count = slides.length;

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Sahne (ekranda sabit kalan görsel alanı) yüksekliği ve menünün altından başlaması için üst boşluk
  const [layout, setLayout] = useState({ stage: 0, top: 72 });
  // 0 → 1: bölüm boyunca ne kadar kaydırıldığı
  const [progress, setProgress] = useState(0);
  // Hero hâlâ menünün altında görünüyor mu (menü rengini ancak o zaman görsele uydururuz)
  const [inView, setInView] = useState(true);

  // Ölçüler: her görsel bir sahne yüksekliği kadar kaydırmaya karşılık gelir
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      setLayout({ stage: stageRef.current?.offsetHeight ?? 0, top: header?.offsetHeight ?? 72 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Kaydırma ilerlemesi: her kaydırma olayında hesaplanır (hesap çok hafif; React aynı değeri tekrar çizmez)
  useEffect(() => {
    const update = () => {
      const section = sectionRef.current;
      if (!section || !layout.stage) return;
      const scrollable = section.offsetHeight - layout.stage;
      const rect = section.getBoundingClientRect();
      const passed = layout.top - rect.top;
      setProgress(Math.min(1, Math.max(0, passed / scrollable)));
      setInView(rect.bottom > layout.top + 1);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [layout]);

  // Tekerlek adımları: hero ekrandayken her kaydırma hareketi tam bir görsel ilerletir/geriletir.
  // Trackpad'in uzun süren "kayma" olayları tek adım sayılır; son görselden sonra sayfa normal akar.
  useEffect(() => {
    const STEP_LOCK_MS = 900; // bir geçişten sonra yeni adım için en az bekleme
    const GESTURE_GAP_MS = 180; // bu kadar sessizlikten sonra gelen tekerlek olayı yeni bir hareket sayılır
    let lastStep = -Infinity; // 0 olursa sayfa açılışından sonraki ilk ~0,9 sn'deki hareket yanlışlıkla kilitli sayılır
    let lastWheel = -Infinity;
    let gestureStepped = false; // bu hareket zaten bir adım attırdı mı?

    const onWheel = (e: WheelEvent) => {
      const section = sectionRef.current;
      if (!section || !layout.stage || Math.abs(e.deltaY) < 2 || e.ctrlKey) return;

      const now = performance.now();
      const newGesture = now - lastWheel > GESTURE_GAP_MS;
      lastWheel = now;
      if (newGesture) gestureStepped = false;

      const start = section.getBoundingClientRect().top + window.scrollY - layout.top;
      const scrollable = section.offsetHeight - layout.stage;
      const segment = scrollable / count;
      const y = window.scrollY;
      if (y < start - 4 || y > start + scrollable - 4) return; // hero sabitlenmiş değilse karışma

      // Geçiş sürerken veya adımı atan hareketin devamı (trackpad kayması) geliyorsa: yut, hiçbir şey yapma.
      // Böylece 3. görsele geçen hareket sayfayı ürünlere kadar kaydırmaz.
      if (now - lastStep < STEP_LOCK_MS || gestureStepped) {
        e.preventDefault();
        return;
      }

      const current = Math.min(count - 1, Math.max(0, Math.floor((y - start) / segment)));
      const dir = e.deltaY > 0 ? 1 : -1;
      if ((dir > 0 && current === count - 1) || (dir < 0 && current === 0)) return; // uçlarda normal kaydırma

      e.preventDefault();
      gestureStepped = true;
      lastStep = now;
      const target = current + dir;
      // Hedef görselin diliminin ortasına git (ilk görsel için bölümün başı)
      const top = start + (target === 0 ? 0 : segment * (target + 0.5));
      window.scrollTo({ top, behavior: 'smooth' });
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [layout, count]);

  const index = Math.min(count - 1, Math.floor(progress * count));
  // Aktif görselin kendi dilimindeki ilerlemesi (göstergedeki dolum çizgisi için)
  const local = Math.min(1, progress * count - index);
  const dark = slides[index].dark;
  const navBg = slides[index].navBg;

  // Menüye aktif görselin rengini bildir; hero bitince / sayfadan çıkınca varsayılana dön
  useEffect(() => {
    onThemeChange?.(inView ? { background: navBg, dark } : null);
  }, [onThemeChange, inView, navBg, dark]);
  useEffect(() => () => onThemeChange?.(null), [onThemeChange]);

  // Göstergeye tıklanınca ilgili görselin kaydırma konumuna yumuşakça gidilir
  const scrollToSlide = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY - layout.top;
    const segment = (section.offsetHeight - layout.stage) / count;
    window.scrollTo({ top: sectionTop + (i === 0 ? 0 : segment * (i + 0.5)), behavior: 'smooth' });
  };

  const ink = dark ? 'text-white' : 'text-neutral-900';
  const track = dark ? 'bg-white/25' : 'bg-neutral-900/15';
  const fill = dark ? 'bg-white' : 'bg-neutral-900';

  return (
    <section
      ref={sectionRef}
      aria-label="Öne çıkanlar"
      // Toplam yükseklik = görsel sayısı × sahne yüksekliği; ölçülene kadar yaklaşık değer
      style={{ height: layout.stage ? layout.stage * count : `${count * 100}svh` }}
      className="relative bg-[#07090c]"
    >
      <div
        ref={stageRef}
        style={{ top: layout.top }}
        className="sticky h-[max(560px,calc(100svh-72px))] overflow-hidden"
      >
        {slides.map(({ key, label, Component, onAction }, i) => (
          <div
            key={key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}: ${label}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
              i === index ? 'opacity-100 z-10' : 'opacity-0'
            }`}
          >
            <Component active={i === index} onAction={onAction} />
          </div>
        ))}

        {/* Sağda dikey gösterge: 01 / 03 ve her görsel için kaydırdıkça dolan ince çizgi */}
        <nav
          aria-label="Görseller"
          className={`absolute z-20 right-6 sm:right-10 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center gap-4 ${ink} transition-colors duration-700`}
        >
          <span className="text-[11px] font-medium tracking-[0.25em] tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <div className="flex flex-col gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                onClick={() => scrollToSlide(i)}
                aria-label={`${i + 1}. görsele git: ${slide.label}`}
                aria-current={i === index}
                className="group px-2 py-0.5 cursor-pointer"
              >
                <span className={`relative block w-0.5 h-10 overflow-hidden transition-colors duration-700 ${track}`}>
                  <span
                    className={`absolute inset-x-0 top-0 transition-colors duration-700 ${fill}`}
                    style={{ height: `${i < index ? 100 : i === index ? Math.max(8, local * 100) : 0}%` }}
                  />
                </span>
              </button>
            ))}
          </div>
          <span className="text-[11px] font-medium tracking-[0.25em] tabular-nums opacity-50">
            {String(count).padStart(2, '0')}
          </span>
        </nav>

        {/* Alt orta: ilk görselde kaydırma ipucu, son görselde koleksiyona geçiş ipucu */}
        <div
          className={`absolute z-20 bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] ${ink} transition-all duration-700`}
        >
          <span>{index === count - 1 ? 'Koleksiyona devam edin' : 'Kaydırarak keşfedin'}</span>
          <ChevronDown className="w-4 h-4 scroll-hint" strokeWidth={1.5} aria-hidden />
        </div>
      </div>
    </section>
  );
}
