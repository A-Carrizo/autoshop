import Layout from '../components/layout/Layout'

export default function Dashboard() {
    return (
        <Layout titulo="Dashboard">

            {/* Tarjetas de estadísticas */}
            <div className="row mb-4">

                {/* Ventas del día */}
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Ventas del día
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dark)' }}>₲ 0</div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-cash-register fa-2x" style={{ color: '#e0e0e0' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Productos en stock */}
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{ borderLeft: '4px solid var(--secondary)' }}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Productos en stock
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dark)' }}>0</div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-box fa-2x" style={{ color: '#e0e0e0' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ventas del mes */}
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{ borderLeft: '4px solid var(--dark)' }}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dark)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Ventas del mes
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dark)' }}>₲ 0</div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-chart-line fa-2x" style={{ color: '#e0e0e0' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock bajo */}
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card shadow h-100 py-2" style={{ borderLeft: '4px solid #f6c23e' }}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f6c23e', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Stock bajo
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dark)' }}>0</div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-exclamation-triangle fa-2x" style={{ color: '#e0e0e0' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Últimas ventas */}
            <div className="card shadow mb-4">
                <div className="card-header py-3" style={{ backgroundColor: 'var(--dark)', color: 'white' }}>
                    <h6 className="m-0 font-weight-bold">Últimas ventas</h6>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead style={{ backgroundColor: 'var(--dark)', color: 'white' }}>
                                <tr>
                                    <th>N° Factura</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center text-muted py-4">
                                        No hay ventas registradas aún
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </Layout>
    )
}