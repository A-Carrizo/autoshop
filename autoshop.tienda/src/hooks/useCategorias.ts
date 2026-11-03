import { useState, useEffect } from 'react'
import { API } from '../config/api'
import type { Categoria } from '../types/catalogo'

// Las categorias cambian poco: se piden una sola vez y se comparten entre componentes y paginas
let cache: Categoria[] | null = null
let pedido: Promise<Categoria[]> | null = null

function pedirCategorias(): Promise<Categoria[]> {
    if (!pedido) {
        pedido = fetch(`${API.catalogo}/categorias`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then((data: Categoria[]) => { cache = data; return data })
            // Si falla se permite reintentar en el proximo montaje
            .catch(() => { pedido = null; return [] })
    }
    return pedido
}

export function useCategorias(): Categoria[] {
    const [categorias, setCategorias] = useState<Categoria[]>(() => cache ?? [])

    useEffect(() => {
        if (cache) return
        let cancelado = false
        pedirCategorias().then(data => { if (!cancelado) setCategorias(data) })
        return () => { cancelado = true }
    }, [])

    return categorias
}
