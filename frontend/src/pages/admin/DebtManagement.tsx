import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Debt {
    id: number;
    client_id: number;
    month: string;
    year: number;
    amount: number;
    status: 'pending' | 'paid' | 'in_review';
    due_date: string;
    client_name?: string;
}

const styles = {
    pageWrapper: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' },
    headerActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    backBtn: { marginBottom: '1rem', backgroundColor: '#fff', border: '1px solid #e5e7eb' },
    pageTitle: { fontSize: '2rem', fontWeight: 800, margin: 0, color: '#111827' },
    newBtn: { borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontWeight: 600 },
    filterCard: { padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' as const },
    searchInput: { flex: 1, minWidth: '250px' },
    statusSelect: { width: '200px' },
    roundedInput: { borderRadius: '0.75rem' },
    tableCard: { borderRadius: '1rem', overflow: 'hidden' as const, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    tableHeaderCell: { padding: '1rem', textAlign: 'left' as const, fontWeight: 600, color: '#64748b' },
    tableHeaderCellCenter: { padding: '1rem', textAlign: 'center' as const, fontWeight: 600, color: '#64748b' },
    tableCell: { padding: '1rem' },
    tableCellBold: { padding: '1rem', fontWeight: 600 },
    tableCellPrice: { padding: '1rem', fontWeight: 700, color: '#10b981' },
    tableCellMuted: { padding: '1rem', color: '#64748b' },
    statusBadge: (status: string) => ({
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: status === 'paid' ? '#dcfce7' : status === 'pending' ? '#fee2e2' : '#fef9c3',
        color: status === 'paid' ? '#166534' : status === 'pending' ? '#991b1b' : '#854d0e'
    }),
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { width: '90%', maxWidth: '500px', padding: '2rem', borderRadius: '1.5rem', position: 'relative' as const },
    closeModalBtn: { position: 'absolute' as const, top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' },
    submitBtn: { width: '100%', borderRadius: '0.75rem', padding: '0.8rem', fontWeight: 700 }
};

const DebtManagement: React.FC = () => {
    const navigate = useNavigate();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [formData, setFormData] = useState({
        clientId: '',
        month: '',
        year: new Date().getFullYear(),
        amount: '',
        dueDate: '',
        status: 'pending'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [debtsRes, clientsRes] = await Promise.all([
                api.get('/admin/debts'),
                api.get('/admin/clients')
            ]);

            // Unir datos de cliente con deudas para mostrar nombres
            const debtList = debtsRes.data.debts.map((d: any) => {
                const client = clientsRes.data.clients.find((c: any) => c.id === d.client_id);
                return { ...d, client_name: client ? client.full_name : 'Cliente desconocido' };
            });

            setDebts(debtList);
            setClients(clientsRes.data.clients);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDebt) {
                await api.put(`/admin/debts/${editingDebt.id}`, formData);
            } else {
                await api.post('/admin/debts', formData);
            }
            setShowModal(false);
            setEditingDebt(null);
            loadData();
        } catch (error) {
            console.error('Error saving debt:', error);
            alert('Error al guardar la deuda.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar esta deuda?')) return;
        try {
            await api.delete(`/admin/debts/${id}`);
            loadData();
        } catch (error) {
            alert('Error al eliminar deuda.');
        }
    };

    const openCreateModal = () => {
        setEditingDebt(null);
        setFormData({
            clientId: '',
            month: new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()),
            year: new Date().getFullYear(),
            amount: '',
            dueDate: '',
            status: 'pending'
        });
        setShowModal(true);
    };

    const openEditModal = (debt: Debt) => {
        setEditingDebt(debt);
        setFormData({
            clientId: debt.client_id.toString(),
            month: debt.month,
            year: debt.year,
            amount: debt.amount.toString(),
            dueDate: debt.due_date ? new Date(debt.due_date).toISOString().split('T')[0] : '',
            status: debt.status
        });
        setShowModal(true);
    };

    const filteredDebts = debts.filter(d => {
        const matchesSearch = d.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Cargando deudas...</div>;

    return (
        <div style={styles.pageWrapper}>
            <div className="container">
                <div style={styles.headerActions}>
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="btn"
                            style={styles.backBtn}
                            title="Volver al panel"
                        >
                            ← Volver
                        </button>
                        <h1 style={styles.pageTitle}>Gestión de Deudas</h1>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn btn-primary"
                        style={styles.newBtn}
                    >
                        + Nueva Deuda
                    </button>
                </div>

                {/* Filtros */}
                <div className="card" style={styles.filterCard}>
                    <div style={styles.searchInput}>
                        <input
                            id="search-client"
                            type="text"
                            className="form-control"
                            placeholder="Buscar por cliente..."
                            title="Buscar por cliente"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.roundedInput}
                        />
                    </div>
                    <div style={styles.statusSelect}>
                        <select
                            id="filter-status"
                            className="form-control"
                            title="Filtrar por estado"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={styles.roundedInput}
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="paid">Pagadas</option>
                            <option value="in_review">En revisión</option>
                        </select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="card" style={styles.tableCard}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeaderCell}>Cliente</th>
                                    <th style={styles.tableHeaderCell}>Periodo</th>
                                    <th style={styles.tableHeaderCell}>Monto</th>
                                    <th style={styles.tableHeaderCell}>Vencimiento</th>
                                    <th style={styles.tableHeaderCell}>Estado</th>
                                    <th style={styles.tableHeaderCellCenter}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDebts.map(debt => (
                                    <tr key={debt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={styles.tableCellBold}>
                                            <div>{debt.client_name}</div>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <span style={{ textTransform: 'capitalize' }}>{debt.month}</span> {debt.year}
                                        </td>
                                        <td style={styles.tableCellPrice}>
                                            S/ {Number(debt.amount).toFixed(2)}
                                        </td>
                                        <td style={styles.tableCellMuted}>
                                            {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={styles.tableCell}>
                                            <span style={styles.statusBadge(debt.status)}>
                                                {debt.status === 'paid' ? 'PAGADO' : debt.status === 'pending' ? 'PENDIENTE' : 'EN REVISIÓN'}
                                            </span>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => openEditModal(debt)}
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                                                    title="Editar deuda"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(debt.id)}
                                                    className="btn btn-sm"
                                                    style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                                                    title="Eliminar deuda"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDebts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No se encontraron deudas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div className="card" style={styles.modalContent}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={styles.closeModalBtn}
                            title="Cerrar modal"
                        >
                            ✕
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{editingDebt ? 'Editar Deuda' : 'Nueva Deuda'}</h2>

                        <form onSubmit={handleSave}>
                            {!editingDebt && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label htmlFor="client-select" className="form-label" style={{ fontWeight: 600 }}>Cliente</label>
                                    <select
                                        id="client-select"
                                        className="form-control"
                                        required
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        style={styles.roundedInput}
                                        title="Seleccionar cliente"
                                    >
                                        <option value="">Seleccionar cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.full_name} ({c.dni})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label htmlFor="month-select" className="form-label" style={{ fontWeight: 600 }}>Mes</label>
                                    <select
                                        id="month-select"
                                        className="form-control"
                                        required
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        style={styles.roundedInput}
                                        title="Seleccionar mes"
                                    >
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="year-input" className="form-label" style={{ fontWeight: 600 }}>Año</label>
                                    <input
                                        id="year-input"
                                        type="number"
                                        className="form-control"
                                        required
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        style={styles.roundedInput}
                                        title="Ingresar año"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="amount-input" className="form-label" style={{ fontWeight: 600 }}>Monto (S/)</label>
                                <input
                                    id="amount-input"
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    style={styles.roundedInput}
                                    placeholder="0.00"
                                    title="Monto de la deuda"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="due-date-input" className="form-label" style={{ fontWeight: 600 }}>Fecha de Vencimiento</label>
                                <input
                                    id="due-date-input"
                                    type="date"
                                    className="form-control"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    style={styles.roundedInput}
                                    title="Fecha de vencimiento"
                                />
                            </div>

                            {editingDebt && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label htmlFor="status-select" className="form-label" style={{ fontWeight: 600 }}>Estado</label>
                                    <select
                                        id="status-select"
                                        className="form-control"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        style={styles.roundedInput}
                                        title="Seleccionar estado"
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="paid">Pagado</option>
                                        <option value="in_review">En Revisión</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                                {editingDebt ? 'Actualizar Deuda' : 'Crear Deuda'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtManagement;
