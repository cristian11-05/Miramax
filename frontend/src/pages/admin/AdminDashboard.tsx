import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalClients: 0,
        totalCollectors: 0,
        pendingPayments: 0,
        totalDebt: '0'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const userType = localStorage.getItem('userType');

        if (!userData || userType !== 'admin') {
            navigate('/admin/login');
            return;
        }

        setUser(JSON.parse(userData));
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [clientsRes, collectorsRes, paymentsRes] = await Promise.all([
                api.get('/admin/clients'),
                api.get('/admin/collectors'),
                api.get('/admin/payments?status=pending')
            ]);

            setStats({
                totalClients: clientsRes.data.clients.length,
                totalCollectors: collectorsRes.data.collectors.length,
                pendingPayments: paymentsRes.data.payments.length,
                totalDebt: '0' // Calcular del backend
            });

            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-50)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white',
                padding: 'var(--spacing-4) 0',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
                        <div>
                            <h2 style={{ color: 'white', marginBottom: 'var(--spacing-1)' }}>
                                Panel Administrativo MIRAMAX
                            </h2>
                            <p style={{ opacity: 0.9 }}>
                                {user?.fullName} · {user?.role}
                            </p>
                        </div>
                        <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-4)',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>👥</div>
                        <p style={{ opacity: 0.9, marginBottom: 'var(--spacing-2)' }}>Total Clientes</p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            {stats.totalClients}
                        </p>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>🚶</div>
                        <p style={{ opacity: 0.9, marginBottom: 'var(--spacing-2)' }}>Total Cobradores</p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            {stats.totalCollectors}
                        </p>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>⏳</div>
                        <p style={{ opacity: 0.9, marginBottom: 'var(--spacing-2)' }}>Pagos Pendientes</p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            {stats.pendingPayments}
                        </p>
                    </div>
                </div>

                {/* Módulos de Gestión */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Módulos de Gestión</h3>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-4)',
                        padding: 'var(--spacing-4)'
                    }}>
                        <ModuleButton icon="👥" title="Clientes" description="Gestionar clientes" onClick={() => navigate('/admin/clients')} />
                        <ModuleButton icon="🚶" title="Cobradores" description="Gestionar cobradores" onClick={() => navigate('/admin/collectors')} />
                        <ModuleButton icon="💰" title="Deudas" description="Crear y gestionar deudas" />
                        <ModuleButton icon="✅" title="Pagos" description="Verificar pagos" onClick={() => navigate('/admin/payments/verification')} />
                        <ModuleButton icon="⚙️" title="Configuración" description="Yape y WhatsApp" />
                        <ModuleButton icon="📊" title="Reportes" description="Estadísticas" />
                    </div>
                </div>

                {/* Info */}
                <div className="alert alert-info" style={{ marginTop: 'var(--spacing-6)' }}>
                    <strong>ℹ️ Información:</strong> Los módulos completos estarán disponibles próximamente.
                    Por ahora puedes gestionar todos los recursos mediante la API REST.
                </div>
            </div>
        </div>
    );
}

function ModuleButton({ icon, title, description, onClick }: { icon: string; title: string; description: string; onClick?: () => void }) {
    return (
        <button className="card" onClick={onClick} style={{
            border: '2px solid var(--gray-200)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            padding: 'var(--spacing-5)',
            textAlign: 'center'
        }}
            onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-200)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>{icon}</div>
            <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{title}</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                {description}
            </p>
        </button>
    );
}
