import { useNavigate } from 'react-router-dom';

export default function StaffSelection() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '2rem'
        }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', borderTop: '4px solid var(--secondary)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(235, 126, 0, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-4)',
                        fontSize: '2.5rem'
                    }}>
                        👤
                    </div>
                    <h1 style={{ color: 'var(--gray-900)', marginBottom: 'var(--spacing-2)' }}>
                        Portal de Personal
                    </h1>
                    <p style={{ color: 'var(--gray-600)' }}>
                        Selecciona tu nivel de acceso para continuar
                    </p>
                </div>

                <div style={{ display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {/* Admin Option */}
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="btn"
                        style={{
                            height: 'auto',
                            padding: 'var(--spacing-6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-3)',
                            backgroundColor: 'white',
                            border: '2px solid var(--gray-200)',
                            color: 'var(--gray-900)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--secondary)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gray-200)';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>💎</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Administrador</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 400 }}>Gestión total y reportes</div>
                        </div>
                    </button>

                    {/* Collector Option */}
                    <button
                        onClick={() => navigate('/cobrador/login')}
                        className="btn"
                        style={{
                            height: 'auto',
                            padding: 'var(--spacing-6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-3)',
                            backgroundColor: 'white',
                            border: '2px solid var(--gray-200)',
                            color: 'var(--gray-900)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gray-200)';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>💼</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Cobrador</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 400 }}>Gestión de rutas y pagos</div>
                        </div>
                    </button>
                </div>

                <div style={{
                    marginTop: 'var(--spacing-8)',
                    paddingTop: 'var(--spacing-6)',
                    borderTop: '1px solid var(--gray-200)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                        MIRAMAX Collections System v1.1
                    </p>
                </div>
            </div>
        </div>
    );
}
