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
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        {!receiptData ? (
                            <>
                                <div className="modal-header">
                                    <h3 className="modal-title">Registrar Cobro</h3>
                                    <button onClick={closeTargetClient} className="btn-close">×</button>
                                </div>
                                <div className="modal-body">
                                    <p><strong>Cliente:</strong> {selectedClient.full_name}</p>
                                    <p><strong>Total a Pagar:</strong> S/ {clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}</p>

                                    <div style={{ marginTop: '1rem' }}>
                                        <label className="form-label">Método de Pago</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => setPaymentMethod('cash')}
                                                style={{ flex: 1 }}
                                            >
                                                💵 Efectivo
                                            </button>
                                            <button
                                                className={`btn ${paymentMethod === 'yape' ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => setPaymentMethod('yape')}
                                                style={{ flex: 1, backgroundColor: paymentMethod === 'yape' ? '#742284' : '' }}
                                            >
                                                📱 Yape
                                            </button>
                                        </div>
                                    </div>

                                    {clientDebts.length > 0 ? (
                                        <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', background: '#f9f9f9', padding: '0.5rem' }}>
                                            {clientDebts.map(debt => (
                                                <div key={debt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                                    <span>{debt.month} {debt.year}</span>
                                                    <strong>S/ {parseFloat(debt.amount).toFixed(2)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Cargando deudas...</p>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button onClick={closeTargetClient} className="btn btn-text">Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        className="btn btn-primary"
                                        disabled={processing || clientDebts.length === 0}
                                    >
                                        {processing ? 'Registrando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="modal-header" style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
                                    <div style={{ fontSize: '3rem' }}>✅</div>
                                </div>
                                <div className="modal-body" style={{ textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>¡Cobro Exitoso!</h3>
                                    <div className="card" style={{ background: '#f8f9fa', padding: '1.5rem', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Monto Cobrado</p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', margin: '0.5rem 0' }}>
                                            S/ {receiptData.amount.toFixed(2)}
                                        </p>
                                        <p style={{ marginBottom: 0 }}>{paymentMethod === 'cash' ? '💵 Efectivo' : '📱 Yape'}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '1rem' }}>
                                            Op: #{receiptData.paymentId} | {receiptData.date}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleWhatsAppReceipt}
                                        className="btn btn-success"
                                        style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        📲 Enviar Comprobante por WhatsApp
                                    </button>
                                </div>
                                <div className="modal-footer" style={{ justifyContent: 'center', border: 'none' }}>
                                    <button onClick={closeTargetClient} className="btn btn-outline">Cerrar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
