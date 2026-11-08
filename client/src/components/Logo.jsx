// The Cafflora badge: a cup whose steam rises as leaves (coffee + flora).
// variant "badge" includes the name; "mark" is the emblem alone for small sizes.
const INK = '#2B1A10';
const CREAM = '#F4ECE1';
const GOLD = '#C8955A';
const LEAF = 'M0 0 C2.5 -3.4 7.5 -3.6 10 0 C7.5 3.6 2.5 3.4 0 0 Z';
const LEAVES = [
  [45.6, 40.5, 200],
  [49.6, 34, -25],
  [47, 26.5, 205],
  [52.5, 16.5, -50],
];

export default function Logo({ size = 40, variant = 'badge', className = '', title }) {
  const labelled = Boolean(title);
  return (
    <svg
      className={`logo ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <circle cx="50" cy="50" r="47" fill={CREAM} stroke={INK} strokeWidth="3.5" />
      <circle cx="50" cy="50" r="41.5" fill="none" stroke={GOLD} strokeWidth="0.9" />
      <g fill={INK} transform={variant === 'mark' ? 'translate(0 7.5)' : undefined}>
        <path
          d="M47 45 C43 39 52 35 48.5 29 C45.5 24 49 20 52.5 16.5"
          fill="none"
          stroke={INK}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {LEAVES.map(([x, y, angle]) => (
          <path key={`${x}-${y}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${angle})`} />
        ))}
        <path d="M34 47 H62 V50 C62 57 57 62 50 62 H46 C39 62 34 57 34 50 Z" />
        <path d="M61.5 50 C69 49.5 69 58.5 59 58" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M30 65.5 H66" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M38 68.8 H58" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
      </g>
      {variant === 'badge' && (
        <text
          x="50.75"
          y="80"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          fontSize="7.4"
          fontWeight="700"
          letterSpacing="1.5"
          fill={INK}
        >
          CAFFLORA
        </text>
      )}
    </svg>
  );
}
