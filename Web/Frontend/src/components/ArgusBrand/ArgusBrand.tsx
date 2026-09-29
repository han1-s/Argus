import React from 'react';

interface ArgusBrandProps {
  compact?: boolean;
}

export const ArgusBrand: React.FC<ArgusBrandProps> = ({ compact = false }) => (
  <span className={`argus-brand${compact ? ' argus-brand-compact' : ''}`} aria-label="ARGUS Vigilante">
    <svg className="argus-brand-mark" viewBox="0 0 44 44" aria-hidden="true">
      <rect x="1" y="1" width="42" height="42" rx="11" fill="#0b0714" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 31 21 12.5c.4-.9 1.7-.9 2.1 0L31.5 31M16.2 23.3h11.6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="23.3" r="2.1" fill="#0b0714" stroke="currentColor" strokeWidth="1.4" />
    </svg>
    <span className="argus-brand-copy">
      <span className="argus-brand-name">ARGUS</span>
      {!compact && <span className="argus-brand-tagline">VIGILANTE</span>}
    </span>
  </span>
);
