// Espelha o PublicUser da API (api/src/users/users.service.ts)
export type Role = 'ADMIN' | 'PLAYER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface LoginInput {
  email: string
  password: string
}

// Espelha o RegisterDto da API (api/src/auth/dto/register.dto.ts)
export interface RegisterInput {
  name: string
  email: string
  password: string
  inviteCode: string
}
