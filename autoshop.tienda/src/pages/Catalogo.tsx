import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useIdioma } from '../context/IdiomaContext'
import { useCategorias } from '../hooks/useCategorias'
import { API } from '../config/api'
import TarjetaProducto, { TarjetaProductoSkeleton } from '../components/producto/TarjetaProducto'
import type { PaginaCatalogo, ProductoResumen } from '../types/catalogo'

type Vista = 'grilla' | 'lista'

const TAMANO_PAGINA = 24
const VISTA_KEY = 'tienda_vista_catalogo'

// La vista elegida se recuerda en este navegador; si el storage no esta disponible se usa grilla
function leerVista(): Vista {
    try { return localStorage.getItem(VISTA_KEY) === 'lista' ? 'lista' : 'grilla' } catch { return 'grilla' }
}

function guardarVista(v: Vista) {
    try { localStorage.setItem(VISTA_KEY, v) } catch { /* sin storage, no se recuerda */ }
}

// Numeros de pagina a mostrar: siempre primera y ultima, y las vecinas de la actual
function paginasVisibles(actual: number, total: number): (number | '...')[] {
    const resultado: (number | '...')[] = []
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - actual) <= 1) resultado.push(i)
        else if (resultado[resultado.length - 1] !== '...') resultado.push('...')
    }
    return resultado
}

