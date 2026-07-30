import { Link } from 'react-router-dom';

export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="suwayomi-mark" x1="8" y1="7" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b92824" />
          <stop offset=".55" stopColor="#dc3f35" />
          <stop offset="1" stopColor="#e5682e" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="15" fill="url(#suwayomi-mark)" />
      <path
        d="M43.5 20.5c-3-3.2-7-4.8-11.7-4.8-6.3 0-11.3 3.4-11.3 8.6 0 4.6 3.5 7.2 10.8 8.6 7 1.4 9.1 2.5 9.1 5.6 0 3.2-3.2 5.3-7.8 5.3-5.2 0-9.4-2-12.3-5.7"
        fill="none"
        stroke="white"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({
  compact = false,
  link = false,
  className = '',
}: {
  compact?: boolean;
  link?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <BrandMark className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
      <span className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold tracking-[-0.025em] text-white`}>
        Suwayomi
      </span>
    </>
  );

  const classes = `inline-flex items-center gap-2 ${className}`;
  return link ? (
    <Link to="/" className={classes} aria-label="Suwayomi home">
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
