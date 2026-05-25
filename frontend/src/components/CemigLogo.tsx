type CemigLogoProps = {
  className?: string
}

export function CemigLogo({ className }: CemigLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 120"
      role="img"
      aria-label="CEMIG"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 72 48 28l26 44H59L48 53 37 72z" fill="#20a64a" />
      <path d="M64 72 90 28l26 44h-15L90 53 79 72z" fill="#f6c300" />
      <path d="M104 72 130 28l26 44h-15l-11-19-11 19z" fill="#20a64a" />
      <text
        x="80"
        y="99"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="25"
        fontWeight="700"
        fill="#1f2933"
      >
        CEMIG
      </text>
    </svg>
  )
}
