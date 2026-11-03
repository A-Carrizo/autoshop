import { useState, useEffect, useRef } from 'react'
import { useIdioma } from '../../context/IdiomaContext'
import { API } from '../../config/api'
import type { PaginaCatalogo, ProductoResumen } from '../../types/catalogo'
import SeccionTitulo from '../SeccionTitulo'
import TarjetaProducto, { TarjetaProductoSkeleton } from './TarjetaProducto'

interface Props {
    titulo: string
    subtitulo?: string
    // Parametros extra para la API del catalogo (categoriaId, orden, busqueda)
    filtros?: Record<string, string>
    // Filtro adicional del lado del cliente (ej: solo productos con descuento)
    filtrar?: (p: ProductoResumen) => boolean
    cantidad?: number
    verTodo?: string
}

const SKELETONS = 5

// Fila horizontal de productos con flechas; en celular se desliza con el dedo
export default function CarruselProductos({ titulo, subtitulo, filtros, filtrar, cantidad = 12, verTodo }: Props) {
    const { t } = useIdioma()
    // Lista tal como viene de la API; el filtro del cliente se aplica al renderizar
    const [recibidos, setRecibidos] = useState<ProductoResumen[] | null>(null)
    const pistaRef = useRef<HTMLDivElement>(null)

    // Clave estable para no volver a pedir datos en cada render
    const filtrosKey = JSON.stringify(filtros ?? {})
    // Si hay filtro del cliente pedimos de mas, para que queden suficientes despues de filtrar
    const tamano = filtrar ? Math.max(cantidad * 4, 48) : cantidad

    useEffect(() => {
        let cancelado = false
        const params = new URLSearchParams({ pagina: '1', tamano: String(tamano), ...JSON.parse(filtrosKey) })
        fetch(`${API.catalogo}?${params.toString()}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then((data: PaginaCatalogo) => {
                if (!cancelado) setRecibidos(data.datos)
            })
            .catch(() => { if (!cancelado) setRecibidos([]) })
        return () => { cancelado = true }
    }, [filtrosKey, tamano])

    const productos = recibidos === null ? null : (filtrar ? recibidos.filter(filtrar) : recibidos).slice(0, cantidad)

    const desplazar = (direccion: 1 | -1) => {
        const pista = pistaRef.current
        if (!pista) return
        pista.scrollBy({ left: direccion * pista.clientWidth * 0.9, behavior: 'smooth' })
    }

    // Si la seccion no tiene productos no se muestra
    if (productos !== null && productos.length === 0) return null

    return (
        <section className="mc-carrusel">
            <SeccionTitulo titulo={titulo} subtitulo={subtitulo} accion={verTodo ? { texto: t.verTodo, to: verTodo } : undefined}>
                <div className="mc-carrusel__flechas">
                    <button type="button" onClick={() => desplazar(-1)} aria-label={t.anterior}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button type="button" onClick={() => desplazar(1)} aria-label={t.siguiente}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </SeccionTitulo>

            <div className="mc-carrusel__pista" ref={pistaRef}>
                {productos === null
                    ? Array.from({ length: SKELETONS }, (_, i) => <TarjetaProductoSkeleton key={i} />)
                    : productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
            </div>
        </section>
    )
}
