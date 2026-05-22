type ReadingItemsProgressProps = {
  itemsRead: number
  itemsTotal: number
}

export function ReadingItemsProgress({ itemsRead, itemsTotal }: ReadingItemsProgressProps) {
  const safeTotal = Math.max(itemsTotal, 1)
  const safeRead = Math.min(Math.max(itemsRead, 0), safeTotal)
  const progressPercent = Math.round((safeRead / safeTotal) * 100)

  return (
    <div className="reading-progress">
      <span className="reading-summary-label">Itens lidos:</span>
      <div
        className="reading-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeRead}
        aria-label={`${safeRead} de ${safeTotal} itens lidos`}
      >
        <div
          className="reading-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="reading-progress-value reading-progress-value-read">{safeRead}</span>
        <span className="reading-progress-value reading-progress-value-total">
          {safeTotal - safeRead}
        </span>
      </div>
    </div>
  )
}
