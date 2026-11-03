import { useState } from 'react'
import { API } from '../config/api'

interface Props {
    imagenes: string[]
    nombreProducto: string
}

// Imagen principal con flechas y miniaturas abajo
export default function GaleriaImagenes({ imagenes, nombreProducto }: Props) {
    const [idx, setIdx] = useState(0)

    if (imagenes.length === 0) {
        return (
            <div className="mc-galeria__principal">
                <i className="fas fa-image mc-galeria__sin-imagen"></i>
            </div>
        )
    }

    const anterior = () => setIdx(i => (i - 1 + imagenes.length) % imagenes.length)
    const siguiente = () => setIdx(i => (i + 1) % imagenes.length)

    return (
        <div>
            <div className="mc-galeria__principal">
                <img src={`${API.imagenesBase}${imagenes[idx]}`} alt={nombreProducto} />
                {imagenes.length > 1 && (
                    <>
                        <button type="button" className="mc-galeria__flecha mc-galeria__flecha--izq" onClick={anterior} aria-label="Anterior">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button type="button" className="mc-galeria__flecha mc-galeria__flecha--der" onClick={siguiente} aria-label="Siguiente">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </>
                )}
            </div>
            {imagenes.length > 1 && (
                <div className="mc-galeria__miniaturas">
                    {imagenes.map((url, i) => (
                        <button key={url} type="button" onClick={() => setIdx(i)} aria-current={i === idx}
                            aria-label={`${nombreProducto} ${i + 1}`}>
                            <img src={`${API.imagenesBase}${url}`} alt="" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
