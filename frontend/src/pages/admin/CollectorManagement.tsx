import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { regions, getProvinces, getDistricts, ubigeoData } from '../../data/ubigeo';
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

    const [isAddingNew, setIsAddingNew] = useState({
        region: false,
        province: false,
        district: false
    });

    const [tempInputs, setTempInputs] = useState({
        region: '',
        province: '',
        district: ''
    });

    // Sesión de datos aprendidos compartida con Clientes
    const [sessionLearnedData, setSessionLearnedData] = useState<Record<string, Record<string, string[]>>>(() => {
        const saved = localStorage.getItem('learned_ubigeo_client');
        return saved ? JSON.parse(saved) : {};
    });

    const [availableLocations, setAvailableLocations] = useState({
        regions: regions,
        getProvinces: (region: string) => getProvinces(region),
        getDistricts: (region: string, province: string) => getDistricts(region, province)
    });

    useEffect(() => {
        localStorage.setItem('learned_ubigeo_client', JSON.stringify(sessionLearnedData));
    }, [sessionLearnedData]);

    useEffect(() => {
        loadCollectors();
    }, []);

    useEffect(() => {
        // Empezamos con datos estáticos
        const learnedData = JSON.parse(JSON.stringify(ubigeoData));

        // Fusionar con datos aprendidos en la sesión (de Clientes)
        Object.keys(sessionLearnedData).forEach(r => {
            if (!learnedData[r]) learnedData[r] = {};
            Object.keys(sessionLearnedData[r]).forEach(p => {
                if (!learnedData[r][p]) learnedData[r][p] = [];
                sessionLearnedData[r][p].forEach(d => {
                    if (Array.isArray(learnedData[r][p])) {
                        if (!learnedData[r][p].includes(d)) learnedData[r][p].push(d);
                    } else if (typeof learnedData[r][p] === 'object') {
                        // @ts-ignore
                        if (!learnedData[r][p][d]) learnedData[r][p][d] = [];
                    }
                });
            });
        });

        setAvailableLocations({
            regions: Object.keys(learnedData),
            getProvinces: (region: string) => region && learnedData[region] ? Object.keys(learnedData[region]) : [],
            getDistricts: (region: string, province: string) =>
                region && province && learnedData[region]?.[province]
                    ? (Array.isArray(learnedData[region][province]) ? learnedData[region][province] : Object.keys(learnedData[region][province]))
                    : []
        });

    }, [collectors, sessionLearnedData]);

    const handleLocationChange = (level: 'region' | 'province' | 'district', value: string) => {
        const parts = formData.zone.split(' - ');
        let region = parts[0] || '';
        let province = parts[1] || '';
        let district = parts[2] || '';

        if (value === 'ADD_NEW') {
            setIsAddingNew(prev => ({ ...prev, [level]: true }));
            return;
        }

        if (level === 'region') {
            region = value;
            province = '';
            district = '';
        } else if (level === 'province') {
            province = value;
            district = '';
        } else {
            district = value;
        }

        const newZone = [region, province, district].filter(Boolean).join(' - ');
        setFormData(prev => ({ ...prev, zone: newZone }));
    };

    const confirmNewLocation = (level: 'region' | 'province' | 'district') => {
        const val = tempInputs[level].trim().toUpperCase();
        if (!val) {
            setIsAddingNew(prev => ({ ...prev, [level]: false }));
            return;
        }

        const parts = formData.zone.split(' - ');
        let region = parts[0] || '';
        let province = parts[1] || '';

        if (level === 'region') {
            setSessionLearnedData(prev => ({ ...prev, [val]: prev[val] || {} }));
            handleLocationChange('region', val);
        } else if (level === 'province' && region) {
            setSessionLearnedData(prev => ({
                ...prev,
                [region]: { ...prev[region], [val]: prev[region]?.[val] || [] }
            }));
            handleLocationChange('province', val);
        } else if (level === 'district' && region && province) {
            setSessionLearnedData(prev => {
                const r = prev[region] || {};
                const p = r[province] || [];
                if (!p.includes(val)) {
                    return { ...prev, [region]: { ...r, [province]: [...p, val] } };
                }
                return prev;
            });
            handleLocationChange('district', val);
        }

        setTempInputs(prev => ({ ...prev, [level]: '' }));
        setIsAddingNew(prev => ({ ...prev, [level]: false }));
    };

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
                                    <label className="form-label" style={{ color: '#f1f5f9', fontWeight: 600 }}>Zona de Asignación (Ubicación)</label>
                                    <div style={{
                                        display: 'grid',
                                        gap: '0.875rem',
                                        padding: '1.25rem',
                                        background: '#1e293b',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 102, 0, 0.4)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}>
                                        {/* REGION SECTION */}
                                        <div className="location-level">
                                            {isAddingNew.region ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Nombre de la Región..."
                                                        value={tempInputs.region}
                                                        onChange={e => setTempInputs({ ...tempInputs, region: e.target.value })}
                                                        autoFocus
                                                        style={{ background: '#ffffff', color: '#1a1a1a', borderColor: '#FF6600' }}
                                                    />
                                                    <button type="button" onClick={() => confirmNewLocation('region')} className="btn btn-primary" style={{ padding: '0 1rem' }} title="Confirmar">✓</button>
                                                    <button type="button" onClick={() => setIsAddingNew({ ...isAddingNew, region: false })} className="btn btn-outline" style={{ padding: '0 1rem', background: '#334155' }} title="Cancelar">×</button>
                                                </div>
                                            ) : (
                                                <select
                                                    className="form-input"
                                                    value={formData.zone.split(' - ')[0] || ''}
                                                    onChange={e => handleLocationChange('region', e.target.value)}
                                                    style={{ background: '#ffffff', color: '#1e293b', borderColor: '#cbd5e1', fontWeight: 500 }}
                                                    title="Seleccionar Región"
                                                >
                                                    <option value="">-- Seleccione Región --</option>
                                                    {availableLocations.regions.map((r: string) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                    <option value="ADD_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR REGIÓN</option>
                                                </select>
                                            )}
                                        </div>

                                        {/* PROVINCE SECTION */}
                                        {formData.zone.split(' - ')[0] && (
                                            <div className="location-level">
                                                {isAddingNew.province ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Nombre de la Provincia..."
                                                            value={tempInputs.province}
                                                            onChange={e => setTempInputs({ ...tempInputs, province: e.target.value })}
                                                            autoFocus
                                                            style={{ background: '#ffffff', color: '#1a1a1a', borderColor: '#FF6600' }}
                                                        />
                                                        <button type="button" onClick={() => confirmNewLocation('province')} className="btn btn-primary" style={{ padding: '0 1rem' }} title="Confirmar">✓</button>
                                                        <button type="button" onClick={() => setIsAddingNew({ ...isAddingNew, province: false })} className="btn btn-outline" style={{ padding: '0 1rem', background: '#334155' }} title="Cancelar">×</button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="form-input"
                                                        value={formData.zone.split(' - ')[1] || ''}
                                                        onChange={e => handleLocationChange('province', e.target.value)}
                                                        style={{ background: '#ffffff', color: '#1e293b', borderColor: '#cbd5e1', fontWeight: 500 }}
                                                        title="Seleccionar Provincia"
                                                    >
                                                        <option value="">-- Seleccione Provincia --</option>
                                                        {availableLocations.getProvinces(formData.zone.split(' - ')[0]).map((p: string) => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                        <option value="ADD_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR PROVINCIA</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {/* DISTRICT SECTION */}
                                        {formData.zone.split(' - ')[1] && (
                                            <div className="location-level">
                                                {isAddingNew.district ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Nombre del Distrito..."
                                                            value={tempInputs.district}
                                                            onChange={e => setTempInputs({ ...tempInputs, district: e.target.value })}
                                                            autoFocus
                                                            style={{ background: '#ffffff', color: '#1a1a1a', borderColor: '#FF6600' }}
                                                        />
                                                        <button type="button" onClick={() => confirmNewLocation('district')} className="btn btn-primary" style={{ padding: '0 1rem' }} title="Confirmar">✓</button>
                                                        <button type="button" onClick={() => setIsAddingNew({ ...isAddingNew, district: false })} className="btn btn-outline" style={{ padding: '0 1rem', background: '#334155' }} title="Cancelar">×</button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="form-input"
                                                        value={formData.zone.split(' - ')[2] || ''}
                                                        onChange={e => handleLocationChange('district', e.target.value)}
                                                        style={{ background: '#ffffff', color: '#1e293b', borderColor: '#cbd5e1', fontWeight: 500 }}
                                                        title="Seleccionar Distrito"
                                                    >
                                                        <option value="">-- Seleccione Distrito --</option>
                                                        {availableLocations.getDistricts(formData.zone.split(' - ')[0], formData.zone.split(' - ')[1]).map((d: string) => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                        <option value="ADD_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR DISTRITO</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>📍 Selección:</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                                                {formData.zone || 'Ninguna'}
                                            </span>
                                        </div>
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
