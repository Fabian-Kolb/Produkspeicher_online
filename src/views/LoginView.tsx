import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, ShoppingCart, ChevronDown, Cloud } from 'lucide-react';
import logoWhite from '../assets/logo/logo_white.png';
import dashboardPreviewImg from '../assets/landing/dashboard-preview.png';
import budgetGraphImg from '../assets/landing/budget-graph.png';
import rabattImg from '../assets/landing/rabatt.png';
import './LoginView.css';

/* ── product data ── */
const LEFT_PRODUCTS = [
  { src: '/images/products/headphones.png', name: 'Sony WH-1000XM5', shop: 'MediaMarkt', price: 379.99, finalPrice: 299.99, discount: 21, rating: 9.2 },
  { src: '/images/products/smartwatch.png', name: 'Galaxy Watch Ultra', shop: 'Samsung Store', price: 699.00, finalPrice: 699.00, discount: 0, rating: 8.7 },
  { src: '/images/products/speaker.png', name: 'HomePod Mini', shop: 'Apple Store', price: 109.00, finalPrice: 89.00, discount: 18, rating: 7.8 },
  { src: '/images/products/camera.png', name: 'Sony Alpha 7 IV', shop: 'Amazon', price: 2499.00, finalPrice: 2199.00, discount: 12, rating: 9.5 },
];

const RIGHT_PRODUCTS = [
  { src: '/images/products/sneakers.png', name: 'Nike Air Max 90', shop: 'Nike Store', price: 149.99, finalPrice: 119.99, discount: 20, rating: 8.4 },
  { src: '/images/products/backpack.png', name: 'Peak Design 30L', shop: 'Peak Design', price: 299.95, finalPrice: 299.95, discount: 0, rating: 9.1 },
  { src: '/images/products/sunglasses.png', name: 'Ray-Ban Aviator', shop: 'Ray-Ban', price: 179.00, finalPrice: 143.20, discount: 20, rating: 8.9 },
  { src: '/images/products/keyboard.png', name: 'Razer Huntsman V3', shop: 'Saturn', price: 249.99, finalPrice: 199.99, discount: 20, rating: 8.6 },
];

/* All products combined for mobile single column */
const ALL_PRODUCTS = [...LEFT_PRODUCTS, ...RIGHT_PRODUCTS];

/* ── types ── */
interface LoginProductData {
  src: string; name: string; shop: string;
  price: number; finalPrice: number; discount: number; rating: number;
}

interface CardStyle {
  rotate: number; offsetX: number; opacity: number; brightness: number;
}

type AnimPhase = 'idle' | 'cart-drive' | 'loading' | 'success' | 'error';

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
    <div className="login-product-card__rating">
      <div className="login-product-card__rating-track">
        <div className="login-product-card__rating-fill" style={{ width: `${(product.rating / 10) * 100}%` }} />
      </div>
      <span className="login-product-card__rating-text">{product.rating.toFixed(1)} / 10</span>
    </div>
  </div>
);

/* ── rain-shower style presets ── */
const LEFT_CARD_STYLES: CardStyle[] = [
  { rotate:  3, offsetX:  40, opacity: 1.0,  brightness: 1.0  },
  { rotate: -2, offsetX: -60, opacity: 0.45, brightness: 0.55 },
  { rotate:  5, offsetX:  80, opacity: 1.0,  brightness: 1.0  },
  { rotate: -4, offsetX: -20, opacity: 0.6,  brightness: 0.65 },
  { rotate:  2, offsetX:  60, opacity: 0.9,  brightness: 0.95 },
  { rotate: -3, offsetX: -80, opacity: 0.3,  brightness: 0.45 },
  { rotate:  4, offsetX:  20, opacity: 0.85, brightness: 0.9  },
  { rotate: -2, offsetX: -40, opacity: 0.5,  brightness: 0.6  },
];

const RIGHT_CARD_STYLES: CardStyle[] = [
  { rotate: -3, offsetX:  60, opacity: 1.0,  brightness: 1.0  },
  { rotate:  4, offsetX: -40, opacity: 0.5,  brightness: 0.6  },
  { rotate: -2, offsetX:  80, opacity: 1.0,  brightness: 1.0  },
  { rotate:  3, offsetX: -70, opacity: 0.35, brightness: 0.5  },
  { rotate: -4, offsetX:  30, opacity: 0.85, brightness: 0.9  },
  { rotate:  2, offsetX: -20, opacity: 0.65, brightness: 0.7  },
  { rotate: -3, offsetX:  70, opacity: 0.95, brightness: 1.0  },
  { rotate:  4, offsetX: -50, opacity: 0.4,  brightness: 0.55 },
];

