const COL = {
    bg: '#1e3a5f',
    accent: '#D4A017',
}

export default function Footer() {
    return (
        <footer style={{
            background: COL.bg,
            color: 'rgba(255,255,255,0.6)',
            padding: '32px 24px 20px',
            marginTop: '48px',
            fontFamily: "'Segoe UI', sans-serif",
            textAlign: 'center',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: COL.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <i className="fas fa-car" style={{ color: COL.bg, fontSize: '13px' }}></i>
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>MagCar Auto Shop</span>
            </div>
            <p style={{ fontSize: '12px', margin: '0 0 4px' }}>Accesorios y Luces Automotrices</p>
            <p style={{ fontSize: '11px', margin: 0, color: 'rgba(255,255,255,0.35)' }}>© 2026 MagCar Auto Shop. Todos los derechos reservados.</p>
        </footer>
    )
}