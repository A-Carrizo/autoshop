import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ItemCarrito {
    productoId: string
    nombre: string
    precioUnitario: number
    cantidad: number
    imagenUrl?: string | null
    stockDisponible: number
}

interface CarritoContextType {
    items: ItemCarrito[]
    agregarItem: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void
    quitarItem: (productoId: string) => void
    actualizarCantidad: (productoId: string, cantidad: number) => void
    vaciarCarrito: () => void
    totalItems: number
    totalPrecio: number
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined)

const STORAGE_KEY = 'tienda_carrito'

export function CarritoProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ItemCarrito[]>(() => {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY)
            return guardado ? JSON.parse(guardado) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }, [items])

    const agregarItem = (item: Omit<ItemCarrito, 'cantidad'>, cantidad: number = 1) => {
        setItems(prev => {
            const existente = prev.find(i => i.productoId === item.productoId)
            if (existente) {
                const nuevaCantidad = Math.min(existente.cantidad + cantidad, existente.stockDisponible)
                return prev.map(i =>
                    i.productoId === item.productoId ? { ...i, cantidad: nuevaCantidad } : i
                )
            }
            return [...prev, { ...item, cantidad: Math.min(cantidad, item.stockDisponible) }]
        })
    }

    const quitarItem = (productoId: string) => {
        setItems(prev => prev.filter(i => i.productoId !== productoId))
    }

    const actualizarCantidad = (productoId: string, cantidad: number) => {
        if (cantidad <= 0) {
            quitarItem(productoId)
            return
        }
        setItems(prev =>
            prev.map(i =>
                i.productoId === productoId
                    ? { ...i, cantidad: Math.min(cantidad, i.stockDisponible) }
                    : i
            )
        )
    }

    const vaciarCarrito = () => setItems([])

    const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)
    const totalPrecio = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)

    return (
        <CarritoContext.Provider value={{
            items, agregarItem, quitarItem, actualizarCantidad, vaciarCarrito, totalItems, totalPrecio
        }}>
            {children}
        </CarritoContext.Provider>
    )
}

export function useCarrito() {
    const ctx = useContext(CarritoContext)
    if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
    return ctx
}