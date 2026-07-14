import { Link } from 'react-router-dom'

const COL = {
    headerBg: '#1a1a1a',
    accent: '#CC0000',
    accentDark: '#111111',
}

export default function HeaderSimple() {
    return (
        <header style={{
            background: COL.headerBg,
            borderBottom: `3px solid ${COL.accent}`,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Segoe UI', sans-serif",
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: COL.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <i className="fas fa-car" style={{ color: '#fff', fontSize: '18px' }}></i>
                </div>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px' }}>MagCar</span>
            </Link>
        </header>
    )
}