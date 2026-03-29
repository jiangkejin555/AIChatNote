import React from 'react';

interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function AppIcon({ size = 40, className, ...props }: AppIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 140 140" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Notebook 1 (Bottom) - Deep Purple */}
      <path d="M 25 80 L 65 95 L 115 80 L 75 65 Z" fill="#581C87" opacity={0.8}/>
      <path d="M 25 80 L 65 95 L 65 105 L 25 90 Z" fill="rgba(216, 180, 254, 0.4)"/>
      <path d="M 65 95 L 115 80 L 115 90 L 65 105 Z" fill="rgba(192, 132, 252, 0.3)"/>
      <path d="M 25 90 L 65 105 L 65 108 L 25 93 Z" fill="#3B0764"/>
      <path d="M 65 105 L 115 90 L 115 93 L 65 108 Z" fill="#3B0764"/>
      <polygon points="40,86 48,89 48,103 44,100 40,103" fill="#A855F7"/>

      {/* Notebook 2 (Middle) - Indigo/Violet mix */}
      <path d="M 25 60 L 65 75 L 115 60 L 75 45 Z" fill="#4338CA" opacity={0.9}/>
      <path d="M 25 60 L 65 75 L 65 85 L 25 70 Z" fill="rgba(199, 210, 254, 0.6)"/>
      <path d="M 65 75 L 115 60 L 115 70 L 65 85 Z" fill="rgba(165, 180, 252, 0.5)"/>
      <path d="M 25 70 L 65 85 L 65 88 L 25 73 Z" fill="#312E81"/>
      <path d="M 65 85 L 115 70 L 115 73 L 65 88 Z" fill="#312E81"/>

      {/* Notebook 3 (Top) - Bright Tech Blue */}
      <path d="M 25 40 L 65 55 L 115 40 L 75 25 Z" fill="#3B82F6"/>
      <path d="M 25 40 L 65 55 L 65 65 L 25 50 Z" fill="rgba(219, 234, 254, 0.9)"/>
      <path d="M 65 55 L 115 40 L 115 50 L 65 65 Z" fill="rgba(191, 219, 254, 0.8)"/>
      <path d="M 25 50 L 65 65 L 65 68 L 25 53 Z" fill="#1D4ED8"/>
      <path d="M 65 65 L 115 50 L 115 53 L 65 68 Z" fill="#1D4ED8"/>
      
      {/* Note content on top cover */}
      <line x1="55" y1="36" x2="85" y2="44" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round"/>
      <line x1="50" y1="41" x2="70" y2="47" stroke="#BFDBFE" strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx="45" cy="40" r="3.5" fill="#93C5FD"/>
      <polygon points="90,47 98,44 98,58 94,56 90,58" fill="#60A5FA"/>
    </svg>
  );
}
