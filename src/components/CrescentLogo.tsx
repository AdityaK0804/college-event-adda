interface CrescentLogoProps {
  className?: string
  size?: number
}

/**
 * Modern CrescentPass logo — a stylised "C" formed from two overlapping arcs
 * with an embedded ticket notch, evoking both a crescent moon and an event ticket.
 */
const CrescentLogo = ({ className = '', size = 28 }: CrescentLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="CrescentPass logo"
  >
    {/* Outer crescent arc */}
    <path
      d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14c3.866 0 7.39-1.567 9.938-4.1"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Inner crescent arc creating the "C" negative space */}
    <path
      d="M25.938 7.9A13.94 13.94 0 0 1 30 16c0 3.866-1.567 7.39-4.062 9.9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    {/* Ticket dot accent */}
    <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.85" />
    {/* Pulse ring */}
    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
  </svg>
)

export default CrescentLogo
