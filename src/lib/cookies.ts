import Cookies from 'js-cookie'

const COOKIE_OPTIONS = { expires: 365, secure: true, sameSite: 'strict' as const }

export const cookieStorage = {
  get: (key: string) => {
    try {
      const value = Cookies.get(key)
      return value ? JSON.parse(value) : null
    } catch {
      return Cookies.get(key)
    }
  },
  set: (key: string, value: any) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    Cookies.set(key, stringValue, COOKIE_OPTIONS)
  },
  remove: (key: string) => Cookies.remove(key)
}
