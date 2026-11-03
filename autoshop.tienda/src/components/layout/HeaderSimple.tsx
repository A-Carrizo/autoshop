import Logo from './Logo'

// Header reducido para login, registro y recuperacion de contraseña
export default function HeaderSimple() {
    return (
        <header className="mc-header">
            <div className="mc-container mc-header__barra mc-header__simple">
                <Logo />
            </div>
        </header>
    )
}
