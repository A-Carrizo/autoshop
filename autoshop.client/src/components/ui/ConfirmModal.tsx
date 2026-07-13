interface ConfirmModalProps {
    show: boolean
    titulo: string
    mensaje: string
    onConfirmar: () => void | Promise<void>
    onCancelar: () => void
    tipo?: 'danger' | 'warning'
    textoConfirmar?: string
    children?: React.ReactNode
}

export default function ConfirmModal({ show, titulo, mensaje, onConfirmar, onCancelar, tipo = 'danger', textoConfirmar, children }: ConfirmModalProps) {
    if (!show) return null

    const color = tipo === 'danger' ? 'var(--secondary)' : '#f6c23e'
    const bgColor = tipo === 'danger' ? '#fce4e4' : '#fff8e1'
    const icon = tipo === 'danger' ? 'fa-trash-alt' : 'fa-exclamation-triangle'

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '14px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center' }}>

                {/* Ícono */}
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className={`fas ${icon} fa-2x`} style={{ color }}></i>
                </div>

                {/* Texto */}
                <h5 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--dark)' }}>{titulo}</h5>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: children ? '16px' : '24px' }}>{mensaje}</p>

                {/* Contenido adicional opcional (ej. detalle de items a confirmar) */}
                {children && (
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                        {children}
                    </div>
                )}

                {/* Botones */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={onCancelar}
                        style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                        Cancelar
                    </button>
                    <button onClick={onConfirmar}
                        style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: color, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                        {textoConfirmar || (tipo === 'danger' ? 'Sí, eliminar' : 'Confirmar')}
                    </button>
                </div>
            </div>
        </div>
    )
}