// Espelha GET /api/categories
export interface Nominee {
  id: string
  name: string
  subtitle: string | null
  imageUrl: string | null
}

export interface Category {
  id: string
  slug: string
  name: string
  points: number
  isGoty: boolean
  winnerNomineeId: string | null
  nominees: Nominee[]
  /** Palpite do usuário logado nesta categoria */
  myNomineeId: string | null
}

export interface UpsertPredictionInput {
  categoryId: string
  nomineeId: string
}

// Item de GET /api/predictions (palpites de todos, após o bloqueio)
export interface GroupPrediction {
  categoryId: string
  nomineeId: string
  user: { id: string; name: string }
}

// Resposta de PUT /api/predictions/:categoryId
export interface PredictionResponse {
  categoryId: string
  nomineeId: string
  updatedAt: string
}
