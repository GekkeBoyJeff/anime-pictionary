/*
 * Lantern — inline SVG of a traditional Japanese paper lantern (chōchin).
 *
 * Why inline SVG rather than a lucide icon: lucide icons are stroke-only and
 * look generic. This one has a body, ribs, a rope, and glow — it sells the
 * "Hidden Spirits" theme. Inline means we can color parts via currentColor
 * and animate the glow with CSS without extra files.
 *
 * Next steps if you want variations: parameterize `tone` (amber/purple) and
 * render different gradients per tone. Kept simple for now.
 */

export const Lantern = ({ className, glow = true, ...rest }) => (
    <svg
        viewBox="0 0 120 160"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...rest}
    >
        {/* Hanging rope */}
        <line
            x1="60"
            y1="0"
            x2="60"
            y2="22"
            stroke="oklch(22% 0.04 300)"
            strokeWidth="2"
        />

        {/* Top cap */}
        <rect
            x="40"
            y="18"
            width="40"
            height="8"
            rx="2"
            fill="oklch(22% 0.04 300)"
        />

        {/* Lantern body with warm amber gradient */}
        <defs>
            <radialGradient id="lantern-body" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="oklch(88% 0.18 70)" />
                <stop offset="70%" stopColor="oklch(72% 0.18 60)" />
                <stop offset="100%" stopColor="oklch(56% 0.18 50)" />
            </radialGradient>
            {glow ? (
                <filter id="lantern-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            ) : null}
        </defs>

        <ellipse
            cx="60"
            cy="80"
            rx="38"
            ry="50"
            fill="url(#lantern-body)"
            filter={glow ? "url(#lantern-glow)" : undefined}
        />

        {/* Horizontal ribs */}
        <g stroke="oklch(38% 0.1 40 / 0.55)" strokeWidth="1.5" fill="none">
            <ellipse cx="60" cy="45" rx="32" ry="3" />
            <ellipse cx="60" cy="62" rx="37" ry="3" />
            <ellipse cx="60" cy="80" rx="38" ry="3" />
            <ellipse cx="60" cy="98" rx="37" ry="3" />
            <ellipse cx="60" cy="115" rx="32" ry="3" />
        </g>

        {/* Kanji "hidden" (隠 simplified) painted on the body */}
        <text
            x="60"
            y="88"
            textAnchor="middle"
            fontSize="28"
            fontFamily="'Shippori Mincho', serif"
            fontWeight="800"
            fill="oklch(28% 0.05 40)"
            opacity="0.85"
        >
            隠
        </text>

        {/* Bottom cap */}
        <rect
            x="42"
            y="130"
            width="36"
            height="8"
            rx="2"
            fill="oklch(22% 0.04 300)"
        />

        {/* Tassel */}
        <line x1="60" y1="138" x2="60" y2="156" stroke="oklch(22% 0.04 300)" strokeWidth="2" />
        <circle cx="60" cy="158" r="3" fill="oklch(22% 0.04 300)" />
    </svg>
);
