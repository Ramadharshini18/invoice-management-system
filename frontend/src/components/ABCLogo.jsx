import React from 'react';

export default function ABCLogo({ width = 40, height = 40, showText = false, textColor = '#1e293b' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="18" fill="#1d4ed8" />
        <rect x="8" y="8" width="84" height="84" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="44" fontWeight="800" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-2">
          BT
        </text>
        <rect x="20" y="72" width="60" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="8" y="8" width="16" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
        <rect x="8" y="8" width="4" height="16" rx="2" fill="rgba(255,255,255,0.5)" />
        <rect x="76" y="88" width="16" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
        <rect x="88" y="76" width="4" height="16" rx="2" fill="rgba(255,255,255,0.5)" />
      </svg>
      {showText && (
        <span style={{ color: textColor, fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
          ByteForce Technologies
        </span>
      )}
    </div>
  );
}
