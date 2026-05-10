import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)          // { username, role }
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('sw_token')
        const storedUser = localStorage.getItem('sw_user')
        if (storedToken && storedUser) {
            try {
                setToken(storedToken)
                setUser(JSON.parse(storedUser))
            } catch {
                localStorage.removeItem('sw_token')
                localStorage.removeItem('sw_user')
            }
        }
        setLoading(false)
    }, [])

    const login = (tokenStr, userObj) => {
        setToken(tokenStr)
        setUser(userObj)
        localStorage.setItem('sw_token', tokenStr)
        localStorage.setItem('sw_user', JSON.stringify(userObj))
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('sw_token')
        localStorage.removeItem('sw_user')
    }

    const authFetch = (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        })
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, authFetch, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}
