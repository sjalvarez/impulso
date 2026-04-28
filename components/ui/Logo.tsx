interface Props {
  height?: number;
  variant?: 'dark' | 'light';
}

// Viewbox: 820 × 160
// Rendered at given height, width scales proportionally
export default function Logo({ height = 32, variant = 'dark' }: Props) {
  const width = Math.round(height * (820 / 160));
  const rectFill    = variant === 'light' ? '#FFFFFF' : '#2B2F36';
  const textFill    = variant === 'light' ? '#FFFFFF' : '#2B2F36';
  // ballot slip is always red
  const ballotFill  = '#C8102E';
  const barFill     = variant === 'light' ? '#2B2F36' : '#FFFFFF';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 820 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Impulso"
    >
      <g transform="translate(20,24)">
        {/* Ballot box body */}
        <rect x="0" y="28" width="56" height="68" rx="14" fill={rectFill} />
        {/* Horizontal bar on box */}
        <rect x="10" y="42" width="36" height="6" rx="3" fill={barFill} />
        {/* Ballot slip (always red) */}
        <rect x="22" y="-6" width="20" height="24" rx="5" fill={ballotFill} transform="rotate(-10 22 -6)" />
      </g>
      <text
        x="100"
        y="110"
        fontFamily="'Sora', sans-serif"
        fontWeight="600"
        fontSize="104"
        letterSpacing="-1.5"
        fill={textFill}
      >
        impulso
      </text>
    </svg>
  );
}