/* Mobile single-column styles: all cards use same gentle scatter */
const MOBILE_CARD_STYLES: CardStyle[] = [
  { rotate:  2, offsetX:  30, opacity: 0.6, brightness: 0.65 },
  { rotate: -3, offsetX: -40, opacity: 0.5, brightness: 0.55 },
  { rotate:  4, offsetX:  50, opacity: 0.55, brightness: 0.6  },
  { rotate: -2, offsetX: -20, opacity: 0.65, brightness: 0.7  },
  { rotate:  3, offsetX:  40, opacity: 0.5, brightness: 0.55 },
  { rotate: -4, offsetX: -50, opacity: 0.6,  brightness: 0.65 },
  { rotate:  2, offsetX:  20, opacity: 0.55, brightness: 0.6  },
  { rotate: -3, offsetX: -30, opacity: 0.5,  brightness: 0.55 },
];

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
          <ProductCard key={`${p.name}-${i}`} product={p} style={styles[i % styles.length]} index={i} />
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
export const LoginView: React.FC<{ onLoginStart?: () => void }> = ({ onLoginStart }) => {
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
      // App.tsx keeps this LoginView mounted for ~4s so the exit animation plays
      // Meanwhile Dashboard renders underneath (this component is position:fixed)
    }
  }, [email, password, onLoginStart]);

  const rootClasses = [
    'login-root',
    phase === 'cart-drive' && 'login-root--cart-drive',
    phase === 'loading'   && 'login-root--loading',
    phase === 'success'   && 'login-root--success',
    phase === 'error'     && 'login-root--error',
    phase === 'success'   && 'login-root--exiting',
  ].filter(Boolean).join(' ');

  const buttonLabel = phase === 'cart-drive' || phase === 'loading' ? 'Signing in…'
    : phase === 'success' ? 'Welcome!'
    : 'Sign In';

  const isActive = phase !== 'idle';

  return (
    <div className={rootClasses}>
      {/* ambient gradient blobs */}
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />
      <div className="login-blob login-blob--3" />

      {/* Hero Section */}
      <div className="login-hero">
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
              <img src={logoWhite} alt="Ventory Logo" className="h-16 w-auto object-contain mb-4" />
              <h1 className="login-card__title text-5xl font-bold tracking-tight">Ventory</h1>
              <p className="login-card__subtitle mt-2">Dein Inventar. Dein Budget. Deine Kontrolle.</p>
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
                <Mail size={18} className="login-input-group__icon" />
                <input
                  id="login-email" type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder="you@example.com" className="login-input-group__input"
                  autoComplete="email"
                />
                <label htmlFor="login-email" className="login-input-group__label">Email</label>
              </div>

              <div className={`login-input-group ${focused === 'password' ? 'login-input-group--focused' : ''}`}>
                <Lock size={18} className="login-input-group__icon" />
                <input
                  id="login-password" type="password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="••••••••" className="login-input-group__input"
                  autoComplete="current-password"
                />
                <label htmlFor="login-password" className="login-input-group__label">Password</label>
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
            </form>

            <p className="login-card__footer">
              Secure access &bull; Encrypted connection
            </p>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="login-flydown-element">
            <div className="opacity-60 animate-bounce">
              <ChevronDown size={36} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Box Section */}
      <div className="login-flydown-element w-full px-6 md:px-10 pb-24 relative z-10 flex flex-col gap-8">
        {/* Top Large Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tighter leading-tight">Dein digitales Inventar.</h2>
            <p className="text-white/70 text-lg md:text-xl lg:text-2xl leading-relaxed font-light">
              Verwalte alle deine Assets, Technik und Tools an einem zentralen Ort. 
              Behalte stets den Überblick über Anschaffungswerte und aktuelle Marktpreise, 
              und organisiere deine Ausstattung in praktischen Bundles.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full"></div>
            <img 
              src={dashboardPreviewImg} 
              alt="Dashboard Preview" 
              className="relative w-full rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-white/10" 
            />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col justify-between h-full gap-8 group transition-transform duration-500 hover:bg-white/[0.07]">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">Finanz-Check</h3>
              <p className="text-white/70 text-base md:text-lg leading-relaxed font-light">
                Behalte dein monatliches Budget im Auge und tracke deine Ausgaben automatisch präzise über alle Kategorien hinweg.
              </p>
            </div>
            <div className="w-full overflow-hidden rounded-2xl border border-white/5 shadow-lg mt-auto">
              <img 
                src={budgetGraphImg} 
                alt="Budget Control" 
                className="w-full block group-hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col justify-between h-full gap-8 group transition-transform duration-500 hover:bg-white/[0.07]">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">Preis-Alarm</h3>
              <p className="text-white/70 text-base md:text-lg leading-relaxed font-light">
                Entdecke Top-Deals in Echtzeit und verpasse nie wieder Rabatt-Aktionen für das Equipment, das du brauchst.
              </p>
            </div>
            <div className="w-full overflow-hidden rounded-2xl border border-white/5 shadow-lg mt-auto">
              <img 
                src={rabattImg} 
                alt="Discount Alerts" 
                className="w-full block group-hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>

          {/* Card 3 (Abstract CSS/Lucide) */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col justify-between h-full gap-8 group transition-transform duration-500 hover:bg-white/[0.07]">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">Supabase Cloud-Sync</h3>
              <p className="text-white/70 text-base md:text-lg leading-relaxed font-light">
                Deine Daten sind jederzeit und überall verschlüsselt abrufbar. Keine lokalen Verluste dank nahtloser Cloud-Anbindung.
              </p>
            </div>
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 shadow-inner flex items-center justify-center relative overflow-hidden mt-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-700" />
              <Cloud size={120} strokeWidth={1.5} className="text-indigo-400 relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] group-hover:-translate-y-3 transition-transform duration-500" />
              <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
