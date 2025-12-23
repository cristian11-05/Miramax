import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { regions, getProvinces, getDistricts } from '../../data/ubigeo';
import ZoneAssignmentModal from '../../components/admin/ZoneAssignmentModal';

interface Collector {
    id: number;
    username: string;
    full_name: string;
    dni: string;
    phone: string;
    zone: string;
    status: string;
    assigned_clients: number;
    month_collection: string;
}

export default function CollectorManagement() {
    const navigate = useNavigate();
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentCollector, setAssignmentCollector] = useState<Collector | null>(null);
    const [editingCollector, setEditingCollector] = useState<Collector | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        dni: '',
        phone: '',
        zone: '',
        status: 'active'
    });

    useEffect(() => {
        loadCollectors();
    }, []);

    const loadCollectors = async () => {
        try {
            const response = await api.get('/admin/collectors');
            setCollectors(response.data.collectors);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar cobradores:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCollector) {
                // Update
                await api.put(`/admin/collectors/${editingCollector.id}`, formData);
            } else {
                // Create
                await api.post('/admin/collectors', formData);
            }
            setShowModal(false);
            setEditingCollector(null);
            resetForm();
            loadCollectors();
        } catch (error) {
            console.error('Error al guardar cobrador:', error);
            alert('Error al guardar cobrador');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este cobrador?')) return;
        try {
            await api.delete(`/admin/collectors/${id}`);
            loadCollectors();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar cobrador');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            fullName: '',
            dni: '',
            phone: '',
            zone: '',
            status: 'active'
        });
    };

    const openEditModal = (collector: Collector) => {
        setEditingCollector(collector);
        setFormData({
            username: collector.username,
            password: '', // Leave empty to not change
            fullName: collector.full_name,
            dni: collector.dni,
            phone: collector.phone,
            zone: collector.zone || '',
            status: collector.status
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-4 text-center">Cargando...</div>;

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="gradient-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1 className="page-title">Gestión de Cobradores</h1>
                            <div className="header-subtitle">
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="back-button"
                                >
                                    ← Volver al Dashboard
                                </button>
                                <span className="header-description">Administración de personal de campo</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setEditingCollector(null);
                                resetForm();
                                setShowModal(true);
                            }}
                            className="action-button"
                        >
                            + Nuevo Cobrador
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Lista de Cobradores */}
                <div className="card table-container">
                    <div className="table-scroll">
                        <table className="table table-full-width">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-th-dni">Cobrador</th>
                                    <th className="table-th-plan">DNI / Usuario</th>
                                    <th className="table-th-location">Zona Asignada</th>
                                    <th className="table-th-cost">Clientes</th>
                                    <th className="table-th-status">Cobro Mes</th>
                                    <th className="table-th-status">Estado</th>
                                    <th className="table-th-actions">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collectors.map((collector) => (
                                    <tr key={collector.id}>
                                        <td className="cell-dni">
                                            <div className="font-semibold">{collector.full_name}</div>
                                        </td>
                                        <td>
                                            <div className="text-xs text-gray-500">@{collector.username}</div>
                                            <div className="text-xs text-gray-500">DNI: {collector.dni}</div>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            {collector.zone ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {collector.zone.split(', ').map((z, idx) => (
                                                        <span key={idx} className="badge badge-info" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                                                            {z}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">- Sin Zona -</span>
                                            )}
                                        </td>
                                        <td className="text-center">{collector.assigned_clients}</td>
                                        <td className="text-center font-semibold text-success">
                                            S/ {collector.month_collection || '0.00'}
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge badge-${collector.status === 'active' ? 'success' : 'error'}`}>
                                                {collector.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="cell-actions">
                                            <button
                                                onClick={() => {
                                                    setAssignmentCollector(collector);
                                                    setShowAssignmentModal(true);
                                                }}
                                                className="btn btn-sm btn-outline-primary mr-2"
                                                title="Asignar Ruta"
                                                style={{ border: '1px solid #FF6600', color: '#FF6600' }}
                                            >
                                                📍 Ruta
                                            </button>
                                            <button
                                                onClick={() => openEditModal(collector)}
                                                className="btn btn-sm btn-outline mr-2"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(collector.id)}
                                                className="btn btn-sm btn-outline-error"
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingCollector ? 'Editar Cobrador' : 'Nuevo Cobrador'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="modal-close-button" aria-label="Cerrar modal">
                                    &times;
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-body">
                                {!editingCollector && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Usuario</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                required
                                                aria-label="Usuario"
                                                title="Ingrese el nombre de usuario"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Contraseña</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                aria-label="Contraseña"
                                            />
                                        </div>
                                    </>
                                )}
                                {editingCollector && (
                                    <div className="form-group">
                                        <label className="form-label">Contraseña (dejar en blanco para no cambiar)</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            aria-label="Nueva contraseña"
                                            placeholder="Nueva contraseña (opcional)"
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                        aria-label="Nombre completo"
                                    />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">DNI</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.dni}
                                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                            maxLength={8}
                                            aria-label="DNI"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            aria-label="Teléfono"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Zona de Asignación (Ubicación)</label>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <select
                                            className="form-input"
                                            value={formData.zone.split(' - ')[0] || ''} // Try to parse existing zone
                                            onChange={e => {
                                                const region = e.target.value;
                                                setFormData({ ...formData, zone: region }); // Reset to just region
                                            }}
                                            aria-label="Seleccionar Región"
                                            title="Seleccione la región"
                                        >
                                            <option value="">Seleccione Región</option>
                                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>

                                        {formData.zone.split(' - ')[0] && (
                                            <select
                                                className="form-input"
                                                value={formData.zone.split(' - ')[1] || ''}
                                                onChange={e => {
                                                    const parts = formData.zone.split(' - ');
                                                    const region = parts[0];
                                                    const province = e.target.value;
                                                    setFormData({ ...formData, zone: `${region} - ${province}` });
                                                }}
                                                aria-label="Seleccionar Provincia"
                                                title="Seleccione la provincia"
                                            >
                                                <option value="">Seleccione Provincia (Todas)</option>
                                                {getProvinces(formData.zone.split(' - ')[0]).map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        )}

                                        {formData.zone.split(' - ')[1] && (
                                            <select
                                                className="form-input"
                                                value={formData.zone.split(' - ')[2] || ''}
                                                onChange={e => {
                                                    const parts = formData.zone.split(' - ');
                                                    const region = parts[0];
                                                    const province = parts[1];
                                                    const district = e.target.value;
                                                    setFormData({ ...formData, zone: `${region} - ${province} - ${district}` });
                                                }}
                                                aria-label="Seleccionar Distrito"
                                                title="Seleccione el distrito"
                                            >
                                                <option value="">Seleccione Distrito (Todos)</option>
                                                {getDistricts(formData.zone.split(' - ')[0], formData.zone.split(' - ')[1]).map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        )}
                                        <small className="text-gray-500 text-sm">Zona Actual: {formData.zone || 'No asignada'}</small>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado</label>
                                    <select
                                        className="form-input"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        aria-label="Estado del cobrador"
                                        title="Estado"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Modal de Asignación de Ruta */}
                {showAssignmentModal && assignmentCollector && (
                    <ZoneAssignmentModal
                        collector={assignmentCollector}
                        onClose={() => setShowAssignmentModal(false)}
                        onSuccess={() => {
                            setShowAssignmentModal(false);
                            loadCollectors();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