// Listado completo de productos. Los filtros viven en la URL para poder compartir el link.
export default function Catalogo() {
    const [searchParams, setSearchParams] = useSearchParams()
    const { t } = useIdioma()
    const categorias = useCategorias()

    const [datos, setDatos] = useState<PaginaCatalogo | null>(null)
    const [cargando, setCargando] = useState(true)
    const [vista, setVista] = useState<Vista>(leerVista)
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

    const busqueda = searchParams.get('busqueda') || ''
    const categoriaId = searchParams.get('categoriaId') || ''
    const orden = searchParams.get('orden') || ''
    const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1)

    // Cambia un parametro de la URL; cualquier cambio de filtro vuelve a la pagina 1
    const cambiarParametro = (clave: string, valor: string) => {
        const nuevos = new URLSearchParams(searchParams)
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
        if (clave !== 'pagina') nuevos.delete('pagina')
        setSearchParams(nuevos)
    }

    const irAPagina = (n: number) => {
        cambiarParametro('pagina', n > 1 ? String(n) : '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const limpiarFiltros = () => setSearchParams({})

    const cambiarVista = (v: Vista) => { setVista(v); guardarVista(v) }

    // Cargar productos (con reintentos, por si la API todavia esta levantando)
    useEffect(() => {
        let cancelado = false
        const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

        const cargar = async () => {
            setCargando(true)
            const params = new URLSearchParams({ pagina: String(pagina), tamano: String(TAMANO_PAGINA) })
            if (busqueda) params.set('busqueda', busqueda)
            if (categoriaId) params.set('categoriaId', categoriaId)
            if (orden) params.set('orden', orden)

            for (let i = 1; i <= 4; i++) {
                try {
                    const res = await fetch(`${API.catalogo}?${params.toString()}`)
                    if (!res.ok) throw new Error()
                    const data: PaginaCatalogo = await res.json()
                    if (cancelado) return
                    setDatos(data)
                    break
                } catch {
                    if (cancelado) return
                    if (i === 4) toast.error('No se pudieron cargar los productos.')
                    else await esperar(1000)
                }
            }
            if (!cancelado) setCargando(false)
        }
        cargar()
        return () => { cancelado = true }
    }, [busqueda, categoriaId, orden, pagina])

    // Con el panel de filtros abierto en celular no se scrollea la pagina de atras
    useEffect(() => {
        if (!filtrosAbiertos) return
        const anterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = anterior }
    }, [filtrosAbiertos])

    const categoriaActual = categorias.find(c => c.id === categoriaId)
    const titulo = busqueda
        ? `${t.resultadosPara} "${busqueda}"`
        : categoriaActual?.nombre ?? t.todosLosProductos
    const hayFiltros = Boolean(categoriaId || busqueda || orden)
    const productos: ProductoResumen[] = datos?.datos ?? []
    const total = datos?.total ?? 0
    const totalPaginas = datos?.totalPaginas ?? 1

    const panelFiltros = (
        <>
            <div className="mc-filtros__bloque">
                <div className="mc-filtros__titulo">{t.categorias}</div>
                <button type="button" className="mc-filtros__opcion" aria-pressed={!categoriaId}
                    onClick={() => { cambiarParametro('categoriaId', ''); setFiltrosAbiertos(false) }}>
                    {t.todos}
                </button>
                {categorias.map(cat => (
                    <button key={cat.id} type="button" className="mc-filtros__opcion" aria-pressed={categoriaId === cat.id}
                        onClick={() => { cambiarParametro('categoriaId', cat.id); setFiltrosAbiertos(false) }}>
                        {cat.nombre}
                    </button>
                ))}
            </div>

            {hayFiltros && (
                <button type="button" className="mc-btn mc-btn--borde mc-filtros__limpiar"
                    onClick={() => { limpiarFiltros(); setFiltrosAbiertos(false) }}>
                    <i className="fas fa-times"></i>{t.limpiarFiltros}
                </button>
            )}
        </>
    )

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--mc-fondo)' }}>
            <Header />

            <div className="mc-container mc-catalogo" style={{ flex: 1 }}>
                {/* Migas de pan */}
                <nav className="mc-migas" aria-label="breadcrumb">
                    <Link to="/">{t.inicio}</Link>
                    <i className="fas fa-chevron-right"></i>
                    {categoriaActual || busqueda ? (
                        <>
                            <Link to="/catalogo">{t.catalogo}</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span aria-current="page">{categoriaActual?.nombre ?? `"${busqueda}"`}</span>
                        </>
                    ) : (
                        <span aria-current="page">{t.catalogo}</span>
                    )}
                </nav>

                <div className="mc-catalogo__cuerpo">
                    {/* Filtros: columna fija en escritorio, panel lateral en celular */}
                    <aside className={`mc-filtros${filtrosAbiertos ? ' mc-filtros--abierto' : ''}`} aria-label={t.filtros}>
                        <div className="mc-filtros__cabecera">
                            <strong>{t.filtros}</strong>
                            <button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label={t.cerrar}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        {panelFiltros}
                    </aside>
                    {filtrosAbiertos && <div className="mc-filtros__fondo" onClick={() => setFiltrosAbiertos(false)} />}

                    <main className="mc-catalogo__principal">
                        <div className="mc-catalogo__encabezado">
                            <h1>{titulo}</h1>
                            {!cargando && (
                                <span className="mc-catalogo__total">
                                    {total} {total === 1 ? t.productoEncontrado : t.productosEncontrados}
                                </span>
                            )}
                        </div>

                        {/* Barra de herramientas */}
                        <div className="mc-catalogo__barra">
                            <button type="button" className="mc-catalogo__btn-filtros" onClick={() => setFiltrosAbiertos(true)}>
                                <i className="fas fa-sliders-h"></i>{t.filtros}
                                {categoriaId && <span className="mc-catalogo__punto" />}
                            </button>

                            <select value={orden} onChange={e => cambiarParametro('orden', e.target.value)} aria-label={t.ordenarPor}>
                                <option value="">{t.ordenarPor}</option>
                                <option value="nombre">{t.nombre}</option>
                                <option value="precio_asc">{t.precioMenorMayor}</option>
                                <option value="precio_desc">{t.precioMayorMenor}</option>
                            </select>

                            <div className="mc-catalogo__vistas" role="group">
                                <button type="button" aria-pressed={vista === 'grilla'} aria-label={t.vistaGrilla} title={t.vistaGrilla}
                                    onClick={() => cambiarVista('grilla')}>
                                    <i className="fas fa-th-large"></i>
                                </button>
                                <button type="button" aria-pressed={vista === 'lista'} aria-label={t.vistaLista} title={t.vistaLista}
                                    onClick={() => cambiarVista('lista')}>
                                    <i className="fas fa-list"></i>
                                </button>
                            </div>
                        </div>

                        {/* Resultados */}
                        {cargando ? (
                            <div className={vista === 'lista' ? 'mc-lista' : 'mc-grilla'}>
                                {Array.from({ length: 8 }, (_, i) => <TarjetaProductoSkeleton key={i} vista={vista} />)}
                            </div>
                        ) : productos.length === 0 ? (
                            <div className="mc-catalogo__vacio">
                                <i className="fas fa-search"></i>
                                <strong>{t.noSeEncontraronProductos}</strong>
                                <p>{t.probaOtraBusqueda}</p>
                                {hayFiltros && (
                                    <button type="button" className="mc-btn mc-btn--primario" onClick={limpiarFiltros}>{t.limpiarFiltros}</button>
                                )}
                            </div>
                        ) : (
                            <div className={vista === 'lista' ? 'mc-lista' : 'mc-grilla'}>
                                {productos.map(p => <TarjetaProducto key={p.id} producto={p} vista={vista} />)}
                            </div>
                        )}

                        {/* Paginacion */}
                        {!cargando && totalPaginas > 1 && (
                            <nav className="mc-paginacion" aria-label={t.pagina}>
                                <button type="button" onClick={() => irAPagina(pagina - 1)} disabled={pagina === 1} aria-label={t.anterior}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                {paginasVisibles(pagina, totalPaginas).map((n, i) => n === '...'
                                    ? <span key={`e${i}`} className="mc-paginacion__puntos">…</span>
                                    : (
                                        <button key={n} type="button" onClick={() => irAPagina(n)} aria-current={n === pagina ? 'page' : undefined}>
                                            {n}
                                        </button>
                                    ))}
                                <button type="button" onClick={() => irAPagina(pagina + 1)} disabled={pagina === totalPaginas} aria-label={t.siguiente}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    )
}
