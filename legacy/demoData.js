/**
 * FINAL DEMO DATA GENERATION - 20/20 INTERACTIVE SANDBOX SPLIT
 * 20 Bought Items (5 Recent, 15 History) / 20 Active Wishlist Items
 * Relative Dates: Relative to Jan 7, 2026
 */

// Helper: Recent dates (Last 7 days)
function getRecentDate() {
    const now = new Date('2026-01-07T12:00:00Z').getTime();
    const dayInMillis = 24 * 60 * 60 * 1000;
    const daysBack = Math.floor(Math.random() * 7); // 0 to 6 days back
    return new Date(now - (daysBack * dayInMillis)).toISOString();
}

// Helper: History dates (8 days to 1 year)
function getHistoryDate() {
    const now = new Date('2026-01-07T12:00:00Z').getTime();
    const dayInMillis = 24 * 60 * 60 * 1000;
    const daysBack = Math.floor(Math.random() * 350) + 8; // 8 to 358 days back
    return new Date(now - (daysBack * dayInMillis)).toISOString();
}

const BOUGHT_ITEMS = [
    { name: "Sony Alpha 7 IV", price: 2399, cat: "Hardware", sub: "Kameras", shop: "Foto Erhardt" },
    { name: "MacBook Pro 14\" M3", price: 1999, cat: "Hardware", sub: "Laptops", shop: "Apple" },
    { name: "LG UltraGear 34\"", price: 799, cat: "Hardware", sub: "Monitore", shop: "Amazon" },
    { name: "Steelcase Gesture", price: 1150, cat: "Setup", sub: "Stühle", shop: "Steelcase" },
    { name: "Keychron Q3 TKL", price: 175, cat: "Hardware", sub: "Tastaturen", shop: "Keychron" },
    { name: "Sennheiser HD 660S2", price: 499, cat: "Hardware", sub: "Audio", shop: "Sennheiser" },
    { name: "Nike Air Max 95", price: 170, cat: "Clothing", sub: "Schuhe", shop: "Size?" },
    { name: "Patagonia Better Sweater", price: 139, cat: "Clothing", sub: "Outdoor", shop: "Patagonia" },
    { name: "Adobe Creative Cloud", price: 620, cat: "Software", sub: "Design", shop: "Adobe" },
    { name: "Logitech MX Master 3S", price: 109, cat: "Hardware", sub: "Mäuse", shop: "Amazon" },
    { name: "Phillips Hue Gradient", price: 189, cat: "Home", sub: "Lighting", shop: "Hue" },
    { name: "Steam Deck OLED", price: 569, cat: "Hardware", sub: "Gaming", shop: "Steam" },
    { name: "Ableton Live 12", price: 599, cat: "Software", sub: "Audio", shop: "Ableton" },
    { name: "iPad Air M2", price: 699, cat: "Hardware", sub: "Tablets", shop: "Apple" },
    { name: "Ray-Ban Meta Smart", price: 329, cat: "Hardware", sub: "Gadgets", shop: "Meta" },
    { name: "Arc'teryx Beta Jacket", price: 400, cat: "Clothing", sub: "Jacken", shop: "Arc'teryx" },
    { name: "Secretlab Magnus Pro", price: 899, cat: "Setup", sub: "Tische", shop: "Secretlab" },
    { name: "Elgato Wave:3", price: 159, cat: "Hardware", sub: "Audio", shop: "Elgato" },
    { name: "Sonos Move 2", price: 449, cat: "Home", sub: "Audio", shop: "Sonos" },
    { name: "Peak Design Totepack", price: 189, cat: "Clothing", sub: "Bags", shop: "Peak Design" }
];

