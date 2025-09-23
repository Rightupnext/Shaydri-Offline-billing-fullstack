
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'token'
const USER_KEY = 'user' // optional, used if you store user info separately

export const token = {
  set: (value) => localStorage.setItem(TOKEN_KEY, value),

  get: () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return null

    try {
      const decoded = jwtDecode(storedToken)
      const currentTime = Date.now() / 1000

      if (decoded.exp && decoded.exp < currentTime) {
        token.remove() // token expired, remove it
        return null
      }

      return storedToken
    } catch (e) {
      token.remove() // malformed token
      return null
    }
  },

  remove: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY) // if you store user separately
  },

  isValid: () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return false

    try {
      const decoded = jwtDecode(storedToken)
      const currentTime = Date.now() / 1000

      if (decoded.exp && decoded.exp < currentTime) {
        token.remove()
        return false
      }

      return true
    } catch {
      token.remove()
      return false
    }
  },

  getUser: () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return null

    try {
      const decoded = jwtDecode(storedToken)
      const currentTime = Date.now() / 1000

      if (decoded.exp && decoded.exp < currentTime) {
        token.remove()
        return null
      }

      return decoded // { id, email, role, ... }
    } catch {
      token.remove()
      return null
    }
  }
}
