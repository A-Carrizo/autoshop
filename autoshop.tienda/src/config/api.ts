const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:32770'

export const API = {
    catalogo: `${API_BASE_URL}/api/tienda/catalogo`,
    auth: `${API_BASE_URL}/api/tienda/auth`,
    pedidos: `${API_BASE_URL}/api/tienda/pedidos`,
    imagenesBase: API_BASE_URL
}

export default API_BASE_URL