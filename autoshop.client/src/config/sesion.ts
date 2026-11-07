import API_BASE_URL from './api'

const CLAVES_SESION = ['auth_token', 'auth_nombre', 'auth_email']
const RUTAS_DE_LOGIN = `${API_BASE_URL}/api/auth/`

function urlDe(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input
    return input instanceof URL ? input.href : input.url
}

// Agrega el token a todas las llamadas a nuestra API, sin tocar las de otros sitios.
// Si la sesion vencio, la limpia y vuelve al login.
const fetchOriginal = window.fetch.bind(window)

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlDe(input)
    if (!url.startsWith(API_BASE_URL)) return fetchOriginal(input, init)

    const token = localStorage.getItem('auth_token')
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

    const respuesta = await fetchOriginal(input, { ...init, headers })

    if (respuesta.status === 401 && token && !url.startsWith(RUTAS_DE_LOGIN)) {
        CLAVES_SESION.forEach(clave => localStorage.removeItem(clave))
        window.location.href = '/login'
    }
    return respuesta
}
