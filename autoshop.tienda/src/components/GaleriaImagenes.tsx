import { useState } from 'react'
import { API } from '../config/api'

interface Props {
    imagenes: string[]
    nombreProducto: string
}

const btnFlecha: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 2, width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', transition: 'background 0.2s',
}

export default function GaleriaImagenes({ imagenes, nombreProducto }: Props) {
    const [idx, setIdx] = useState(0)

    if (imagenes.length === 0) {
        return (
            <div style={{ background: '#f5f5f5', borderRadius: '12px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-image" style={{ fontSize: '60px', color: '#cbd5e0' }}></i>
            </div>
        )
    }

    const anterior = () => setIdx(i => (i - 1 + imagenes.length) % imagenes.length)
    const siguiente = () => setIdx(i => (i + 1) % imagenes.length)

    return (
        <div>
            <div style={{ position: 'relative', background: '#f5f5f5', borderRadius: '12px', height: '420px', overflow: 'hidden' }}>
                <img src={`${API.imagenesBase}${imagenes[idx]}`} alt={nombreProducto}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                {imagenes.length > 1 && (
                    <>
                        <button onClick={anterior} style={{ ...btnFlecha, left: '12px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,0,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button onClick={siguiente} style={{ ...btnFlecha, right: '12px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,0,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </>
                )}
            </div>
            {imagenes.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {imagenes.map((url, i) => (
                        <button key={url} onClick={() => setIdx(i)}
                            style={{
                                width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', padding: 0, cursor: 'pointer',
                                border: i === idx ? '2px solid #CC0000' : '2px solid transparent', background: '#f5f5f5', flexShrink: 0
                            }}>
                            <img src={`${API.imagenesBase}${url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
