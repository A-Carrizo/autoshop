import { Link } from 'react-router-dom'
import { useIdioma } from '../context/IdiomaContext'
import { useCategorias } from '../hooks/useCategorias'
import { useCatalogoCompleto } from '../hooks/useCatalogoCompleto'
import { API } from '../config/api'
import SeccionTitulo from './SeccionTitulo'
import type { Categoria, ProductoResumen } from '../types/catalogo'

// Elige una foto por categoria, sin repetir producto cuando una categoria comparte productos con otra
function fotosPorCategoria(categorias: Categoria[], productos: ProductoResumen[]): Map<string, string> {
    const conFoto = productos.filter(p => p.imagenUrl)
    // Primero los que tienen stock, para no mostrar algo que no se puede comprar
    const ordenados = [...conFoto.filter(p => p.enStock), ...conFoto.filter(p => !p.enStock)]
    const usados = new Set<string>()
    const fotos = new Map<string, string>()

    for (const categoria of categorias) {
        const deLaCategoria = ordenados.filter(p => p.categorias.some(c => c.id === categoria.id))
        const elegido = deLaCategoria.find(p => !usados.has(p.id)) ?? deLaCategoria[0]
        if (!elegido) continue
        usados.add(elegido.id)
        fotos.set(categoria.id, elegido.imagenUrl as string)
    }
    return fotos
}

// Accesos a cada categoria de la portada, con la foto de uno de sus productos
export default function AccesosCategorias() {
    const { t } = useIdioma()
    const categorias = useCategorias()
    const productos = useCatalogoCompleto()

    if (categorias.length === 0) return null

    const fotos = fotosPorCategoria(categorias, productos)

    return (
        <section>
            <SeccionTitulo titulo={t.comprarPorCategoria} subtitulo={t.comprarPorCategoriaSub}
                accion={{ texto: t.verCatalogo, to: '/catalogo' }} />
            <div className="mc-cat-grilla">
                {categorias.map(cat => {
                    const foto = fotos.get(cat.id)
                    return (
                        <Link key={cat.id} to={`/catalogo?categoriaId=${cat.id}`} className="mc-cat-tile">
                            <span className="mc-cat-tile__imagen">
                                {foto
                                    ? <img src={`${API.imagenesBase}${foto}`} alt="" loading="lazy" />
                                    : <i className="fas fa-image"></i>}
                            </span>
                            <span className="mc-cat-tile__nombre">{cat.nombre}</span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
