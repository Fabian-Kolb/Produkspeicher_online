import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, ShoppingCart, ChevronDown, Cloud, Sparkles, Smartphone, TrendingUp, Tag, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { triggerHaptic } from '../utils/haptics';
import { LegalDisclaimerModal } from '../components/auth/LegalDisclaimerModal';
import logoWhite from '../assets/logo/logo_white.png';
import dashboardPreviewImg from '../assets/landing/dashboard-preview.png';
import './LoginView.css';

/* ── product data ── */
const LEFT_PRODUCTS = [
  { src: '/images/products/headphones.png', name: 'Sony WH-1000XM5', shop: 'MediaMarkt', price: 379.99, finalPrice: 299.99, discount: 21 },
  { src: '/images/products/smartwatch.png', name: 'Galaxy Watch Ultra', shop: 'Samsung Store', price: 699.00, finalPrice: 699.00, discount: 0 },
  { src: '/images/products/speaker.png', name: 'HomePod Mini', shop: 'Apple Store', price: 109.00, finalPrice: 89.00, discount: 18 },
  { src: '/images/products/camera.png', name: 'Sony Alpha 7 IV', shop: 'Amazon', price: 2499.00, finalPrice: 2199.00, discount: 12 },
];

const RIGHT_PRODUCTS = [
  { src: '/images/products/sneakers.png', name: 'Nike Air Max 90', shop: 'Nike Store', price: 149.99, finalPrice: 119.99, discount: 20 },
  { src: '/images/products/backpack.png', name: 'Peak Design 30L', shop: 'Peak Design', price: 299.95, finalPrice: 299.95, discount: 0 },
  { src: '/images/products/sunglasses.png', name: 'Ray-Ban Aviator', shop: 'Ray-Ban', price: 179.00, finalPrice: 143.20, discount: 20 },
  { src: '/images/products/keyboard.png', name: 'Razer Huntsman V3', shop: 'Saturn', price: 249.99, finalPrice: 199.99, discount: 20 },
];

/* All products combined for mobile single column */
const ALL_PRODUCTS = [...LEFT_PRODUCTS, ...RIGHT_PRODUCTS];

/* ── types ── */
interface LoginProductData {
  src: string; name: string; shop: string;
  price: number; finalPrice: number; discount: number;
}

interface CardStyle {
  rotate: number; offsetX: number; opacity: number; brightness: number;
}

type AnimPhase = 'idle' | 'cart-drive' | 'loading' | 'success' | 'error';

/* ── scattered rain-shower style presets ── */
const LEFT_CARD_STYLES: CardStyle[] = [
  { rotate:  3, offsetX:  35, opacity: 0.95, brightness: 1.0  },
  { rotate: -2, offsetX: -45, opacity: 0.45, brightness: 0.7  },
  { rotate:  4, offsetX:  60, opacity: 0.9,  brightness: 0.95 },
  { rotate: -3, offsetX: -20, opacity: 0.6,  brightness: 0.75 },
  { rotate:  2, offsetX:  45, opacity: 0.85, brightness: 0.9  },
  { rotate: -3, offsetX: -60, opacity: 0.35, brightness: 0.6  },
  { rotate:  3, offsetX:  20, opacity: 0.8,  brightness: 0.85 },
  { rotate: -2, offsetX: -35, opacity: 0.5,  brightness: 0.7  },
];

const RIGHT_CARD_STYLES: CardStyle[] = [
  { rotate: -3, offsetX:  45, opacity: 0.95, brightness: 1.0  },
  { rotate:  3, offsetX: -35, opacity: 0.5,  brightness: 0.7  },
  { rotate: -2, offsetX:  60, opacity: 0.9,  brightness: 0.95 },
  { rotate:  3, offsetX: -55, opacity: 0.35, brightness: 0.6  },
  { rotate: -3, offsetX:  25, opacity: 0.85, brightness: 0.9  },
  { rotate:  2, offsetX: -20, opacity: 0.65, brightness: 0.8  },
  { rotate: -3, offsetX:  55, opacity: 0.9,  brightness: 0.95 },
  { rotate:  3, offsetX: -40, opacity: 0.45, brightness: 0.65 },
];

