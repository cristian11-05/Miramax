import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import html2canvas from 'html2canvas';

interface Client {
    id: number;
    dni: string;
    full_name: string;
    phone: string;
    address: string;
    district: string;
    caserio: string;
    zone?: string;
    plan_type?: string;
    plan: string;
    internet_speed?: string;
    cost: string;
    total_debt: string;
    service_status: string;
}

interface Debt {
    id: number;
    amount: string;
    month: string;
    year: string;
    status: string;
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        backgroundColor: '#0F172A', // Dark slate background
        color: '#F8FAFC',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        paddingBottom: '3rem',
    },
    header: {
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.25rem 0',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
    },
    headerFlex: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: '1.5rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #FF6600 0%, #FFA500 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
    },
    headerSub: {
        color: '#94A3B8',
        fontSize: '0.85rem',
        marginTop: '0.2rem',
    },
    logoutBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#F8FAFC',
        fontSize: '0.8rem',
        padding: '0.6rem 1.2rem',
        borderRadius: '12px',
        fontWeight: 600,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        padding: '2rem 0',
    },
    statCard: (color1: string, color2: string) => ({
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
    }),
    statLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    statValue: {
        fontSize: '2.25rem',
        fontWeight: 900,
        color: '#FFFFFF',
        margin: 0,
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    searchContainer: {
        marginBottom: '2.5rem',
        position: 'relative' as const,
    },
    searchInput: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem 1.25rem 3.5rem',
        fontSize: '1.1rem',
        color: '#F8FAFC',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    searchIcon: {
        position: 'absolute' as const,
        left: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '1.3rem',
        opacity: 0.5,
    },
    groupHeader: {
        padding: '1.5rem 0 1rem',
        fontSize: '1.2rem',
        fontWeight: 800,
        color: '#FF6600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '2px solid rgba(255, 102, 0, 0.2)',
        marginBottom: '1.5rem',
    },
    clientGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
    },
    clientCard: {
        backgroundColor: '#1E293B',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        cursor: 'default',
        position: 'relative' as const,
    },
    clientHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    clientName: {
        fontSize: '1.1rem',
        fontWeight: 700,
        color: '#F1F5F9',
        margin: 0,
    },
    clientDni: {
        fontSize: '0.8rem',
        color: '#94A3B8',
        fontWeight: 500,
    },
    planLabel: {
        fontSize: '0.7rem',
        fontWeight: 800,
        color: '#FF6600',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: '0.25rem',
    },
    planInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: '0.75rem 1rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 102, 0, 0.1)',
    },
    debtSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.5rem',
        padding: '1rem',
        borderRadius: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    debtValue: (isDebt: boolean) => ({
        fontSize: '1.25rem',
        fontWeight: 900,
        color: isDebt ? '#EF4444' : '#10B981',
    }),
    cobrarBtn: {
        width: '100%',
        padding: '1rem',
        borderRadius: '16px',
        fontWeight: 800,
        fontSize: '1rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        background: 'linear-gradient(135deg, #FF6600 0%, #E65C00 100%)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 16px -4px rgba(255, 102, 0, 0.4)',
    },
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
    },
    modal: {
        backgroundColor: '#1E293B',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    modalHeader: {
        padding: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(30, 41, 59, 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    btnBadge: (active: boolean, color: string) => ({
        flex: 1,
        padding: '1.25rem',
        borderRadius: '20px',
        border: `2px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
        backgroundColor: active ? `${color}15` : 'rgba(255,255,255,0.02)',
        color: active ? color : '#94A3B8',
        fontWeight: 800,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    }),
};

export default function CollectorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState({ todayTotal: "0.00", monthTotal: "0.00", todayVisits: 0 });
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientDebts, setClientDebts] = useState<Debt[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'yape'>('cash');
    const [processing, setProcessing] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userData || !token) {
            navigate('/cobrador/login');
            return;
        }
        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            navigate('/cobrador/login');
            return;
        }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [clientsRes, statsRes] = await Promise.all([
                api.get('/collector/clients'),
                api.get('/collector/stats')
            ]);
            setClients(clientsRes.data.clients || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('¿Desea cerrar sesión?')) {
            localStorage.clear();
            navigate('/cobrador/login');
        }
    };

    const openPaymentModal = async (client: Client) => {
        setSelectedClient(client);
        setClientDebts([]);
        setReceiptData(null);
        setPaymentMethod('cash');
        try {
            const res = await api.get(`/collector/clients/${client.id}/debts`);
            setClientDebts(res.data.debts || []);
        } catch (error) {
            alert('Error al cargar la deuda.');
        }
    };

    const handleRegisterPayment = async () => {
        if (!selectedClient || clientDebts.length === 0) return;
        setProcessing(true);
        try {
            const totalAmount = clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            const res = await api.post('/collector/payments', {
                clientId: selectedClient.id,
                amount: totalAmount,
                method: paymentMethod,
                debtIds: clientDebts.map(d => d.id)
            });
            setReceiptData({
                ...res.data.payment,
                clientName: selectedClient.full_name,
                collectorName: user?.fullName || 'Cobrador',
                debts: clientDebts
            });
            loadData();
        } catch (error) {
            alert('Error al registrar el pago.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (receiptRef.current) {
            const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `RECIBO-${receiptData.paymentId}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const handleWhatsAppReceipt = () => {
        const message = `*RECIBO MIRAMAX*\nRecibo: ${receiptData.paymentId}\nCliente: ${selectedClient?.full_name}\nMonto: S/ ${receiptData.amount}\n¡Gracias!`;
        window.open(`https://wa.me/51${selectedClient?.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.dni.includes(searchTerm)
    );

    const groupedClients = filteredClients.reduce((acc, client) => {
        const key = `${client.district} - ${client.caserio}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(client);
        return acc;
    }, {} as Record<string, Client[]>);

    return (
        <div style={styles.wrapper}>
            <header style={styles.header}>
                <div className="container" style={styles.headerFlex}>
                    <div>
                        <h1 style={styles.headerTitle}>MIRAMAX COLLECTIONS</h1>
                        <p style={styles.headerSub}>Bienvenido, <strong>{user?.fullName}</strong></p>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
                </div>
            </header>

            <main className="container">
                <div style={styles.statsGrid}>
                    <div style={styles.statCard('#1E293B', '#334155')}>
                        <span style={styles.statLabel}>Hoy recolectado</span>
                        <h2 style={styles.statValue}>S/ {stats.todayTotal}</h2>
                    </div>
                    <div style={styles.statCard('#FF6600', '#CC5200')}>
                        <span style={styles.statLabel}>Meta del Mes</span>
                        <h2 style={styles.statValue}>S/ {stats.monthTotal}</h2>
                    </div>
                    <div style={styles.statCard('#3B82F6', '#2563EB')}>
                        <span style={styles.statLabel}>Visitas hoy</span>
                        <h2 style={styles.statValue}>{stats.todayVisits}</h2>
                    </div>
                </div>

                <div style={styles.searchContainer}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o DNI..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {Object.entries(groupedClients).map(([location, list]) => (
                    <div key={location}>
                        <div style={styles.groupHeader}>
                            <span>📍</span> {location}
                            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', color: '#94A3B8' }}>{list.length}</span>
                        </div>
                        <div style={styles.clientGrid}>
                            {list.map(client => (
                                <div key={client.id} style={styles.clientCard} className="hover-lift">
                                    <div style={styles.clientHeader}>
                                        <div>
                                            <h3 style={styles.clientName}>{client.full_name}</h3>
                                            <span style={styles.clientDni}>DNI: {client.dni} • 📱 {client.phone}</span>
                                        </div>
                                        <span style={{
                                            backgroundColor: client.service_status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: client.service_status === 'active' ? '#10B981' : '#EF4444',
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                                        }}>
                                            {client.service_status}
                                        </span>
                                    </div>

                                    <div style={styles.planInfo}>
                                        <div style={styles.planLabel}>Servicio Contratado</div>
                                        <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{client.plan} {client.internet_speed}</div>
                                        <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Costo: S/ {client.cost} • Dir: {client.address}</div>
                                    </div>

                                    <div style={styles.debtSection}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>ESTADO DE CUENTA</span>
                                            {parseFloat(client.total_debt) > 0 ? (
                                                <span style={styles.debtValue(true)}>S/ {client.total_debt}</span>
                                            ) : (
                                                <span style={styles.debtValue(false)}>AL DÍA ✓</span>
                                            )}
                                        </div>
                                        {parseFloat(client.total_debt) > 0 && (
                                            <button
                                                onClick={() => openPaymentModal(client)}
                                                style={styles.cobrarBtn}
                                            >
                                                Cobrar Pago
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* Modal Logic preserved exactly as before */}
            {selectedClient && (
                <div style={styles.overlay}>
                    <div style={styles.modal} className="fade-in">
                        {!receiptData ? (
                            <>
                                <div style={styles.modalHeader}>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 800 }}>Registrar Cobro</h3>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>{selectedClient.full_name}</p>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                                </div>
                                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>TOTAL A RECAUDAR</span>
                                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#FF6600', margin: 0 }}>S/ {clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}</h2>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                        <button onClick={() => setPaymentMethod('cash')} style={styles.btnBadge(paymentMethod === 'cash', '#FF6600')}>
                                            <span style={{ fontSize: '1.5rem' }}>💵</span> Efectivo
                                        </button>
                                        <button onClick={() => setPaymentMethod('yape')} style={styles.btnBadge(paymentMethod === 'yape', '#742284')}>
                                            <span style={{ fontSize: '1.5rem' }}>📱</span> Yape
                                        </button>
                                    </div>

                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#94A3B8', marginBottom: '1rem', textTransform: 'uppercase' }}>Detalle de meses</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {clientDebts.map(d => (
                                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ fontWeight: 600 }}>{d.month} {d.year}</span>
                                                <span style={{ fontWeight: 800, color: '#FF6600' }}>S/ {parseFloat(d.amount).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setSelectedClient(null)} style={{ ...styles.logoutBtn, flex: 1, padding: '1.25rem' }}>Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        disabled={processing || clientDebts.length === 0}
                                        style={{ ...styles.cobrarBtn, flex: 2 }}
                                    >
                                        {processing ? 'Procesando...' : 'Confirmar Cobro'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Pago Registrado!</h3>

                                <div ref={receiptRef} style={{ padding: '2rem', backgroundColor: 'white', color: '#1E293B', textAlign: 'left', borderRadius: '4px', marginBottom: '2rem' }}>
                                    <div style={{ textAlign: 'center', borderBottom: '2px dashed #CBD5E1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>MIRAMAX INTERNET</h4>
                                        <small style={{ color: '#64748B' }}>RECIBO DE PAGO OFICIAL</small>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ID:</span><strong>{receiptData.paymentId}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FECHA:</span><strong>{receiptData.date}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CLIENTE:</span><strong>{receiptData.clientName}</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                                            <span>Monto Total:</span><strong>S/ {receiptData.amount}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button onClick={handleWhatsAppReceipt} style={{ ...styles.cobrarBtn, backgroundColor: '#25D366', boxShadow: '0 8px 16px -4px rgba(37, 211, 102, 0.3)', background: '#25D366' }}>Enviar por WhatsApp</button>
                                    <button onClick={handleDownloadReceipt} style={{ ...styles.cobrarBtn, backgroundColor: '#3B82F6', background: '#3B82F6', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)' }}>Descargar Recibo</button>
                                    <button onClick={() => setSelectedClient(null)} style={{ ...styles.logoutBtn, width: '100%', padding: '1rem' }}>Cerrar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
                .hover-lift:hover { transform: translateY(-8px); boxShadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); border-color: rgba(255, 102, 0, 0.3); }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                input::placeholder { color: #64748B; }
            `}</style>
        </div>
    );
}
