import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import CarruselPromociones from '../components/CarruselPromociones'
import CarruselProductos from '../components/producto/CarruselProductos'
import AccesosCategorias from '../components/AccesosCategorias'
import { useIdioma } from '../context/IdiomaContext'
import { useCategorias } from '../hooks/useCategorias'
import type { ProductoResumen } from '../types/catalogo'

// Cantidad de categorias que tienen su propia fila de productos en la portada
const CATEGORIAS_CON_FILA = 3

const conDescuento = (p: ProductoResumen) => p.descuentoPct > 0

// Portada de la tienda: promociones, accesos por categoria y filas de productos
export default function Home() {
    const { t } = useIdioma()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const categorias = useCategorias()

    // Los links viejos (/?busqueda=... o /?categoriaId=...) ahora viven en /catalogo
    if (searchParams.has('busqueda') || searchParams.has('categoriaId')) {
        return <Navigate to={`/catalogo${location.search}`} replace />
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />
            <CarruselPromociones />

            <main className="mc-container mc-portada" style={{ flex: 1 }}>
                <CarruselProductos titulo={t.ofertas} subtitulo={t.ofertasSub} filtrar={conDescuento} verTodo="/catalogo" />

                <AccesosCategorias />

                <CarruselProductos titulo={t.destacados} subtitulo={t.destacadosSub} verTodo="/catalogo" />

                {categorias.slice(0, CATEGORIAS_CON_FILA).map(cat => (
                    <CarruselProductos key={cat.id} titulo={cat.nombre}
                        filtros={{ categoriaId: cat.id }} verTodo={`/catalogo?categoriaId=${cat.id}`} />
                ))}
            </main>

            <Footer />
        </div>
    )
}