const MOBILE_CARD_STYLES: CardStyle[] = [
  { rotate:  2, offsetX:  25, opacity: 0.55, brightness: 0.75 },
  { rotate: -2, offsetX: -30, opacity: 0.45, brightness: 0.65 },
  { rotate:  3, offsetX:  35, opacity: 0.5,  brightness: 0.7  },
  { rotate: -2, offsetX: -20, opacity: 0.55, brightness: 0.75 },
  { rotate:  2, offsetX:  30, opacity: 0.45, brightness: 0.65 },
  { rotate: -3, offsetX: -35, opacity: 0.5,  brightness: 0.7  },
  { rotate:  2, offsetX:  15, opacity: 0.5,  brightness: 0.7  },
  { rotate: -2, offsetX: -25, opacity: 0.45, brightness: 0.65 },
];

/* ── product card ── */
const ProductCard: React.FC<{
  product: LoginProductData; style: CardStyle; index: number;
}> = ({ product, style: s, index }) => (
  <div
    className="login-product-card"
    style={{
      '--card-rotate': `${s.rotate}deg`,
      '--card-offset': `${s.offsetX}px`,
      '--card-opacity': s.opacity,
      '--card-brightness': s.brightness,
      '--card-index': index,
    } as React.CSSProperties}
  >
    <div className="login-product-card__img-wrap">
      <img src={product.src} alt={product.name} className="login-product-card__img" draggable={false} />
      {product.discount > 0 && (
        <div className="login-product-card__badge">-{product.discount}%</div>
      )}
    </div>
    <div className="login-product-card__body">
      <span className="login-product-card__shop">{product.shop}</span>
      <h3 className="login-product-card__name">{product.name}</h3>
      <div className="login-product-card__price-row">
        <span className="login-product-card__final">{product.finalPrice.toFixed(2)} €</span>
        {product.discount > 0 && (
          <span className="login-product-card__original">{product.price.toFixed(2)} €</span>
        )}
      </div>
    </div>
  </div>
);

/* ── scrolling column ── */
const ScrollColumn: React.FC<{
  products: LoginProductData[];
  direction: 'up' | 'down';
  side: 'left' | 'right' | 'center';
}> = ({ products, direction, side }) => {
  const doubled = [...products, ...products];
  const styles = side === 'left' ? LEFT_CARD_STYLES
    : side === 'right' ? RIGHT_CARD_STYLES
    : MOBILE_CARD_STYLES;

  return (
    <div className={`login-scroll-column login-scroll-column--${side}`}>
      <div className={`login-scroll-track login-scroll-track--${direction}`}>
        {doubled.map((p, i) => (
          <ProductCard key={`${p.name}-${i}`} product={p} style={styles[i % products.length]} index={i} />
        ))}
      </div>
    </div>
  );
};

/* ── helper ── */
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════════
   Main LoginView
   ══════════════════════════════════════════ */
