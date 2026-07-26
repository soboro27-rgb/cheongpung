type CatfishMarkProps = {
  className?: string;
};

export default function CatfishMark({ className }: CatfishMarkProps) {
  return (
    <svg
      viewBox="-20 0 470 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Catfish AI"
    >
      <defs>
        <linearGradient id="catfishBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7CFFB2" />
          <stop offset="100%" stopColor="#38495a" />
        </linearGradient>
      </defs>
      <path
        d="M 40 70 C 60 20, 150 5, 250 15 C 295 20, 325 35, 335 70 C 325 105, 295 120, 250 125 C 150 135, 60 120, 40 70 Z"
        fill="url(#catfishBodyGrad)"
      />
      <path d="M 40 70 L -10 40 L 5 70 L -10 100 Z" fill="#7CFFB2" />
      <path
        d="M 333 55 C 375 42, 405 32, 435 28"
        stroke="#7CFFB2"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 335 70 C 378 70, 410 72, 440 75"
        stroke="#7CFFB2"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 333 85 C 373 98, 403 108, 425 122"
        stroke="#7CFFB2"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="270" cy="55" r="7" fill="#0b0f13" />
    </svg>
  );
}
