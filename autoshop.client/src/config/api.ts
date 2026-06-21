const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:32770'

export const API = {
    categorias: `${API_BASE_URL}/api/categorias`,
    productos: `${API_BASE_URL}/api/productos`,
    ventas: `${API_BASE_URL}/api/ventas`,
    devoluciones: `${API_BASE_URL}/api/devoluciones`,
    inventario: `${API_BASE_URL}/api/inventario`,
    reportes: `${API_BASE_URL}/api/reportes`,
    imagenes: `${API_BASE_URL}/api/imagenes`,
    auth: `${API_BASE_URL}/api/auth`,
    clientes: `${API_BASE_URL}/api/clientes`,
    pedidos: `${API_BASE_URL}/api/tienda/pedidos`,
    imagenesBase: API_BASE_URL
}

export default API_BASE_URL

