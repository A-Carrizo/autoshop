import { useIdioma } from '../../context/IdiomaContext'

const COL = { bg: '#1a1a1a', accent: '#CC0000' }

export default function Footer() {
    const { t } = useIdioma()
    return (
        <footer style={{ background: COL.bg, color: 'rgba(255,255,255,0.6)', padding: '32px 24px 20px', marginTop: '48px', fontFamily: "'Segoe UI', sans-serif", textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: COL.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-car" style={{ color: '#fff', fontSize: '13px' }}></i>
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>MagCar Auto Shop</span>
            </div>
            <p style={{ fontSize: '12px', margin: '0 0 4px' }}>{t.accesorios}</p>
            <p style={{ fontSize: '11px', margin: 0, color: 'rgba(255,255,255,0.35)' }}>{t.derechos}</p>
        </footer>
    )
}