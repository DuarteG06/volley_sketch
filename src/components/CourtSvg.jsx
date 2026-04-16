import { COURT_DIMENSIONS, COURT_MODES } from '../constants';

export default function CourtSvg({ courtMode }) {
  const config = COURT_DIMENSIONS[courtMode];
  const isHalfCourt = courtMode === COURT_MODES.HALF;

  return (
    <svg
      className="court-surface"
      viewBox={config.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="courtFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6d8a8" />
          <stop offset="100%" stopColor="#ebbb74" />
        </linearGradient>
        <pattern id="courtTexture" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
          <path d="M 0 1.5 L 1.5 0" stroke="rgba(255,255,255,0.08)" strokeWidth="0.08" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={config.width} height={config.height} rx="0.35" fill="url(#courtFill)" />
      <rect
        x="0.15"
        y="0.15"
        width={config.width - 0.3}
        height={config.height - 0.3}
        rx="0.3"
        fill="url(#courtTexture)"
      />

      <g className="court-lines">
        <rect x="0.3" y="0.3" width={config.width - 0.6} height={config.height - 0.6} rx="0.15" />
        {isHalfCourt ? (
          <>
            <line x1="8.7" y1="0.3" x2="8.7" y2="8.7" />
            <line x1="5.7" y1="0.3" x2="5.7" y2="8.7" className="court-lines__accent" />
          </>
        ) : (
          <>
            <line x1="9" y1="0.3" x2="9" y2="8.7" />
            <line x1="6" y1="0.3" x2="6" y2="8.7" className="court-lines__accent" />
            <line x1="12" y1="0.3" x2="12" y2="8.7" className="court-lines__accent" />
          </>
        )}
      </g>
    </svg>
  );
}
