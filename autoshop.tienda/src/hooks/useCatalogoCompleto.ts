import { useState, useEffect } from 'react'
import { API } from '../config/api'
import type { PaginaCatalogo, ProductoResumen } from '../types/catalogo'

// La API no filtra por descuento ni devuelve fotos por categoria, asi que esos datos salen del catalogo entero
const TAMANO_CATALOGO = 500

// Los componentes que piden el catalogo al mismo tiempo comparten una sola llamada
let pedido: Promise<ProductoResumen[]> | null = null

export function pedirCatalogoCompleto(): Promise<ProductoResumen[]> {
    if (!pedido) {
        pedido = fetch(`${API.catalogo}?pagina=1&tamano=${TAMANO_CATALOGO}`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('error')))
            .then((data: PaginaCatalogo) => data.datos)
            .finally(() => { pedido = null })
    }
    return pedido
}

export function useCatalogoCompleto(): ProductoResumen[] {
    const [productos, setProductos] = useState<ProductoResumen[]>([])

    useEffect(() => {
        let cancelado = false
        pedirCatalogoCompleto()
            .then(data => { if (!cancelado) setProductos(data) })
            .catch(() => { /* las tarjetas quedan con el icono en vez de foto */ })
        return () => { cancelado = true }
    }, [])

    return productos
}
