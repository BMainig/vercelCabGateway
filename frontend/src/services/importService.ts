import { apiFetch } from './apiClient'

type ImportCsvResponse = {
  success: boolean
  message?: string
  import_id?: number
  total_rows?: number
  imported_rows?: number
  errors?: string[]
}

export async function uploadCsv(file: File): Promise<ImportCsvResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch('/api/imports/csv', {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as ImportCsvResponse

  if (!response.ok || !data.success) {
    const details = data.errors?.length ? `: ${data.errors.join('; ')}` : ''
    throw new Error(data.message ? `${data.message}${details}` : 'Nao foi possivel importar o CSV.')
  }

  return data
}
