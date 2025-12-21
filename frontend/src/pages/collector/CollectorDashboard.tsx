import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Client {
    id: number;
    dni: string;
    full_name: string;
    phone: string;
    address: string;
    caserio: string;
    zone?: string;
    plan_type?: string;
    plan: string;
    internet_speed?: string;
    cost: string;
    total_debt: string;
    service_status: string;
}

export default function CollectorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState({ todayTotal: '0', monthTotal: '0', todayVisits: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const userType = localStorage.getItem('userType');

        if (!userData || userType !== 'collector') {
            navigate('/cobrador/login');
            return;
        }

        setUser(JSON.parse(userData));
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [clientsRes, statsRes] = await Promise.all([
                api.get('/collector/clients'),
                api.get('/collector/stats')
            ]);

            setClients(clientsRes.data.clients);
            setStats(statsRes.data);
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
        navigate('/cobrador/login');
    };

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientDebts, setClientDebts] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [receiptData, setReceiptData] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const openPaymentModal = async (client: Client) => {
        setSelectedClient(client);
        setClientDebts([]);
        setReceiptData(null);
        setPaymentMethod('cash');

        try {
            // Reusing public endpoint for convenience, or create specific collector endpoint
            const res = await api.get(`/client/check-debt/${client.dni}`);
            setClientDebts(res.data.pendingDebts);
        } catch (error) {
            console.error('Error fetching debts', error);
            alert('Error al cargar deudas del cliente');
        }
    };

    const handleRegisterPayment = async () => {
        if (!selectedClient) return;
        setProcessing(true);

        const totalAmount = clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const debtIds = clientDebts.map(d => d.id);

        try {
            const res = await api.post('/collector/payment', {
                clientId: selectedClient.id,
                amount: totalAmount,
                paymentMethod,
                debtIds
            });

            setReceiptData({
                success: true,
                paymentId: res.data.paymentId,
                amount: totalAmount,
                date: new Date().toLocaleString(),
                clientName: selectedClient.full_name,
                collectorName: user.fullName
            });

            // Refresh main list in background
            loadData();

        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Error al registrar cobro');
        } finally {
            setProcessing(false);
        }
    };

    const handleWhatsAppReceipt = () => {
        if (!receiptData || !selectedClient) return;

        const message = `
*COMPROBANTE DE PAGO - MIRAMAX* ✅

📅 *Fecha:* ${receiptData.date}
👤 *Cliente:* ${receiptData.clientName}
💰 *Monto Pagado:* S/ ${receiptData.amount.toFixed(2)}
💳 *Método:* ${paymentMethod === 'cash' ? 'Efectivo' : 'Yape'}
🆔 *Operación:* #${receiptData.paymentId}
🏍️ *Cobrador:* ${receiptData.collectorName}

*¡Gracias por su pago!*
        `.trim();

        const url = `https://wa.me/51${selectedClient.phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const closeTargetClient = () => {
        setSelectedClient(null);
        setReceiptData(null);
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
                backgroundColor: 'var(--secondary)',
                color: 'white',
                padding: 'var(--spacing-4) 0',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: 'white', marginBottom: 'var(--spacing-1)' }}>
                                Portal del Cobrador
                            </h2>
                            <p style={{ opacity: 0.8 }}>
                                Bienvenido, {user?.fullName}
                            </p>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
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
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-2)' }}>
                            Cobrado Hoy
                        </p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--primary)' }}>
                            S/ {stats.todayTotal}
                        </p>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-2)' }}>
                            Cobrado Este Mes
                        </p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--success)' }}>
                            S/ {stats.monthTotal}
                        </p>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-2)' }}>
                            Clientes Visitados Hoy
                        </p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--info)' }}>
                            {stats.todayVisits}
                        </p>
                    </div>
                </div>

                {/* Buscador */}
                <div className="card mb-4">
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o DNI..."
                        className="form-input"
                        onChange={(e) => {
                            const searchTerm = e.target.value;
                            if (searchTerm.length > 2 || searchTerm.length === 0) {
                                api.get(`/collector/clients?search=${searchTerm}`).then(res => setClients(res.data.clients));
                            }
                        }}
                    />
                </div>

                {/* Clientes Asignados */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Mis Clientes Asignados</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Ubicación</th>
                                    <th>Plan / Servicio</th>
                                    <th>Deuda Total</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                                            No se encontraron clientes
                                        </td>
                                    </tr>
                                ) : (
                                    clients.map((client) => (
                                        <tr key={client.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{client.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>DNI: {client.dni}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{client.phone}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{client.caserio || client.zone || '-'}</div>
                                                <div style={{ fontSize: '0.8rem' }}>{client.address}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{client.plan_type || 'SERVICIO'}</div>
                                                <div style={{ fontSize: '0.8rem' }}>{client.plan} {client.internet_speed}</div>
                                                <div style={{ fontSize: '0.8rem' }}>S/ {client.cost}</div>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {parseFloat(client.total_debt) > 0 ? (
                                                    <span style={{ color: 'var(--error)', fontWeight: 700, fontSize: '1.2rem' }}>
                                                        S/ {client.total_debt}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                        Al día
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <span className={`badge badge-${client.service_status === 'active' ? 'success' : 'error'}`}>
                                                    {client.service_status}
                                                </span>
                                            </td>
                                            <td>
                                                {parseFloat(client.total_debt) > 0 && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => openPaymentModal(client)}
                                                    >
                                                        Cobrar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Pago */}
            {selectedClient && (
                <div className="modal-overlay" style={{
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(0,0,0,0.6)'
                }}>
                    <div className="modal" style={{
                        maxWidth: '480px',
                        borderRadius: '1.5rem',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        animation: 'modalFadeIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)'
                    }}>
                        {!receiptData ? (
                            <>
                                <div className="modal-header" style={{
                                    padding: '1.5rem 2rem',
                                    borderBottom: '1px solid #f3f4f6',
                                    background: '#ffffff'
                                }}>
                                    <div>
                                        <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registrar Cobro</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Gestión de cobranza MIRAMAX</p>
                                    </div>
                                    <button onClick={closeTargetClient} className="btn-close" style={{ fontSize: '1.5rem' }}>✕</button>
                                </div>
                                <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
                                    <div style={{
                                        backgroundColor: '#f9fafb',
                                        padding: '1rem',
                                        borderRadius: '1rem',
                                        marginBottom: '1.5rem',
                                        border: '1px solid #f3f4f6'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Cliente:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedClient.full_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total a Pagar:</span>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                                S/ {clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>
                                            Método de Pago
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                className={`btn`}
                                                onClick={() => setPaymentMethod('cash')}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    borderRadius: '0.75rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                                                    backgroundColor: paymentMethod === 'cash' ? '#fff5f0' : 'white',
                                                    color: paymentMethod === 'cash' ? 'var(--primary)' : '#6b7280',
                                                    transition: 'all 0.2s',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>💵</span>
                                                Efectivo
                                            </button>
                                            <button
                                                className={`btn`}
                                                onClick={() => setPaymentMethod('yape')}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    borderRadius: '0.75rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    border: paymentMethod === 'yape' ? '2px solid #742284' : '2px solid #e5e7eb',
                                                    backgroundColor: paymentMethod === 'yape' ? '#f5e8f7' : 'white',
                                                    color: paymentMethod === 'yape' ? '#742284' : '#6b7280',
                                                    transition: 'all 0.2s',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>📱</span>
                                                Yape
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Detalle de Meses:</div>
                                    {clientDebts.length > 0 ? (
                                        <div style={{
                                            maxHeight: '160px',
                                            overflowY: 'auto',
                                            background: '#ffffff',
                                            padding: '0.5rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #f3f4f6'
                                        }}>
                                            {clientDebts.map(debt => (
                                                <div key={debt.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '0.75rem',
                                                    borderBottom: '1px solid #f9fafb',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span style={{ color: '#374151' }}>{debt.month} {debt.year}</span>
                                                    <strong style={{ color: '#111827' }}>S/ {parseFloat(debt.amount).toFixed(2)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
                                            <div className="spinner-mini" style={{ margin: '0 auto 0.5rem' }}></div>
                                            Cargando deudas...
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer" style={{
                                    padding: '1.25rem 2rem',
                                    background: '#f9fafb',
                                    borderTop: '1px solid #f3f4f6',
                                    gap: '1rem'
                                }}>
                                    <button onClick={closeTargetClient} className="btn" style={{
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontSize: '0.95rem'
                                    }}>Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        className="btn btn-primary"
                                        disabled={processing || clientDebts.length === 0}
                                        style={{
                                            flex: 1,
                                            padding: '0.85rem',
                                            borderRadius: '0.75rem',
                                            fontWeight: 700,
                                            boxShadow: '0 4px 12px rgba(255,102,0,0.2)'
                                        }}
                                    >
                                        {processing ? 'Registrando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="modal-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        backgroundColor: '#def7ec',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.5rem',
                                        fontSize: '2.5rem',
                                        color: '#0e9f6e'
                                    }}>
                                        ✓
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                                        ¡Cobro Exitoso!
                                    </h3>
                                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>El pago ha sido registrado correctamente en el sistema.</p>

                                    <div style={{
                                        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        marginBottom: '2rem',
                                        border: '1px solid #e5e7eb',
                                        position: 'relative'
                                    }}>
                                        <p style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Monto Cobrado</p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#046c4e', margin: '0' }}>
                                            S/ {receiptData.amount.toFixed(2)}
                                        </p>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: 'white',
                                            borderRadius: '2rem',
                                            fontSize: '0.8rem',
                                            color: '#374151',
                                            fontWeight: 600,
                                            marginTop: '0.5rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}>
                                            {paymentMethod === 'cash' ? '💵 Efectivo' : '📱 Yape'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleWhatsAppReceipt}
                                        className="btn"
                                        style={{
                                            width: '100%',
                                            marginBottom: '1rem',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            backgroundColor: '#25D366',
                                            color: 'white',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            transition: 'transform 0.2s',
                                            boxShadow: '0 4px 12px rgba(37,211,102,0.2)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>📲</span> Enviar Comprobante
                                    </button>

                                    <button onClick={closeTargetClient} className="btn" style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        color: '#6b7280',
                                        fontWeight: 600
                                    }}>
                                        Finalizar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .spinner-mini {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
