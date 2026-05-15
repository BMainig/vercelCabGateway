import type { Order, OrderStatus } from '../types/order'

function normalizeStatus(value: string): OrderStatus | null {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'pendente') return 'Pendente'
  if (normalized === 'incompleto') return 'Incompleto'
  if (normalized === 'completo') return 'Completo'

  return null
}

function deriveStatus(read: number, total: number): OrderStatus {
  if (read <= 0) return 'Pendente'
  if (read >= total) return 'Completo'
  return 'Incompleto'
}

function parseLidosValue(value: string): { read: number; total: number } | null {
  const match = value.trim().match(/^(\d+)\s*\/\s*(\d+)$/)
  if (!match) return null

  return {
    read: Number(match[1]),
    total: Number(match[2]),
  }
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

export function parseOrdersFromCsv(content: string): Order[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const headerCells = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase())
  const hasHeader = headerCells.some((cell) =>
    ['id', '#', 'pedido', 'lidos', 'status'].includes(cell),
  )

  const dataLines = hasHeader ? lines.slice(1) : lines
  const idIndex = headerCells.findIndex((cell) =>
    ['id', '#', 'pedido', 'numero', 'num'].includes(cell),
  )
  const lidosIndex = headerCells.findIndex((cell) => cell.includes('lidos'))
  const readIndex = headerCells.findIndex((cell) =>
    ['lidos_lidos', 'lido', 'read', 'lidos lidos'].includes(cell),
  )
  const totalIndex = headerCells.findIndex((cell) =>
    ['lidos_total', 'total', 'lidos totais'].includes(cell),
  )
  const statusIndex = headerCells.findIndex((cell) => cell === 'status')

  return dataLines
    .map((line) => {
      const cells = splitCsvLine(line)
      if (cells.length === 0) return null

      const id =
        (idIndex >= 0 ? cells[idIndex] : cells[0])?.trim() ||
        `pedido-${Date.now()}`

      let lidosRead = 0
      let lidosTotal = 0

      if (lidosIndex >= 0 && cells[lidosIndex]) {
        const parsedLidos = parseLidosValue(cells[lidosIndex])
        if (parsedLidos) {
          lidosRead = parsedLidos.read
          lidosTotal = parsedLidos.total
        }
      } else if (readIndex >= 0 && totalIndex >= 0) {
        lidosRead = Number(cells[readIndex]) || 0
        lidosTotal = Number(cells[totalIndex]) || 0
      } else if (cells[1]) {
        const parsedLidos = parseLidosValue(cells[1])
        if (parsedLidos) {
          lidosRead = parsedLidos.read
          lidosTotal = parsedLidos.total
        }
      }

      const statusFromCsv =
        statusIndex >= 0 ? normalizeStatus(cells[statusIndex] ?? '') : null

      const status =
        statusFromCsv ?? deriveStatus(lidosRead, lidosTotal)

      const order: Order = {
        id,
        lidosRead,
        lidosTotal,
        status,
        items: [],
      }

      return order
    })
    .filter((order): order is Order => order !== null)
}
