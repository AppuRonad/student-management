const AVATAR_CONFIGS = [
  { bg: 'linear-gradient(135deg, #b44fff, #00f5ff)' },
  { bg: 'linear-gradient(135deg, #ff2d78, #ffe600)' },
  { bg: 'linear-gradient(135deg, #39ff14, #00f5ff)' },
  { bg: 'linear-gradient(135deg, #ffe600, #ff6b35)' },
  { bg: 'linear-gradient(135deg, #00f5ff, #b44fff)' },
  { bg: 'linear-gradient(135deg, #ff6b35, #ff2d78)' },
  { bg: 'linear-gradient(135deg, #b44fff, #ff2d78)' },
  { bg: 'linear-gradient(135deg, #39ff14, #ffe600)' },
];

export default function AvatarBadge({ name, avatarIndex = 1, size = 48 }) {
  // Guard against 0, negative, null, undefined avatarIndex
  const safeIndex = Math.abs((Number(avatarIndex) || 1) - 1) % AVATAR_CONFIGS.length;
  const config = AVATAR_CONFIGS[safeIndex] || AVATAR_CONFIGS[0];

  const initials = name
    ? name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: config.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 700,
      color: 'white',
      fontFamily: "'Orbitron', sans-serif",
      flexShrink: 0,
      boxShadow: `0 0 ${size * 0.4}px rgba(180,79,255,0.4)`,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}
