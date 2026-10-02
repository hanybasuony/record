import React from 'react';

interface OfficialStampProps {
  companyName?: string;
  areaName?: string;
  departmentName?: string;
  dateStr?: string;
  className?: string;
}

export const OfficialStamp: React.FC<OfficialStampProps> = ({
  companyName = 'شركة مياه الشرب والصرف الصحي بكفر الشيخ',
  areaName = 'منطقة مياه دسوق',
  departmentName = 'إدارة المخازن والعهد',
  dateStr = '2026/10/02',
  className = 'w-32 h-32',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none rotate-[-6deg] opacity-90 mix-blend-multiply ${className}`}
      title="خاتم شعار المنطقة الرسمي"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-blue-800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Stamped Ellipse / Circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="#1d4ed8"
          strokeWidth="3.5"
          strokeDasharray="180 3 100 2"
          fill="none"
        />
        {/* Inner Dotted Circle */}
        <circle
          cx="100"
          cy="100"
          r="84"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
        />
        {/* Center Circular Boundary */}
        <circle cx="100" cy="100" r="54" stroke="#1d4ed8" strokeWidth="2" fill="none" />

        {/* Circular text paths */}
        <path id="topCurve" d="M 24 100 A 76 76 0 0 1 176 100" fill="none" />
        <path id="bottomCurve" d="M 176 100 A 76 76 0 0 1 24 100" fill="none" />

        <text fill="#1e40af" fontSize="10" fontWeight="bold" fontFamily="Cairo, sans-serif">
          <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
            {companyName}
          </textPath>
        </text>

        <text fill="#1e40af" fontSize="10.5" fontWeight="bold" fontFamily="Cairo, sans-serif">
          <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
            {areaName} ★ {departmentName}
          </textPath>
        </text>

        {/* Center Text & Eagle / Water Droplet Icon */}
        <g transform="translate(100, 100) scale(0.9)">
          <path
            d="M 0 -24 C 0 -24 -14 -6 -14 6 C -14 14 -8 20 0 20 C 8 20 14 14 14 6 C 14 -6 0 -24 0 -24 Z"
            fill="#3b82f6"
            opacity="0.35"
          />
          <text
            y="-4"
            textAnchor="middle"
            fill="#1e3a8a"
            fontSize="10"
            fontWeight="900"
            fontFamily="Cairo, sans-serif"
          >
            معتمــــد
          </text>
          <text
            y="9"
            textAnchor="middle"
            fill="#1e3a8a"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="IBM Plex Mono, monospace"
          >
            {dateStr}
          </text>
        </g>
      </svg>
    </div>
  );
};
