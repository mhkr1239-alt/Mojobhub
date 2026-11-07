import React from 'react';

/**
 * BrandLogo / BrandSymbol (WP-2.5)
 * المصدر الوحيد للشعار: ملفات SVG الرسمية في public/brand/ — تُعرض عبر <img>
 * (وفق MORA-C2Z-003 §2.4: لا ?raw من public، ولا paths/gradients يدوية في المكونات).
 * العرض يُشتق من نسبة viewBox الأصلية فلا تشويه ولا layout shift.
 */

type BrandLogoVariant = 'horizontal' | 'horizontal-light' | 'stacked' | 'monochrome';

const LOGO_SOURCES: Record<BrandLogoVariant, { src: string; ratio: number }> = {
  horizontal: { src: '/brand/mora-logo-horizontal.svg', ratio: 690 / 170 },
  'horizontal-light': { src: '/brand/mora-logo-horizontal-light.svg', ratio: 690 / 170 },
  stacked: { src: '/brand/mora-logo-stacked.svg', ratio: 360 / 330 },
  monochrome: { src: '/brand/mora-logo-monochrome.svg', ratio: 208 / 128 },
};

const SYMBOL_SRC = '/brand/mora-symbol.svg';
const SYMBOL_RATIO = 208 / 128; // viewBox الرسمي 208×128

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  /** الارتفاع بالبكسل — العرض يُحسب من نسبة الأصل */
  height?: number;
  className?: string;
  /** الافتراضي "مورا"؛ مرّر "" إذا كان اسم Mora نصًا ظاهرًا بجواره */
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  height = 32,
  className = '',
  alt = 'مورا',
}) => {
  const asset = LOGO_SOURCES[variant];
  return (
    <img
      src={asset.src}
      width={Math.round(height * asset.ratio)}
      height={height}
      alt={alt}
      decoding="async"
      className={className}
    />
  );
};

interface BrandSymbolProps {
  size?: number;
  className?: string;
  /** الافتراضي "" (زخرفي) — يُستخدم مع اسم نصي مجاور في Navbar/Footer */
  alt?: string;
}

export const BrandSymbol: React.FC<BrandSymbolProps> = ({ size = 32, className = '', alt = '' }) => (
  <img
    src={SYMBOL_SRC}
    width={Math.round(size * SYMBOL_RATIO)}
    height={size}
    alt={alt}
    decoding="async"
    className={className}
  />
);
