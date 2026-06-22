export const brand = {
  name:       import.meta.env.VITE_BRAND_NAME        || 'Sri Ayyanar Finance',
  tagline:    import.meta.env.VITE_BRAND_TAGLINE     || 'ஸ்ரீ அம்பாள் டிரேடர்ஸ்',
  taglineAlt: import.meta.env.VITE_BRAND_TAGLINE_ALT || 'ஸ்ரீ அய்யனார் பைனான்ஸ் & ஸ்ரீ அம்பாள் டிரேடர்ஸ்',
  logo:       import.meta.env.VITE_BRAND_LOGO        || '/sri-ayyanar-logo.png',
  goldRate:   Number(import.meta.env.VITE_GOLD_RATE   || 2),
  silverRate: Number(import.meta.env.VITE_SILVER_RATE || 4),
};
