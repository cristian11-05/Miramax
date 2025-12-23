import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const styles = {
    wrapper: { minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: '3rem' },
    header: {
        background: 'linear-gradient(135deg, #FF6600 0%, #CC5200 100%)',
        color: 'white',
        padding: '2.5rem 0',
        marginBottom: '2.5rem',
        boxShadow: '0 4px 20px rgba(255,102,0,0.2)',
        position: 'relative' as const,
        overflow: 'hidden' as const
    },
    headerDecoration: {
        position: 'absolute' as const,
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        pointerEvents: 'none' as const
    },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1.5rem' },
    headerTitleBox: { animation: 'fadeInLeft 0.5s ease-out' },
    headerTitle: { color: 'white', marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' },
    headerUser: { display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.9 },
    onlineDot: { width: '10px', height: '10px', backgroundColor: '#4ADE80', borderRadius: '50%' },
    roleBadge: { textTransform: 'uppercase' as const, fontSize: '0.8rem' },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(5px)',
        fontWeight: 600,
        padding: '0.6rem 1.2rem',
        borderRadius: '0.75rem',
        transition: 'all 0.2s'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
        animation: 'fadeInUp 0.6s ease-out'
    },
    moduleHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
    moduleTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' },
    moduleBadge: { fontSize: '0.85rem', color: '#6b7280', backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid #e5e7eb' },
    moduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.25rem'
    }
};

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
        loadData(); // Carga inicial

        // Polling cada 5 segundos para tiempo real
        const intervalId = setInterval(loadData, 5000);

        return () => clearInterval(intervalId);
    }, [navigate]);

    const loadData = async () => {
        try {
            // Usamos el endpoint específico de dashboard que es más eficiente
            // y ya devuelve el conteo correcto de pendientes
            const { data } = await api.get('/admin/dashboard');

            setStats({
                totalClients: data.totalClients,
                totalCollectors: data.totalCollectors,
                pendingPayments: data.pendingPayments,
                totalDebt: '0' // El backend podría calcularlo si fuera necesario
            });

            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            // No detenemos el loading si falla una actualización en background
            if (loading) setLoading(false);
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
        <div style={styles.wrapper}>
            {/* Header Rediseñado */}
            <div style={styles.header}>
                <div style={styles.headerDecoration}></div>
                <div className="container">
                    <div style={styles.headerContent}>
                        <div style={styles.headerTitleBox}>
                            <h1 style={styles.headerTitle}>
                                Panel Administrativo MIRAMAX
                            </h1>
                            <div style={styles.headerUser}>
                                <div style={styles.onlineDot}></div>
                                <span>{user?.fullName} · <strong style={styles.roleBadge}>{user?.role}</strong></span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn"
                            style={styles.logoutBtn}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Stats Cards Modernizadas */}
                <div style={styles.statsGrid}>
                    <StatCard
                        icon="👥"
                        title="Total Clientes"
                        value={stats.totalClients}
                        gradient="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                        delay="0s"
                    />
                    <StatCard
                        icon="🏍️"
                        title="Total Cobradores"
                        value={stats.totalCollectors}
                        gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                        delay="0.1s"
                    />
                    <StatCard
                        icon="⏳"
                        title="Pagos por Verificar"
                        value={stats.pendingPayments}
                        gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                        delay="0.2s"
                    />
                </div>

                {/* Módulos de Gestión */}
                <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
                    <div style={styles.moduleHeader}>
                        <h2 style={styles.moduleTitle}>Módulos de Gestión</h2>
                        <span style={styles.moduleBadge}>
                            6 Módulos Activos
                        </span>
                    </div>

                    <div style={styles.moduleGrid}>
                        <ModuleButton
                            icon="👥"
                            title="Clientes"
                            description="Altas, bajas y edición"
                            onClick={() => navigate('/admin/clients')}
                            color="#3B82F6"
                        />
                        <ModuleButton
                            icon="🏍️"
                            title="Cobradores"
                            description="Personal de campo"
                            onClick={() => navigate('/admin/collectors')}
                            color="#10B981"
                        />
                        <ModuleButton
                            icon="💰"
                            title="Deudas"
                            description="Generación de cuotas"
                            onClick={() => navigate('/admin/debts')}
                            color="#EF4444"
                        />
                        <ModuleButton
                            icon="✅"
                            title="Pagos"
                            description="Validación de Yape"
                            onClick={() => navigate('/admin/payments/verification')}
                            color="#8B5CF6"
                        />
                        <ModuleButton
                            icon="⚙️"
                            title="Configuración"
                            description="Yape y WhatsApp"
                            onClick={() => navigate('/admin/config')}
                            color="#6B7280"
                        />
                        <ModuleButton
                            icon="📈"
                            title="Reportes"
                            description="Métricas de cobro"
                            onClick={() => navigate('/admin/reports')}
                            color="#F59E0B"
                        />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

function StatCard({ icon, title, value, gradient, delay }: { icon: string; title: string; value: number | string; gradient: string; delay: string }) {
    return (
        <div className="card" style={{
            background: gradient,
            color: 'white',
            border: 'none',
            borderRadius: '1.25rem',
            padding: '1.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            animation: `fadeInUp 0.6s ease-out forwards`,
            animationDelay: delay,
            opacity: 0
        }}>
            <div style={{
                fontSize: '2.5rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1rem'
            }}>
                {icon}
            </div>
            <div>
                <p style={{ opacity: 0.9, marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 500 }}>{title}</p>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function ModuleButton({ icon, title, description, onClick, color }: { icon: string; title: string; description: string; onClick?: () => void; color: string }) {
    return (
        <button
            onClick={onClick}
            className="card"
            style={{
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 12px 20px -5px ${color}20`;
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{
                fontSize: '2.5rem',
                marginBottom: '0.5rem',
                backgroundColor: `${color}10`,
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1rem',
                color: color
            }}>
                {icon}
            </div>
            <h4 style={{ margin: 0, color: '#1f2937', fontWeight: 700 }}>{title}</h4>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                {description}
            </p>
        </button>
    );
}