const WISHLIST_ITEMS = [
    { name: "Fujifilm X100VI", price: 1799, cat: "Hardware", sub: "Kameras", shop: "Calumet" },
    { name: "Apple Vision Pro", price: 3499, cat: "Hardware", sub: "Gadgets", shop: "Apple" },
    { name: "ASUS ProArt 32\" 4K", price: 1200, cat: "Hardware", sub: "Monitore", shop: "Notebooksbilliger" },
    { name: "Herman Miller Embody", price: 1850, cat: "Setup", sub: "Stühle", shop: "Herman Miller" },
    { name: "Wooting 60HE", price: 190, cat: "Hardware", sub: "Tastaturen", shop: "Wooting" },
    { name: "Audeze Maxwell", price: 349, cat: "Hardware", sub: "Audio", shop: "Amazon" },
    { name: "Salomon XT-6", price: 175, cat: "Clothing", sub: "Schuhe", shop: "Asphaltgold" },
    { name: "Stüssy 8 Ball Fleece", price: 195, cat: "Clothing", sub: "Outerwear", shop: "Stüssy" },
    { name: "Framer Pro Plan", price: 240, cat: "Software", sub: "Web", shop: "Framer" },
    { name: "ZSA Voyager Keyboard", price: 365, cat: "Hardware", sub: "Tastaturen", shop: "ZSA" },
    { name: "Nanoleaf Lines", price: 199, cat: "Home", sub: "Lighting", shop: "Nanoleaf" },
    { name: "Analogue Pocket", price: 219, cat: "Hardware", sub: "Gaming", shop: "Analogue" },
    { name: "Bitwig Studio 5", price: 399, cat: "Software", sub: "Audio", shop: "Bitwig" },
    { name: "Remarkable 2", price: 399, cat: "Hardware", sub: "Tablets", shop: "Remarkable" },
    { name: "Insta360 X4", price: 559, cat: "Hardware", sub: "Kameras", shop: "Insta360" },
    { name: "Stone Island Parka", price: 950, cat: "Clothing", sub: "Jacken", shop: "Stone Island" },
    { name: "Fully Jarvis Desk", price: 650, cat: "Setup", sub: "Tische", shop: "Fully" },
    { name: "Shure SM7B", price: 385, cat: "Hardware", sub: "Audio", shop: "Thomann" },
    { name: "Naim Mu-so Qb 2", price: 899, cat: "Home", sub: "Audio", shop: "Naim" },
    { name: "Naim Mu-so Qb 2", price: 899, cat: "Home", sub: "Audio", shop: "Naim" },
    { name: "Rimowa Original Check-In", price: 1250, cat: "Clothing", sub: "Bags", shop: "Rimowa" }
];

var DEMO_CATEGORIES = ['Hardware', 'Software', 'Setup', 'Clothing', 'Home'];
var DEMO_SUBCATS = {
    'Hardware': ['Laptops', 'Kameras', 'Monitore', 'Tastaturen', 'Mäuse', 'Audio', 'Tablets', 'Gaming', 'Gadgets'],
    'Software': ['Design', 'Audio', 'Coding', 'Web', 'Produktivität'],
    'Setup': ['Tische', 'Stühle', 'Beleuchtung', 'Mikrofone', 'Deko'],
    'Clothing': ['Jacken', 'Schuhe', 'Hosen', 'T-Shirts', 'Accessoires', 'Outdoor', 'Bags'],
    'Home': ['Audio', 'Beleuchtung', 'Gadgets', 'Küche', 'Deko']
};

var DEMO_PRODUCTS = [];

// Populate Bought (5 Recent, 15 History)
BOUGHT_ITEMS.forEach((it, i) => {
    const isRecent = i < 5;
    const date = isRecent ? getRecentDate() : getHistoryDate();

    DEMO_PRODUCTS.push({
        id: "demo-b-" + i,
        name: it.name,
        price: it.price,
        category: it.cat,
        sub: it.sub,
        shop: it.shop,
        imgs: [`https://picsum.photos/seed/db${i}a/800/600`, `https://picsum.photos/seed/db${i}b/800/600`],
        notes: (isRecent ? "[NEU] " : "") + "Gekauft am " + new Date(date).toLocaleDateString() + ". Super zufrieden.",
        details: "Zusätzliche Produktdetails für " + it.name,
        bought: true,
        inWishlist: false,
        fav: i % 5 === 0,
        rating: 9,
        date: date,
        dateAdded: date,
        createdAt: date,
        purchaseDate: date
    });
});

// Populate Wishlist
WISHLIST_ITEMS.forEach((it, i) => {
    const date = getHistoryDate(); // Wishlist usually historical
    DEMO_PRODUCTS.push({
        id: "demo-w-" + i,
        name: it.name,
        price: it.price,
        category: it.cat,
        sub: it.sub,
        shop: it.shop,
        imgs: [`https://picsum.photos/seed/dw${i}a/800/600`, `https://picsum.photos/seed/dw${i}b/800/600`],
        notes: "Steht ganz oben auf der Liste.",
        details: "Warum ich das Produkt möchte: " + it.name,
        bought: false,
        inWishlist: true,
        fav: i % 4 === 0,
        rating: 0,
        date: date,
        dateAdded: date,
        createdAt: date,
        purchaseDate: null
    });
});

console.log("Demo Data Refined: 20 Bought (5 Recent/15 History) / 20 Wishlist. Guaranteed recent activity.");
