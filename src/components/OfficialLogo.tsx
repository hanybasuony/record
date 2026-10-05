import React, { useState } from 'react';
import defaultOfficialLogo from '../assets/images/kafr_water_logo_1791054421640.jpg';

interface OfficialLogoProps {
  className?: string;
  showText?: boolean;
  customLogoUrl?: string;
  alt?: string;
  useVectorOnly?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = React.memo(({
  className = 'w-24 h-24 aspect-square',
  showText = true,
  customLogoUrl,
  alt = 'شعار شركة مياه الشرب والصرف الصحي بكفر الشيخ',
  useVectorOnly = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Determine active image source: custom uploaded logo or authentic official company logo asset
  const activeImageSrc = customLogoUrl || (!useVectorOnly && !imageError ? defaultOfficialLogo : null);

  if (activeImageSrc && !imageError) {
    return (
      <div className={`relative inline-flex items-center justify-center select-none aspect-square shrink-0 ${className}`}>
        <img
          src={activeImageSrc}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain rounded-full drop-shadow-2xs select-none"
          draggable={false}
          loading="eager"
        />
      </div>
    );
  }

  // Fallback: Ultra-crisp vector SVG replicating the authentic Kafr El Sheikh Water Company emblem
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none aspect-square shrink-0 ${className}`}
      title="شعار شركة مياه الشرب والصرف الصحي بكفر الشيخ"
    >
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full drop-shadow-2xs overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={alt}
      >
        <defs>
          {/* Water Droplet 3D Glossy Cyan Gradient */}
          <linearGradient id="kafrDropletGloss" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="85%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Pharaonic Sun Gold Gradient */}
          <linearGradient id="kafrSunGold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Boat Wood Gold Gradient */}
          <linearGradient id="kafrBoatGold" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Nile Deep Blue Waves Gradient */}
          <linearGradient id="kafrNileWaves" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          {/* Curved Paths for Outer Ring Typography */}
          <path id="kafrTopArc" d="M 32 120 A 88 88 0 0 1 208 120" fill="none" />
          <path id="kafrBottomArc" d="M 208 120 A 88 88 0 0 1 32 120" fill="none" />
        </defs>

        {/* 1. Outer Frame: Clean Governmental Dual Black Ring */}
        <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="#111827" strokeWidth="2.8" />
        <circle cx="120" cy="120" r="88" fill="#ffffff" stroke="#111827" strokeWidth="2.2" />

        {/* 2. Official Circular Inscriptions */}
        {showText && (
          <g>
            {/* Upper: Holding Company */}
            <text
              fill="#111827"
              fontSize="10"
              fontWeight="900"
              fontFamily="Cairo, system-ui, sans-serif"
              letterSpacing="0.2"
            >
              <textPath href="#kafrTopArc" startOffset="50%" textAnchor="middle">
                الشركة القابضة لمياه الشرب والصرف الصحي
              </textPath>
            </text>

            {/* Lower: Subsidiary Kafr El Sheikh Company */}
            <text
              fill="#111827"
              fontSize="9"
              fontWeight="900"
              fontFamily="Cairo, system-ui, sans-serif"
              letterSpacing="0.2"
            >
              <textPath href="#kafrBottomArc" startOffset="50%" textAnchor="middle">
                شركة مياه الشرب والصرف الصحي بكفر الشيخ
              </textPath>
            </text>

            {/* Separator Dashes on Left & Right */}
            <text x="210" y="123" fill="#111827" fontSize="10" fontWeight="900" textAnchor="middle">
              —
            </text>
            <text x="30" y="123" fill="#111827" fontSize="10" fontWeight="900" textAnchor="middle">
              —
            </text>
          </g>
        )}

        {/* 3. Central Inner Shield (r=86) */}
        <g id="centralMedallion" clipPath="url(#centerClip)">
          <clipPath id="centerClip">
            <circle cx="120" cy="120" r="86" />
          </clipPath>

          {/* Right Section: Sunny Warm Golden Field with Kafr El Sheikh Pharaonic Boat */}
          <rect x="34" y="34" width="172" height="172" fill="url(#kafrSunGold)" />

          {/* Stylized Nile & Mediterranean Waves Beneath Boat */}
          <g id="waterWaves">
            {/* Deep Blue Bottom Water */}
            <path
              d="M 110 148 L 210 148 L 210 210 L 110 210 Z"
              fill="url(#kafrNileWaves)"
            />
            {/* Cyan / Turquoise Zigzag Wave */}
            <path
              d="M 125 152 L 138 145 L 151 152 L 164 145 L 177 152 L 190 145 L 203 152 L 208 148 L 208 160 L 125 160 Z"
              fill="#06b6d4"
            />
            {/* Yellow / Golden Ripple Line */}
            <path
              d="M 130 144 L 141 138 L 152 144 L 163 138 L 174 144 L 185 138 L 196 144 L 206 138"
              fill="none"
              stroke="#fef08a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Ancient Egyptian Pharaonic Sun Boat (مركب الشمس الفرعوني لكفر الشيخ) */}
          <g id="pharaonicBoat" transform="translate(10, -4)">
            {/* Boat Hull (Golden Papyrus Hull) */}
            <path
              d="M 124 135 C 138 144 168 144 186 133 C 193 126 195 116 195 112 C 190 120 182 126 172 128 C 158 131 138 131 124 126 Z"
              fill="url(#kafrBoatGold)"
              stroke="#92400e"
              strokeWidth="1"
            />
            {/* Prow Stern Curl (شراع ومقدمة البردي الفرعوني) */}
            <path
              d="M 186 133 C 194 125 197 114 196 106 C 192 108 189 116 186 122 Z"
              fill="#b45309"
            />
            {/* Boat Mast */}
            <rect x="148" y="74" width="4.5" height="58" rx="1.5" fill="#92400e" />
            <rect x="149" y="112" width="2.5" height="20" fill="#dc2626" />

            {/* Billowing White Sail of Kafr El Sheikh */}
            <path
              d="M 128 72 C 145 68 165 72 174 76 C 172 96 169 114 167 122 C 152 120 134 116 126 114 C 127 98 127 84 128 72 Z"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1.2"
            />

            {/* Kafr El Sheikh Emblem on Sail: Crossed Wheat Stalks & Three Rings */}
            <g id="sailEmblem" transform="translate(150, 95) scale(0.68)">
              {/* Crossed Green Wheat Stalks (سنابل القمح الخضراء) */}
              <path
                d="M -16 14 C -10 4 -2 -6 14 -16"
                stroke="#15803d"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 16 14 C 10 4 2 -6 -14 -16"
                stroke="#15803d"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* Wheat Grain Kernels (Leaves) */}
              <circle cx="-10" cy="-11" r="2.2" fill="#22c55e" />
              <circle cx="-6" cy="-15" r="2.2" fill="#22c55e" />
              <circle cx="-13" cy="-7" r="2.2" fill="#22c55e" />
              <circle cx="10" cy="-11" r="2.2" fill="#22c55e" />
              <circle cx="6" cy="-15" r="2.2" fill="#22c55e" />
              <circle cx="13" cy="-7" r="2.2" fill="#22c55e" />

              {/* Three Interconnected Golden Rings (الحلقات الذهبية الثلاث المتداخلة) */}
              <circle cx="0" cy="-7" r="5" fill="none" stroke="#eab308" strokeWidth="2.2" />
              <circle cx="0" cy="0" r="5" fill="none" stroke="#eab308" strokeWidth="2.2" />
              <circle cx="0" cy="7" r="5" fill="none" stroke="#eab308" strokeWidth="2.2" />
            </g>
          </g>

          {/* Left Section: 3D Glossy Luminous Pure Water Droplet Swirling Inward */}
          <path
            d="M 98 34 C 108 34 116 38 116 48 C 114 62 108 76 104 90 C 98 108 96 128 106 144 C 116 160 134 172 152 178 C 160 181 166 186 164 192 C 160 200 144 206 120 206 C 74 206 34 168 34 120 C 34 76 68 36 98 34 Z"
            fill="url(#kafrDropletGloss)"
          />

          {/* Delicate Top Water Splashes & Wavelet Rim */}
          <path
            d="M 98 34 C 104 38 108 42 108 46 C 106 52 101 54 99 50 C 97 46 95 40 98 34 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <path
            d="M 108 44 C 112 48 115 51 113 56 C 111 60 106 60 105 55 C 104 50 106 46 108 44 Z"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Specular 3D Reflection Glint on Upper Left Droplet */}
          <path
            d="M 52 92 C 50 114 56 142 72 162 C 60 144 56 120 58 98 C 60 82 72 62 88 52 C 72 62 56 74 52 92 Z"
            fill="#ffffff"
            opacity="0.85"
          />

          {/* Soft Center Water Drop Highlight */}
          <ellipse cx="78" cy="116" rx="20" ry="32" fill="#ffffff" opacity="0.3" transform="rotate(-15, 78, 116)" />
        </g>
      </svg>
    </div>
  );
});
