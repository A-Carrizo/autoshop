// Tipos que devuelve la API publica del catalogo (/api/tienda/catalogo)

export interface Categoria { id: string; nombre: string }

// Producto tal como viene en el listado paginado del catalogo
export interface ProductoResumen {
    id: string
    nombre: string
    descripcion: string | null
    precioVenta: number
    precioOriginal: number
    descuentoPct: number
    imagenUrl: string | null
    categorias: Categoria[]
    enStock: boolean
    stockActual: number
}

export interface PaginaCatalogo {
    datos: ProductoResumen[]
    total: number
    pagina: number
    tamano: number
    totalPaginas: number
}
