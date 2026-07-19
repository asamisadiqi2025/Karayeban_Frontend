export default function BuildingIcon({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Building */}
      <rect
        x="28"
        y="18"
        width="48"
        height="84"
        rx="8"
        stroke="#4F6EF7"
        strokeWidth="3"
        fill="none"
      />
      {/* Side Building */}
      <rect
        x="76"
        y="42"
        width="28"
        height="60"
        rx="6"
        stroke="#4F6EF7"
        strokeWidth="3"
        fill="none"
      />
      {/* Windows - Main Building */}
      <rect x="42" y="32" width="20" height="4" rx="2" fill="#4F6EF7" opacity="0.6" />
      <rect x="42" y="48" width="20" height="4" rx="2" fill="#4F6EF7" opacity="0.6" />
      <rect x="42" y="64" width="20" height="4" rx="2" fill="#4F6EF7" opacity="0.6" />
      <rect x="42" y="80" width="20" height="4" rx="2" fill="#4F6EF7" opacity="0.6" />
      {/* Door */}
      <rect
        x="42"
        y="88"
        width="12"
        height="14"
        rx="2"
        stroke="#4F6EF7"
        strokeWidth="2"
        fill="none"
      />
      {/* Windows - Side Building */}
      <rect x="82" y="52" width="16" height="3" rx="1.5" fill="#4F6EF7" opacity="0.4" />
      <rect x="82" y="62" width="16" height="3" rx="1.5" fill="#4F6EF7" opacity="0.4" />
      <rect x="82" y="72" width="16" height="3" rx="1.5" fill="#4F6EF7" opacity="0.4" />
    </svg>
  );
}