export const LoginView: React.FC<{ onLoginStart?: () => void; onGuestLogin?: () => void }> = ({ onLoginStart, onGuestLogin }) => {
  const { openLegalDisclaimerModal } = useUIStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [focused, setFocused]   = useState<string | null>(null);
  const [phase, setPhase]       = useState<AnimPhase>('idle');
  const submitting              = useRef(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;

    setError(null);

    // Tell App.tsx this is a real login attempt (not page refresh)
    onLoginStart?.();

    // ── Step 1: Cart drives right (300ms) ──
    setPhase('cart-drive');
    await wait(350);

    // ── Step 2: Spinner + all exit animations start ──
    setPhase('loading');

    // Start Supabase login in parallel with exit animations
    const loginPromise = supabase.auth.signInWithPassword({ email, password });

    // Wait for both: animation (700ms for cards to fly out) + login result
    const [loginResult] = await Promise.all([loginPromise, wait(700)]);

    if (loginResult.error) {
      // ── Error: red flash → revert ──
      setPhase('error');
      await wait(600);
      setPhase('idle');
      submitting.current = false;
      setError(loginResult.error.message || 'Authentication failed.');
    } else {
      // ── Success: green flash → card catapults + background fades ──
      setPhase('success');
    }
  }, [email, password, onLoginStart]);

  const handleGuestLogin = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    triggerHaptic(15);

    // ── Step 1: Cart drives right (300ms) ──
    setPhase('cart-drive');
    await wait(350);

    // ── Step 2: Spinner + all exit animations start ──
    setPhase('loading');
    
    // Call parent handler to switch store to guest mode
    onGuestLogin?.();

    await wait(500);
    setPhase('success');
  }, [onGuestLogin]);

  const rootClasses = [
    'login-root',
    phase === 'cart-drive' && 'login-root--cart-drive',
    phase === 'loading'   && 'login-root--loading',
    phase === 'success'   && 'login-root--success',
    phase === 'error'     && 'login-root--error',
    phase === 'success'   && 'login-root--exiting',
  ].filter(Boolean).join(' ');

  const buttonLabel = phase === 'cart-drive' || phase === 'loading' ? 'Anmeldung läuft…'
    : phase === 'success' ? 'Willkommen!'
    : 'Anmelden';

  const isActive = phase !== 'idle';

  return (
    <div className={rootClasses}>
      <LegalDisclaimerModal />

      {/* Scattered atmospheric background logos across the page */}
      <img src={logoWhite} alt="" className="login-scattered-logo login-scattered-logo--1" draggable={false} />
      <img src={logoWhite} alt="" className="login-scattered-logo login-scattered-logo--2" draggable={false} />
      <img src={logoWhite} alt="" className="login-scattered-logo login-scattered-logo--3" draggable={false} />
      <img src={logoWhite} alt="" className="login-scattered-logo login-scattered-logo--4" draggable={false} />

      {/* Hero Section */}
      <div className="login-hero">
        {/* Main Hero Watermark Logo - scrolls with hero */}
        <img
          src={logoWhite}
          alt=""
          className="login-bg-watermark"
          draggable={false}
        />

        {/* Desktop: two side columns */}
        <ScrollColumn products={LEFT_PRODUCTS}  direction="up"   side="left" />
        <ScrollColumn products={RIGHT_PRODUCTS} direction="down" side="right" />

        {/* Mobile: single centre column (behind login card) */}
        <ScrollColumn products={ALL_PRODUCTS} direction="up" side="center" />

        {/* centre login card */}
        <div className="login-card-wrapper">
          <div className="login-card">
            {/* header */}
            <div className="login-card__header flex flex-col items-center">
              <img src={logoWhite} alt="Ventory Logo" className="h-14 w-auto object-contain mb-3 drop-shadow-[0_4px_16px_rgba(255,255,255,0.12)]" />
              <h1 className="login-card__title">Ventory</h1>
              <p className="login-card__subtitle">Dein Inventar. Dein Budget. Deine Kontrolle.</p>
              <div className="inline-flex items-center gap-2 mt-3.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-white/80 shadow-sm backdrop-blur-md">
                <Smartphone size={13} className="text-sky-400" />
                <span>Optimiert für Smartphone & Desktop</span>
              </div>
            </div>

            {/* error — always reserves space */}
            <div className={`login-card__error-slot ${error ? 'login-card__error-slot--visible' : ''}`}>
              <div className="login-card__error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>{error || '\u00A0'}</span>
              </div>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="login-card__form">
              <div className={`login-input-group ${focused === 'email' ? 'login-input-group--focused' : ''}`}>
                <div className="login-input-group__top">
                  <label htmlFor="login-email" className="login-input-group__label">E-Mail Adresse</label>
                </div>
                <div className="login-input-group__inner">
                  <Mail size={17} className="login-input-group__icon" />
                  <input
                    id="login-email" type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    placeholder="name@beispiel.de" className="login-input-group__input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={`login-input-group ${focused === 'password' ? 'login-input-group--focused' : ''}`}>
                <div className="login-input-group__top">
                  <label htmlFor="login-password" className="login-input-group__label">Passwort</label>
                </div>
                <div className="login-input-group__inner">
                  <Lock size={17} className="login-input-group__icon" />
                  <input
                    id="login-password" type="password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="••••••••••••" className="login-input-group__input"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isActive}
                className={`login-card__submit login-card__submit--${phase}`}
              >
                <span className="login-card__submit-text">{buttonLabel}</span>
                <span className="login-card__cart-wrap">
                  <ShoppingCart size={18} className="login-card__cart-icon" />
                  <Loader2 size={18} className="login-card__spinner-icon" />
                </span>
                <div className="login-card__submit-shine" />
              </button>

              {/* 1-Klick Gast-Zugang Divider & Button */}
              <div className="flex items-center gap-3 my-1 text-white/25 text-xs font-semibold uppercase tracking-wider">
                <div className="h-px bg-white/10 flex-1" />
                <span>oder</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isActive}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white/90 font-medium text-sm transition-all duration-300 cursor-pointer group select-none"
              >
                <Sparkles size={16} className="text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                <span>Als Gast ausprobieren (Demo-Modus)</span>
              </button>
            </form>

            <div className="login-card__footer flex flex-col items-center gap-1.5">
              <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400/80" />
                Vollständig verschlüsselt &bull; Sicherer Zugang
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  openLegalDisclaimerModal();
                }}
                className="text-[11px] text-white/50 hover:text-white underline decoration-white/25 hover:decoration-white transition-colors cursor-pointer mt-0.5"
              >
                Datenschutz und Nutzungshinweise
              </button>
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="login-flydown-element">
            <div className="opacity-40 hover:opacity-90 transition-opacity animate-bounce flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Features entdecken</span>
              <ChevronDown size={24} className="text-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Box Section */}
      <div className="login-flydown-element w-full max-w-7xl mx-auto px-6 md:px-10 pb-24 relative z-10 flex flex-col gap-8">
        {/* Top Large Card */}
        <div className="bento-card p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8 md:gap-12 shadow-2xl">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide">
              <Smartphone size={14} className="text-blue-400" />
              <span>Multi-Plattform Inventar & Budget</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Dein digitales Inventar. <span className="text-blue-400">Überall im Überblick.</span>
            </h2>
            <p className="text-white/80 text-base md:text-lg leading-relaxed font-normal">
              Verwalte alle deine Assets, Technik und Tools an einem zentralen Ort – nahtlos auf dem Desktop und mobil auf deinem Smartphone. Behalte stets den Überblick über Anschaffungswerte, Marktpreise und organisiere deine Ausstattung in praktischen Bundles.
            </p>
          </div>
          
          <div className="flex-1 w-full">
            {/* Window Container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="px-3 py-0.5 rounded text-[10px] font-mono text-white/40">
                  ventory.app/dashboard
                </div>
                <div className="w-8" />
              </div>
              <img 
                src={dashboardPreviewImg} 
                alt="Dashboard Preview" 
                className="w-full block" 
              />
            </div>
          </div>
        </div>

        {/* Bottom Grid: 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Finanz-Check */}
          <div className="bento-card p-7 md:p-8 flex flex-col justify-between h-full gap-4 group">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                <TrendingUp size={13} className="text-emerald-400" />
                <span>Budget-Analyse</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Finanz-Check</h3>
              <p className="text-white/80 text-sm leading-relaxed font-normal">
                Behalte dein monatliches Budget im Auge und tracke deine Ausgaben automatisch präzise über alle Kategorien hinweg.
              </p>
            </div>
          </div>
          
          {/* Card 2: Preis-Alarm */}
          <div className="bento-card p-7 md:p-8 flex flex-col justify-between h-full gap-4 group">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                <Tag size={13} className="text-blue-400" />
                <span>Smart Deals</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Preis-Alarm</h3>
              <p className="text-white/80 text-sm leading-relaxed font-normal">
                Entdecke Top-Deals in Echtzeit und verpasse nie wieder Rabatt-Aktionen für das Equipment, das du brauchst.
              </p>
            </div>
          </div>

          {/* Card 3: Supabase Cloud-Sync */}
          <div className="bento-card p-7 md:p-8 flex flex-col justify-between h-full gap-4 group">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold tracking-wider uppercase">
                <Cloud size={13} className="text-indigo-400" />
                <span>Cloud-Architektur</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Supabase Cloud</h3>
              <p className="text-white/80 text-sm leading-relaxed font-normal">
                Deine Daten sind jederzeit verschlüsselt in der Cloud gesichert. Keine lokalen Datenverluste.
              </p>
            </div>
          </div>

          {/* Card 4: Mobile & Touch Gesten */}
          <div className="bento-card p-7 md:p-8 flex flex-col justify-between h-full gap-4 group">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                <Smartphone size={13} className="text-emerald-400" />
                <span>Mobiles Erlebnis</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Handy & Touch</h3>
              <p className="text-white/80 text-sm leading-relaxed font-normal">
                Volle Kontrolle auf jedem Smartphone: Intuitive Wisch-Navigation über alle Ansichten und taktiles Feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
