/**
 * Line-art illustrations for empty states (RDD §11): navy strokes + teal accents, 1.5 px,
 * inherit currentColor where useful so they work in both themes. All decorative.
 */

const stroke = {
  fill: "none",
  stroke: "var(--navy)",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Projects: an RFP document with a container ship passing behind. */
export function ProjectsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" width="200" height="140" className={className} aria-hidden>
      <ellipse cx="100" cy="128" rx="78" ry="6" fill="var(--brand-soft)" />
      <path
        {...stroke}
        opacity="0.35"
        d="M20 104c8-5 16-5 24 0s16 5 24 0 16-5 24 0 16 5 24 0 16-5 24 0 16 5 24 0 16-5 24 0"
      />
      <g opacity="0.45">
        <path {...stroke} d="M24 96h60l-6 10H30z" />
        <rect {...stroke} x="34" y="84" width="12" height="12" rx="1" />
        <rect {...stroke} x="46" y="84" width="12" height="12" rx="1" />
        <rect {...stroke} x="40" y="72" width="12" height="12" rx="1" />
        <rect {...stroke} x="58" y="84" width="12" height="12" rx="1" />
      </g>
      <rect
        x="88"
        y="18"
        width="78"
        height="100"
        rx="8"
        fill="var(--surface)"
        stroke="var(--navy)"
        strokeWidth="1.5"
      />
      <path {...stroke} d="M150 18v14a4 4 0 0 0 4 4h12" opacity="0.5" />
      <rect x="100" y="34" width="36" height="6" rx="3" fill="var(--brand)" opacity="0.9" />
      <path {...stroke} opacity="0.55" d="M100 52h52M100 62h44M100 72h52M100 82h30" />
      <circle
        cx="146"
        cy="100"
        r="11"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth="1.5"
      />
      <path
        d="M141 100.5l3.5 3.5 6.5-7"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Standards: a shield holding a rule checklist. */
export function StandardsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" width="200" height="140" className={className} aria-hidden>
      <ellipse cx="100" cy="128" rx="70" ry="6" fill="var(--brand-soft)" />
      <path
        d="M100 14l44 14v34c0 28-19 48-44 58-25-10-44-30-44-58V28z"
        fill="var(--surface)"
        stroke="var(--navy)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M100 26l32 10v26c0 20-13 35-32 43"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.5"
        opacity="0.35"
      />
      {[46, 62, 78].map((y, i) => (
        <g key={y}>
          <rect
            x="78"
            y={y - 5}
            width="10"
            height="10"
            rx="3"
            fill={i < 2 ? "var(--brand)" : "none"}
            stroke="var(--brand)"
            strokeWidth="1.5"
          />
          {i < 2 && (
            <path
              d={`M80.5 ${y}l2 2 3.5-4`}
              fill="none"
              stroke="var(--on-brand)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path {...stroke} opacity="0.55" d={`M94 ${y}h${i === 1 ? 22 : 30}`} />
        </g>
      ))}
    </svg>
  );
}

/** Generic: stacked documents (used by viewer/dropzone empty states later). */
export function DocumentsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" width="200" height="140" className={className} aria-hidden>
      <ellipse cx="100" cy="128" rx="64" ry="6" fill="var(--brand-soft)" />
      <rect
        x="62"
        y="30"
        width="72"
        height="92"
        rx="7"
        fill="var(--surface)"
        stroke="var(--navy)"
        strokeWidth="1.5"
        opacity="0.4"
        transform="rotate(-8 98 76)"
      />
      <rect
        x="68"
        y="24"
        width="72"
        height="92"
        rx="7"
        fill="var(--surface)"
        stroke="var(--navy)"
        strokeWidth="1.5"
        opacity="0.7"
        transform="rotate(4 104 70)"
      />
      <rect
        x="64"
        y="20"
        width="72"
        height="96"
        rx="7"
        fill="var(--surface)"
        stroke="var(--navy)"
        strokeWidth="1.5"
      />
      <rect x="76" y="34" width="30" height="5" rx="2.5" fill="var(--brand)" />
      <path {...stroke} opacity="0.55" d="M76 50h48M76 60h40M76 70h48M76 80h28M76 90h44" />
    </svg>
  );
}
