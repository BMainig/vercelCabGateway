export type AuthUser = {
  user_id: number
  username: string
  user_first_name: string
  user_last_name: string
  user_mail: string
}

export type LoginResponse = {
  success: boolean
  message: string
  token?: string
  user?: AuthUser
}
