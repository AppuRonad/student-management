/**
 * BackgroundEffects — CSS-animated DOM elements at z-index 0.
 * Works in both dark and light themes.
 */
export default function BackgroundEffects() {
  return (
    <>
      {/* Aurora gradient blobs */}
      <div className="page-aurora"   aria-hidden="true" />
      <div className="page-aurora-2" aria-hidden="true" />

      {/* Floating soft orb bubbles */}
      <div className="floating-orbs" aria-hidden="true">
        {[1,2,3,4,5].map(i => <div key={i} className="f-orb" />)}
      </div>

      {/* Large spinning rings */}
      <div className="bg-ring bg-ring-1" aria-hidden="true" />
      <div className="bg-ring bg-ring-2" aria-hidden="true" />
      <div className="bg-ring bg-ring-3" aria-hidden="true" />

      {/* Floating hexagons */}
      <div className="hex-floats" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <div key={i} className="hex" />)}
      </div>

      {/* Shooting star streaks */}
      <div className="shoot-stars" aria-hidden="true">
        {[1,2,3,4,5,6].map(i => <div key={i} className="star-streak" />)}
      </div>

      {/* Animated rainbow border lines (top + bottom) */}
      <div className="glow-border-top"    aria-hidden="true" />
      <div className="glow-border-bottom" aria-hidden="true" />

      {/* Corner accent brackets */}
      <div className="corner-accent tl" aria-hidden="true" />
      <div className="corner-accent tr" aria-hidden="true" />
      <div className="corner-accent bl" aria-hidden="true" />
      <div className="corner-accent br" aria-hidden="true" />

      {/* Film-grain noise */}
      <div className="noise-overlay" aria-hidden="true" />
    </>
  );
}
