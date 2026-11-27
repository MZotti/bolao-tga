// Espelha o PublicUser da API (api/src/users/users.service.ts)
export type Role = 'ADMIN' | 'PLAYER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  /** Entrou com senha temporária definida pelo admin: precisa escolher uma nova */
  mustChangePassword: boolean
  createdAt: string
}

// Espelha o ChangePasswordDto da API (api/src/auth/dto/change-password.dto.ts)
export interface ChangePasswordInput {
  /** Dispensada quando mustChangePassword = true */
  currentPassword?: string
  newPassword: string
}

// Espelha o UpdateProfileDto da API (api/src/auth/dto/update-profile.dto.ts)
export interface UpdateProfileInput {
  name: string
  email: string
  /** Obrigatória só quando o e-mail muda */
  currentPassword?: string
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
