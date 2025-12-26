import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ubigeoData, regions, getProvinces, getDistricts, getCaserios } from '../../data/ubigeo';

interface Client {
    id: number;
    code?: string; // Legacy ID
    dni: string;
    full_name: string;
    phone: string;
    second_phone?: string;
    region?: string;
    province?: string;
    district?: string;
    caserio?: string;
    zone?: string;
    sector?: string; // New Sector field
    address: string; // Main Street
    address_details?: string; // Number + Reference
    contract_number?: string;
    plan_type: 'INTERNET' | 'CABLE' | 'DUO';
    plan: string;
    internet_speed?: string;
    cost: number;
    payment_day?: number;
    service_status: string;
    pending_verifications?: number;
}

export default function ClientManagement() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        dni: '',
        fullName: '',
        phone: '',
        secondPhone: '',
        region: 'La Libertad', // Default
        province: 'Otuzco',
        district: 'Mache',
        caserio: '',
        zone: '',
        sector: '',
        address: '', // Calle
        addressDetails: '', // N° + Referencia
        contractNumber: '',
        planType: 'INTERNET',
        planName: '',
        internetSpeed: '30MB',
        cost: '50.00',
        paymentDay: '5'
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await api.get('/admin/clients');
            setClients(response.data.clients);
            setLoading(false);
        } catch (error) {
            console.error('Error cargando clientes:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            code: '', dni: '', fullName: '', phone: '', secondPhone: '',
            region: 'La Libertad', province: 'Otuzco', district: 'Mache', caserio: '',
            address: '', addressDetails: '', zone: '', sector: '',
            planType: 'INTERNET', internetSpeed: '20MB', planName: '', cost: '50',
            contractNumber: '', paymentDay: '5'
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleEditClick = (client: any) => {
        const region = client.region || 'La Libertad';
        const province = client.province || 'Otuzco';
        const district = client.district || 'Mache';
        const caserioList = getCaserios(region, province, district);
        const isCustomCaserio = client.caserio && !caserioList.includes(client.caserio);

        setFormData({
            code: client.code || '',
            dni: client.dni,
            fullName: client.full_name,
            phone: client.phone || '',
            secondPhone: client.second_phone || '',
            region: region,
            province: province,
            district: district,
            caserio: isCustomCaserio ? 'OTRO' : (client.caserio || ''),
            // @ts-ignore
            customCaserio: isCustomCaserio ? client.caserio : '',
            address: client.address || '',
            addressDetails: client.address_details || '',
            zone: client.zone || '',
            sector: client.sector || '',
            planType: client.plan_type || 'INTERNET',
            internetSpeed: client.internet_speed || '20MB',
            planName: client.plan || '',
            cost: (client.cost || 50).toString(),
            contractNumber: client.contract_number || '',
            paymentDay: (client.payment_day || 5).toString()
        });
        setEditId(client.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalCaserio = formData.caserio;
        if (formData.caserio === 'OTRO') {
            // @ts-ignore
            if (!formData.customCaserio) {
                alert('Especifique el nombre del caserío');
                return;
            }
            // @ts-ignore
            finalCaserio = formData.customCaserio;
        }

        const payload = {
            ...formData,
            caserio: finalCaserio,
            cost: parseFloat(formData.cost),
            // @ts-ignore
            plan: formData.planName || undefined
        };
        // Remove helper props
        // @ts-ignore
        delete payload.customCaserio;
        // @ts-ignore
        delete payload.planName;

        try {
            if (isEditing && editId) {
                await api.put(`/admin/clients/${editId}`, payload);
                alert('Cliente actualizado exitosamente');
            } else {
                await api.post('/admin/clients', payload);
                alert('Cliente creado exitosamente');
            }
            setShowModal(false);
            loadClients();
            resetForm();
        } catch (error: any) {
            console.error('Error al guardar cliente:', error);
            const msg = error.response?.data?.error || error.message || 'Error al guardar cliente';
            alert(`Error: ${msg}`);
        }
    };

    // State for Custom Location Inputs
    const [isCustom, setIsCustom] = useState({
        region: false,
        province: false,
        district: false,
        caserio: false
    });

    const [availableLocations, setAvailableLocations] = useState({
        regions: regions,
        getProvinces: (region: string) => getProvinces(region),
        getDistricts: (region: string, province: string) => getDistricts(region, province),
        getCaserios: (region: string, province: string, district: string) => getCaserios(region, province, district)
    });

    useEffect(() => {
        const learnedData = JSON.parse(JSON.stringify(ubigeoData));

        clients.forEach(client => {
            if (!client.region) return;
            if (!learnedData[client.region]) learnedData[client.region] = {};
            if (client.province) {
                if (!learnedData[client.region][client.province]) learnedData[client.region][client.province] = {};
                if (client.district) {
                    if (!learnedData[client.region][client.province][client.district]) learnedData[client.region][client.province][client.district] = [];
                    if (client.caserio && !learnedData[client.region][client.province][client.district].includes(client.caserio)) {
                        learnedData[client.region][client.province][client.district].push(client.caserio);
                    }
                }
            }
        });

        setAvailableLocations({
            regions: Object.keys(learnedData),
            getProvinces: (region: string) => region && learnedData[region] ? Object.keys(learnedData[region]) : [],
            getDistricts: (region: string, province: string) => region && province && learnedData[region]?.[province] ? Object.keys(learnedData[region][province]) : [],
            getCaserios: (region: string, province: string, district: string) => region && province && district && learnedData[region]?.[province]?.[district] ? learnedData[region][province][district] : []
        });

    }, [clients]);

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.dni.includes(searchTerm) ||
        (c.sector && c.sector.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-4 text-center">Cargando...</div>;

    return (
        <div className="page-wrapper">
            <div className="gradient-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h1 className="page-title">Gestión de Clientes</h1>
                            <div className="header-subtitle">
                                <button onClick={() => navigate('/admin/dashboard')} className="back-button">← Volver al Dashboard</button>
                                <span className="header-description">Administración de cartera de clientes</span>
                            </div>
                        </div>
                        <button onClick={() => { setIsEditing(false); setEditId(null); resetForm(); setShowModal(true); }} className="action-button">
                            + Nuevo Cliente
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="search-container">
                    <div className="card search-card">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por DNI, Nombre o Sector..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="card table-container">
                    <div className="table-scroll">
                        <table className="table table-full-width">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-th-dni">Código / DNI</th>
                                    <th className="table-th-client">Cliente</th>
                                    <th className="table-th-location">Ubicación (Sector)</th>
                                    <th className="table-th-plan">Dirección</th>
                                    <th className="table-th-cost">Plan/Costo</th>
                                    <th className="table-th-actions">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="table-row">
                                        <td className="cell-dni">
                                            <div className="fw-bold text-primary">{client.code || '-'}</div>
                                            <div className="small text-muted">{client.dni}</div>
                                        </td>
                                        <td>
                                            <div className="cell-title">{client.full_name}</div>
                                            <div className="cell-subtitle">
                                                <span>📱 {client.phone}</span>
                                                {client.second_phone && <span className="ms-1">/ {client.second_phone}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge bg-light text-dark border">{client.sector || 'Sin Sector'}</div>
                                            <div className="small text-muted mt-1">{client.caserio}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold">{client.address}</div>
                                            {client.address_details && <div className="small text-muted">{client.address_details}</div>}
                                        </td>
                                        <td>
                                            <span className="badge badge-plan">{client.plan_type}</span>
                                            <div className="fw-bold mt-1">S/ {parseFloat(client.cost.toString()).toFixed(2)}</div>
                                        </td>
                                        <td className="cell-actions">
                                            <div className="actions-wrapper">
                                                <button onClick={() => handleEditClick(client)} className="btn btn-sm btn-outline btn-icon-xs" title="Editar">✏️</button>
                                                <button
                                                    className={`btn btn-sm btn-icon-xs ${client.service_status === 'active' ? 'btn-error' : 'btn-success'}`}
                                                    title={client.service_status === 'active' ? 'Suspender' : 'Reactivar'}
                                                    onClick={async () => {
                                                        const newStatus = client.service_status === 'active' ? 'suspended' : 'active';
                                                        if (!confirm(`¿Confirmar cambio de estado para ${client.full_name}?`)) return;
                                                        try {
                                                            await api.put(`/admin/clients/${client.id}`, { ...client, service_status: newStatus });
                                                            alert('Estado actualizado.');
                                                            loadClients();
                                                        } catch (err: any) {
                                                            console.error(err);
                                                            alert('Error al actualizar estado');
                                                        }
                                                    }}
                                                >
                                                    {client.service_status === 'active' ? '🚫' : '✅'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredClients.length === 0 && (
                                    <tr><td colSpan={6} className="text-center-p4">No se encontraron clientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="card modal-card modal-card-lg">
                            <div className="card-header modal-header">
                                <h3 className="card-title">{isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
                                <button type="button" onClick={() => setShowModal(false)} className="modal-close-button">×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="card-body">
                                <h4 className="form-section-title">Datos Personales</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Código (ID Legacy)</label>
                                        <input name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder="Opcional" title="Código Legacy" />
                                    </div>
                                    <div className="form-group">
                                        <label>DNI *</label>
                                        <input name="dni" value={formData.dni} onChange={handleInputChange} className="form-input" required maxLength={8} title="DNI" />
                                    </div>
                                    <div className="form-group span-2">
                                        <label>Nombre Completo *</label>
                                        <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-input" required title="Nombre Completo" />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono 1 *</label>
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" required title="Teléfono 1" />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono 2 (Opcional)</label>
                                        <input name="secondPhone" value={formData.secondPhone} onChange={handleInputChange} className="form-input" title="Teléfono 2" />
                                    </div>
                                </div>

                                <h4 className="form-section-title">Ubicación y Zona</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Región *</label>
                                        <div className="form-row-group">
                                            {isCustom.region ? (
                                                <input
                                                    name="region"
                                                    value={formData.region}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Ingrese nueva región"
                                                    autoFocus
                                                    title="Nueva Región"
                                                />
                                            ) : (
                                                <select
                                                    name="region"
                                                    value={formData.region}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM_NEW') {
                                                            setIsCustom(prev => ({ ...prev, region: true }));
                                                            setFormData(prev => ({ ...prev, region: '', province: '', district: '', caserio: '' }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, region: val, province: '', district: '', caserio: '' }));
                                                        }
                                                    }}
                                                    className="form-input"
                                                    required
                                                    title="Seleccionar Región"
                                                >
                                                    <option value="">Seleccione Región</option>
                                                    {availableLocations.regions.map(r => <option key={r} value={r}>{r}</option>)}
                                                    <option value="CUSTOM_NEW" className="text-primary-bold">+ AGREGAR NUEVA REGIÓN</option>
                                                </select>
                                            )}
                                            {isCustom.region && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustom(prev => ({ ...prev, region: false }))}
                                                    className="btn btn-sm btn-outline-error"
                                                    title="Cancelar"
                                                >✕</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Provincia *</label>
                                        <div className="form-row-group">
                                            {isCustom.province ? (
                                                <input
                                                    name="province"
                                                    value={formData.province}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Ingrese nueva provincia"
                                                    autoFocus
                                                    title="Nueva Provincia"
                                                />
                                            ) : (
                                                <select
                                                    name="province"
                                                    value={formData.province}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM_NEW') {
                                                            setIsCustom(prev => ({ ...prev, province: true }));
                                                            setFormData(prev => ({ ...prev, province: '', district: '', caserio: '' }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, province: val, district: '', caserio: '' }));
                                                        }
                                                    }}
                                                    className="form-input"
                                                    disabled={!formData.region && !isCustom.region}
                                                    required
                                                    title="Seleccionar Provincia"
                                                >
                                                    <option value="">Seleccione Provincia</option>
                                                    {availableLocations.getProvinces(formData.region).map(p => <option key={p} value={p}>{p}</option>)}
                                                    <option value="CUSTOM_NEW" className="text-primary-bold">+ AGREGAR NUEVA PROVINCIA</option>
                                                </select>
                                            )}
                                            {isCustom.province && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustom(prev => ({ ...prev, province: false }))}
                                                    className="btn btn-sm btn-outline-error"
                                                    title="Cancelar"
                                                >✕</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Distrito *</label>
                                        <div className="form-row-group">
                                            {isCustom.district ? (
                                                <input
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Ingrese nuevo distrito"
                                                    autoFocus
                                                    title="Nuevo Distrito"
                                                />
                                            ) : (
                                                <select
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM_NEW') {
                                                            setIsCustom(prev => ({ ...prev, district: true }));
                                                            setFormData(prev => ({ ...prev, district: '', caserio: '' }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, district: val, caserio: '' }));
                                                        }
                                                    }}
                                                    className="form-input"
                                                    disabled={!formData.province && !isCustom.province}
                                                    required
                                                    title="Seleccionar Distrito"
                                                >
                                                    <option value="">Seleccione Distrito</option>
                                                    {availableLocations.getDistricts(formData.region, formData.province).map(d => <option key={d} value={d}>{d}</option>)}
                                                    <option value="CUSTOM_NEW" className="text-primary-bold">+ AGREGAR NUEVO DISTRITO</option>
                                                </select>
                                            )}
                                            {isCustom.district && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustom(prev => ({ ...prev, district: false }))}
                                                    className="btn btn-sm btn-outline-error"
                                                    title="Cancelar"
                                                >✕</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Caserío / Localidad *</label>
                                        <div className="form-row-group">
                                            {isCustom.caserio ? (
                                                <input
                                                    name="caserio"
                                                    value={formData.caserio}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="Ingrese nuevo caserío"
                                                    autoFocus
                                                    title="Nuevo Caserío"
                                                />
                                            ) : (
                                                <select
                                                    name="caserio"
                                                    value={formData.caserio}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM_NEW') {
                                                            setIsCustom(prev => ({ ...prev, caserio: true }));
                                                            setFormData(prev => ({ ...prev, caserio: '' }));
                                                        } else {
                                                            handleInputChange(e);
                                                        }
                                                    }}
                                                    className="form-input"
                                                    disabled={!formData.district && !isCustom.district}
                                                    required
                                                    title="Seleccionar Caserío"
                                                >
                                                    <option value="">Seleccione Caserío</option>
                                                    {availableLocations.getCaserios(formData.region, formData.province, formData.district).map(c => <option key={c} value={c}>{c}</option>)}
                                                    <option value="CUSTOM_NEW" className="text-primary-bold">+ AGREGAR NUEVO CASERÍO</option>
                                                </select>
                                            )}
                                            {isCustom.caserio && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCustom(prev => ({ ...prev, caserio: false }))}
                                                    className="btn btn-sm btn-outline-error"
                                                    title="Cancelar"
                                                >✕</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h4 className="form-section-title">Dirección Exacta</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Dirección / Calle *</label>
                                        <input name="address" value={formData.address} onChange={handleInputChange} className="form-input" required placeholder="Ej: Av. Chorrillos" title="Calle Principal" />
                                    </div>
                                    <div className="form-group">
                                        <label>N° / Referencia</label>
                                        <input name="addressDetails" value={formData.addressDetails} onChange={handleInputChange} className="form-input" placeholder="Ej: Mz18 Lt12" title="Detalle" />
                                    </div>
                                    <div className="form-group">
                                        <label>Sector / Zona *</label>
                                        <input name="sector" value={formData.sector} onChange={handleInputChange} className="form-input" required placeholder="Ej: Usquil Centro" title="Sector" />
                                    </div>
                                </div>

                                <h4 className="form-section-title">Servicio</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tipo de Plan</label>
                                        <select name="planType" value={formData.planType} onChange={handleInputChange} className="form-input" title="Seleccionar Tipo de Plan">
                                            <option value="INTERNET">Internet</option>
                                            <option value="CABLE">Cable TV</option>
                                            <option value="DUO">Dúo</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Costo (S/)</label>
                                        <input type="number" name="cost" value={formData.cost} onChange={handleInputChange} className="form-input" step="0.50" title="Costo del Plan" />
                                    </div>
                                    <div className="form-group">
                                        <label>Día de Pago</label>
                                        <input type="number" name="paymentDay" value={formData.paymentDay} onChange={handleInputChange} className="form-input" disabled title="Día de Pago" />
                                        <small className="text-muted">Fijo: Día 7</small>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Guardar Cliente</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
