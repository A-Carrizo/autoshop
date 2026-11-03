import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
    titulo: string
    subtitulo?: string
    // Link opcional a la derecha (ej: "Ver todo")
    accion?: { texto: string; to: string }
    // Contenido extra a la derecha (ej: flechas del carrusel)
    children?: ReactNode
}

// Encabezado de seccion: titulo grande con barra roja, subtitulo y acciones a la derecha
export default function SeccionTitulo({ titulo, subtitulo, accion, children }: Props) {
    return (
        <div className="mc-seccion-titulo">
            <div className="mc-seccion-titulo__textos">
                <h2>{titulo}</h2>
                {subtitulo && <p>{subtitulo}</p>}
            </div>
            <div className="mc-seccion-titulo__acciones">
                {children}
                {accion && <Link to={accion.to} className="mc-btn mc-btn--primario mc-btn--chico">{accion.texto}</Link>}
            </div>
        </div>
    )
}
