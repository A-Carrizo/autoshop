const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:32769'

export const API = {
    categorias: `${API_BASE_URL}/api/categorias`,
    productos: `${API_BASE_URL}/api/productos`,
    ventas: `${API_BASE_URL}/api/ventas`,
    devoluciones: `${API_BASE_URL}/api/devoluciones`,
    inventario: `${API_BASE_URL}/api/inventario`,
    reportes: `${API_BASE_URL}/api/reportes`,
    imagenes: `${API_BASE_URL}/api/imagenes`,
    imagenesBase: API_BASE_URL
}

export default API_BASE_URL

