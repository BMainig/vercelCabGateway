type CemigLogoProps = {
  className?: string
}

const CEMIG_LOGO_URL =
  'https://arquivos-compras.cemig.com.br/72b616c1-ded4-45f7-a6a4-59516cfeaf75.png'

export function CemigLogo({ className }: CemigLogoProps) {
  return <img className={className} src={CEMIG_LOGO_URL} alt="CEMIG" />
}
