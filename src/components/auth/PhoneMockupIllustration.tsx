export function PhoneMockupIllustration() {
  return (
    <svg
      viewBox="0 0 220 380"
      className="h-64 w-auto drop-shadow-2xl"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b1033" />
          <stop offset="100%" stopColor="#12142b" />
        </linearGradient>
        <linearGradient id="phoneAccent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Frame */}
      <rect x="10" y="10" width="200" height="360" rx="30" fill="#05060f" stroke="#2b2b45" strokeWidth="2" />
      <rect x="18" y="18" width="184" height="344" rx="24" fill="url(#phoneScreen)" />
      <rect x="85" y="24" width="50" height="6" rx="3" fill="#2b2b45" />

      {/* Balance card */}
      <rect x="32" y="52" width="156" height="76" rx="14" fill="url(#phoneAccent)" opacity="0.18" />
      <rect x="44" y="66" width="62" height="6" rx="3" fill="#ffffff" opacity="0.45" />
      <rect x="44" y="82" width="94" height="14" rx="4" fill="#a3e635" />
      <rect x="44" y="106" width="46" height="6" rx="3" fill="#ffffff" opacity="0.3" />

      {/* Stat rows */}
      {[148, 186, 224, 262].map((y, i) => (
        <g key={y}>
          <rect x="32" y={y} width="156" height="28" rx="8" fill="#ffffff" opacity="0.05" />
          <circle cx="48" cy={y + 14} r="7" fill={["#7c3aed", "#22d3ee", "#a3e635", "#eb6834"][i]} opacity="0.8" />
          <rect x="64" y={y + 8} width={[54, 68, 46, 60][i]} height="5" rx="2.5" fill="#ffffff" opacity="0.35" />
          <rect x={150 - [18, 26, 22, 16][i]} y={y + 8} width={[18, 26, 22, 16][i] + 20} height="5" rx="2.5" fill="#ffffff" opacity="0.2" />
        </g>
      ))}

      {/* Bottom nav */}
      <rect x="32" y="308" width="156" height="34" rx="12" fill="#ffffff" opacity="0.06" />
      {[52, 90, 128, 166].map((x, i) => (
        <circle key={x} cx={x} cy="325" r="5" fill="#ffffff" opacity={i === 0 ? 0.7 : 0.25} />
      ))}
    </svg>
  );
}
