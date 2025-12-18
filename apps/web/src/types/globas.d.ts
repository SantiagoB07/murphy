export {}

export type Roles = 'patient' | 'coadmin' | 'doctor'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}

