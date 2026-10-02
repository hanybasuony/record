import React from 'react';

interface OfficialLogoProps {
  className?: string;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({ className = 'w-28 h-24' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 220 190"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="شعار الشركة القابضة لمياه الشرب والصرف الصحي"
      >
        <defs>
          <radialGradient id="hcwwGreen" cx="65%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#B8E92D" />
            <stop offset="55%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#4D7C0F" />
          </radialGradient>
          <radialGradient id="hcwwBlue" cx="30%" cy="65%" r="65%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </radialGradient>
          <linearGradient id="dropInner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Outer Globe Circle - Green Right/Bottom Half */}
        <circle cx="115" cy="95" r="76" fill="url(#hcwwGreen)" />

        {/* Blue Left/Bottom Wave Sector */}
        <path
          d="M 115 19 C 68 19 39 55 39 95 C 39 137 73 171 115 171 C 128 171 140 167 150 161 C 118 148 96 117 104 75 C 108 52 115 34 115 19 Z"
          fill="url(#hcwwBlue)"
        />

        {/* Central Water Droplet Cutout */}
        <path
          d="M 103 28 C 103 28 54 90 54 125 C 54 152 76 168 103 168 C 130 168 152 152 152 125 C 152 90 103 28 103 28 Z"
          fill="url(#dropInner)"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Subtle blue wave at the base of the droplet */}
        <path
          d="M 56 132 Q 80 144 103 136 T 150 132 C 147 154 127 168 103 168 C 79 168 59 154 56 132 Z"
          fill="#0284C7"
          opacity="0.88"
        />

        {/* Arabic Typography inside the Droplet */}
        <text
          x="103"
          y="108"
          textAnchor="middle"
          fill="#1E3A8A"
          fontSize="13.5"
          fontWeight="800"
          fontFamily="Cairo, sans-serif"
        >
          الشركة القابضة
        </text>
        <text
          x="103"
          y="124"
          textAnchor="middle"
          fill="#1E3A8A"
          fontSize="9.2"
          fontWeight="700"
          fontFamily="Cairo, sans-serif"
        >
          لمياه الشرب والصرف الصحى
        </text>
      </svg>
    </div>
  );
};
