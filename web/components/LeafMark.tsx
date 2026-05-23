export function LeafMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} text-sage`} fill="none" aria-hidden>
      <path d="M4.5 19.5C4.5 11.5 10 5 19.5 4.5 19.5 14 14 19.5 4.5 19.5Z" fill="currentColor" />
      <path
        d="M4.5 19.5C7.5 14 11.5 10.5 16 9"
        stroke="#1A1714"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
