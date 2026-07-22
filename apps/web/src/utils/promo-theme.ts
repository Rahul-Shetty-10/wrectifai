export interface PromoTheme {
  badgeColorClass: string;
  accentClass: string;
  bgColor: string;
  cardTintClass: string;
  imageGlowClass: string;
  textColorHex: string;
  cardBgColorHex: string;
}

export const PROMO_THEMES: Record<string, PromoTheme> = {
  orange: {
    badgeColorClass: 'text-[#ff7a00]',
    accentClass: 'text-[#f04f23]',
    bgColor: '#fff7ed',
    cardTintClass: 'from-[#fffaf0] via-[#fffaf5] to-[#fff4e7]',
    imageGlowClass: 'bg-[radial-gradient(circle_at_75%_45%,rgba(255,160,64,0.28),transparent_36%)]',
    textColorHex: '#f04f23',
    cardBgColorHex: '#fff7ed'
  },
  green: {
    badgeColorClass: 'text-[#1c9b6e]',
    accentClass: 'text-[#178e56]',
    bgColor: '#f0fdf4',
    cardTintClass: 'from-[#f3fffb] via-[#f7fffd] to-[#eef8ff]',
    imageGlowClass: 'bg-[radial-gradient(circle_at_72%_42%,rgba(80,178,202,0.26),transparent_38%)]',
    textColorHex: '#238453',
    cardBgColorHex: '#f0fdf4'
  },
  blue: {
    badgeColorClass: 'text-[#2454f6]',
    accentClass: 'text-[#2454f6]',
    bgColor: '#eff6ff',
    cardTintClass: 'from-[#f5f8ff] via-[#fafbfe] to-[#f0f4ff]',
    imageGlowClass: 'bg-[radial-gradient(circle_at_75%_45%,rgba(36,84,246,0.18),transparent_36%)]',
    textColorHex: '#1a56db',
    cardBgColorHex: '#eff5ff'
  },
  purple: {
    badgeColorClass: 'text-[#805ad5]',
    accentClass: 'text-[#805ad5]',
    bgColor: '#faf5ff',
    cardTintClass: 'from-[#faf5ff] to-[#f3ebff]',
    imageGlowClass: 'bg-[radial-gradient(circle_at_74%_42%,rgba(165,108,255,0.18),transparent_36%)]',
    textColorHex: '#805ad5',
    cardBgColorHex: '#faf5ff'
  },
  red: {
    badgeColorClass: 'text-[#ff3b30]',
    accentClass: 'text-[#ff3b30]',
    bgColor: '#fff5f5',
    cardTintClass: 'from-[#fff6f6] via-[#fffaf9] to-[#fff5f4]',
    imageGlowClass: 'bg-[radial-gradient(circle_at_76%_42%,rgba(255,96,96,0.16),transparent_34%)]',
    textColorHex: '#ff3b30',
    cardBgColorHex: '#fff5f5'
  }
};

export function getPromoTheme(theme: string | undefined): PromoTheme {
  return PROMO_THEMES[theme || 'blue'] || PROMO_THEMES.blue;
}
