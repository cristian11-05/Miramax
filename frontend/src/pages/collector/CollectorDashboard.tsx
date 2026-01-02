import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import html2canvas from 'html2canvas';
import './CollectorDashboard.css';
import VoiceAssistant from '../../components/collector/VoiceAssistant';

interface Client {
    id: number;
    dni: string;
    full_name: string;
    phone: string;
    address: string;
    district: string;
    caserio: string;
    zone?: string;
    sector?: string;
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

    // Filters
    const [selectedSector, setSelectedSector] = useState('all');
    const [selectedZone, setSelectedZone] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

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
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            } as any);
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

    // Derived metadata for filters
    const uniqueSectors = Array.from(new Set(clients.map(c => c.sector).filter(Boolean)));
    const uniqueZones = Array.from(new Set(clients.map(c => c.zone).filter(Boolean)));

    const filteredClients = clients.filter(c => {
        const searchMatch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.dni.includes(searchTerm);
        const sectorMatch = selectedSector === 'all' || c.sector === selectedSector;
        const zoneMatch = selectedZone === 'all' || c.zone === selectedZone;
        const statusMatch = selectedStatus === 'all' || c.service_status === selectedStatus;
        return searchMatch && sectorMatch && zoneMatch && statusMatch;
    });

    const groupedClients = filteredClients.reduce((acc, client) => {
        const key = `${client.district} - ${client.caserio}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(client);
        return acc;
    }, {} as Record<string, Client[]>);

    return (
        <div className="collector-wrapper">
            <header className="collector-header">
                <div className="container header-flex">
                    <div>
                        <h1 className="header-title">MIRAMAX COLLECTIONS</h1>
                        <p className="header-sub">Bienvenido, <strong>{user?.fullName}</strong></p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <main className="container">
                <div className="stats-grid">
                    <div className="stat-card dark">
                        <span className="stat-label">Hoy recolectado</span>
                        <h2 className="stat-value">S/ {stats.todayTotal}</h2>
                    </div>
                    <div className="stat-card orange">
                        <span className="stat-label">Meta del Mes</span>
                        <h2 className="stat-value">S/ {stats.monthTotal}</h2>
                    </div>
                    <div className="stat-card blue">
                        <span className="stat-label">Visitas hoy</span>
                        <h2 className="stat-value">{stats.todayVisits}</h2>
                    </div>
                </div>

                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o DNI..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filters-container">
                    <select
                        className="filter-select"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        aria-label="Filtrar por sector"
                    >
                        <option value="all">Todos los Sectores</option>
                        {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className="filter-select"
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        aria-label="Filtrar por zona"
                    >
                        <option value="all">Todas las Zonas</option>
                        {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>

                    <select
                        className="filter-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        aria-label="Filtrar por estado"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="active">Activos</option>
                        <option value="suspended">Suspendidos</option>
                        <option value="retired">Retirados</option>
                    </select>
                </div>

                {Object.entries(groupedClients).map(([location, list]) => (
                    <div key={location}>
                        <div className="group-header">
                            <span>📍</span> {location}
                            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', color: '#94A3B8' }}>{list.length}</span>
                        </div>
                        <div className="client-grid">
                            {list.map(client => (
                                <div key={client.id} className="client-card hover-lift">
                                    <div className="client-header">
                                        <div>
                                            <h3 className="client-name">{client.full_name}</h3>
                                            <span className="client-dni">DNI: {client.dni} • 📱 {client.phone}</span>
                                        </div>
                                        <span className={`status-badge ${client.service_status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                            {client.service_status}
                                        </span>
                                    </div>

                                    <div className="plan-info">
                                        <div className="plan-label">Servicio Contratado</div>
                                        <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{client.plan} {client.internet_speed}</div>
                                        <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Costo: S/ {client.cost} • Dir: {client.address}</div>
                                    </div>

                                    <div className="debt-section">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>ESTADO DE CUENTA</span>
                                            {parseFloat(client.total_debt) > 0 ? (
                                                <span className="debt-value debt-red">S/ {client.total_debt}</span>
                                            ) : (
                                                <span className="debt-value debt-green">AL DÍA ✓</span>
                                            )}
                                        </div>
                                        {parseFloat(client.total_debt) > 0 && (
                                            <button
                                                onClick={() => openPaymentModal(client)}
                                                className="cobrar-btn"
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
                <div className="modal-overlay">
                    <div className="modal-content fade-in">
                        {!receiptData ? (
                            <>
                                <div className="modal-header">
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 800 }}>Registrar Cobro</h3>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>{selectedClient.full_name}</p>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} className="close-modal-btn">✕</button>
                                </div>
                                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>TOTAL A RECAUDAR</span>
                                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#FF6600', margin: 0 }}>S/ {clientDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}</h2>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                        <button onClick={() => setPaymentMethod('cash')} className={`btn-badge ${paymentMethod === 'cash' ? 'active-orange' : ''}`}>
                                            <span style={{ fontSize: '1.5rem' }}>💵</span> Efectivo
                                        </button>
                                        <button onClick={() => setPaymentMethod('yape')} className={`btn-badge ${paymentMethod === 'yape' ? 'active-purple' : ''}`}>
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
                                    <button onClick={() => setSelectedClient(null)} className="logout-btn" style={{ flex: 1, padding: '1.25rem' }}>Cancelar</button>
                                    <button
                                        onClick={handleRegisterPayment}
                                        disabled={processing || clientDebts.length === 0}
                                        className="cobrar-btn"
                                        style={{ flex: 2 }}
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
                                    <button onClick={handleWhatsAppReceipt} className="cobrar-btn" style={{ backgroundColor: '#25D366', boxShadow: '0 8px 16px -4px rgba(37, 211, 102, 0.3)' }}>Enviar por WhatsApp</button>
                                    <button onClick={handleDownloadReceipt} className="cobrar-btn" style={{ backgroundColor: '#3B82F6', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)' }}>Descargar Recibo</button>
                                    <button onClick={() => setSelectedClient(null)} className="logout-btn" style={{ width: '100%', padding: '1rem' }}>Cerrar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <VoiceAssistant />
        </div>
    );
}
