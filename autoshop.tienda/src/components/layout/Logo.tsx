import { Link } from 'react-router-dom'

// Logo de la tienda, compartido por los headers y el footer
export default function Logo() {
    return (
        <Link to="/" className="mc-logo" aria-label="MagCar - Inicio">
            MAG<span className="mc-logo__acento">CAR</span>
        </Link>
    )
}
