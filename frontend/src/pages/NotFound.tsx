export default function NotFound() {
    return (
        <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '4rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>404</h1>
                <h2>Página no encontrada</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                    La página que buscas no existe.
                </p>
                <div style={{ marginTop: '2rem' }}>
                    <a href="/consulta" className="btn btn-primary">
                        Volver al inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
