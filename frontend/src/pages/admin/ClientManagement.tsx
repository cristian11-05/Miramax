import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ubigeoData, regions, getProvinces, getDistricts, getCaserios } from '../../data/ubigeo';
import { Upload, MapPin } from 'lucide-react';
import ZoneDefinitionModal from '../../components/admin/ZoneDefinitionModal';

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
    collector_id?: number | null;
    collector_name?: string;
}

const ClientManagement = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showZoneModal, setShowZoneModal] = useState(false); // New Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Defined Zones
    const [definedZones, setDefinedZones] = useState<{ name: string, caserios: string[] }[]>([]);

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
        paymentDay: '7'
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadClients();
        loadZones();
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

    const loadZones = async () => {
        try {
            const { data } = await api.get('/admin/config');
            if (data.config && data.config.defined_zones) {
                const parsed = JSON.parse(data.config.defined_zones);
                setDefinedZones(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error('Error loading zones:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleZoneChange = (zoneName: string) => {
        if (zoneName === '__NEW__') {
            setShowModal(false); // Close edit modal
            setShowZoneModal(true); // Open zone manager
            return;
        }

        // If a defined zone is selected, try to infer the location context from its first caserio
        const selectedZone = definedZones.find(z => z.name === zoneName);
        let updates: any = { sector: zoneName };

        if (selectedZone && selectedZone.caserios.length > 0) {
            // We'll reset the caserio selection when zone changes, to force re-selection from the filtered list
            updates.caserio = '';

            // Optional: infer district/province/region from the first caserio in the zone if possible
            // For now, we rely on the filtering logic in getCaserios
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const resetForm = () => {
        setFormData({
            code: '', dni: '', fullName: '', phone: '', secondPhone: '',
            region: 'La Libertad', province: 'Otuzco', district: 'Mache', caserio: '',
            address: '', addressDetails: '', zone: '', sector: '',
            planType: 'INTERNET', internetSpeed: '20MB', planName: '', cost: '50',
            contractNumber: '', paymentDay: '7'
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

        console.log('📤 Enviando payload de cliente (SIN collectorId - será auto-asignado):', payload);

        try {
            let response;
            if (isEditing && editId) {
                response = await api.put(`/admin/clients/${editId}`, payload);
                alert('Cliente actualizado exitosamente');
            } else {
                response = await api.post('/admin/clients', payload);
                alert('Cliente creado exitosamente');
            }

            // Verificar si hay advertencia de cobrador no encontrado
            if (response.data.warning === 'NO_COLLECTOR' || response.data.message?.includes('sin cobrador')) {
                // Sonido de alerta
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSF+zPLTgjMGHm7A7+OZSA0PVa3n77BdGAc+ltryxnMpBSyAzfPYijcIG2i78OScUhENT6Tj8LdjHQU3kdXA==');
                audio.play().catch(e => console.log('Audio no disponible'));

                // Alerta visual
                const warningMsg = `❌🚨 ZONA SIN COBRADOR ASIGNADO!\n\n${formData.province} > ${formData.district} > ${formData.caserio}\n\nEl cliente fue creado pero necesita asignación manual de cobrador.`;
                alert(warningMsg);

                // Mostrar alerta en pantalla (opcional, más visual)
                const alertDiv = document.createElement('div');
                alertDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ff0000;
                    color: white;
                    padding: 2rem;
                    border-radius: 12px;
                    font-size: 1.5rem;
                    z-index: 10000;
                    box-shadow: 0 0 30px rgba(255,0,0,0.5);
                    border: 4px solid #fff;
                    animation: pulse 1s infinite;
                `;
                alertDiv.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 3rem;">⚠️</div>
                        <div style="font-weight: bold; margin: 1rem 0;">ZONA SIN COBRADOR</div>
                        <div style="font-size: 1.2rem;">${formData.province} > ${formData.district} > ${formData.caserio}</div>
                    </div>
                `;
                document.body.appendChild(alertDiv);
                setTimeout(() => alertDiv.remove(), 5000);
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

    // Estados para preview de importación
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImportFile(file);

            const formData = new FormData();
            formData.append('file', file);

            setLoading(true);
            try {
                // Paso 1: Preview con IA
                const res = await api.post('/admin/clients/import/preview', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setPreviewData(res.data);
                setShowPreviewModal(true);
            } catch (error: any) {
                console.error('Error analyzing file:', error);
                alert('Error al analizar el archivo. Verifique el formato.');
            } finally {
                setLoading(false);
                e.target.value = '';
            }
        }
    };

    const confirmImport = async () => {
        if (!importFile || !previewData) return;

        if (!confirm(`¿Confirmar importación de ${previewData.summary.totalRows} clientes?`)) {
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('mapping', JSON.stringify(previewData.mapping));

        setLoading(true);
        try {
            const res = await api.post('/admin/clients/import/confirm', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const summary = res.data.summary;
            alert(`✅ Importación completada:\n- Total: ${summary.total}\n- Nuevos: ${summary.imported}\n- Actualizados: ${summary.updated}\n- Errores: ${summary.errors.length}`);

            if (summary.errors.length > 0) {
                console.error('Errores:', summary.errors);
            }
            loadClients();
            setShowPreviewModal(false);
            setPreviewData(null);
            setImportFile(null);
        } catch (error: any) {
            console.error('Error importing:', error);
            alert('Error al importar clientes.');
        } finally {
            setLoading(false);
        }
    };

    const cancelImport = () => {
        setShowPreviewModal(false);
        setPreviewData(null);
        setImportFile(null);
    };

    // State for Custom Location Inputs
    const [isCustom, setIsCustom] = useState({
        region: false,
        province: false,
        district: false,
        caserio: false
    });

    // Session-based learned data to keep new locations available during the session
    const [sessionLearnedData, setSessionLearnedData] = useState<Record<string, Record<string, string[]>>>(() => {
        const saved = localStorage.getItem('learned_ubigeo_client');
        return saved ? JSON.parse(saved) : {};
    });

    const [availableLocations, setAvailableLocations] = useState({
        regions: regions,
        getProvinces: (region: string) => getProvinces(region),
        getDistricts: (region: string, province: string) => getDistricts(region, province),
        getCaserios: (region: string, province: string, district: string) => getCaserios(region, province, district)
    });

    useEffect(() => {
        localStorage.setItem('learned_ubigeo_client', JSON.stringify(sessionLearnedData));
    }, [sessionLearnedData]);

    useEffect(() => {
        // Start with static data
        const learnedData = JSON.parse(JSON.stringify(ubigeoData));

        // Merge with session-learned data
        Object.keys(sessionLearnedData).forEach(r => {
            if (!learnedData[r]) learnedData[r] = {};
            Object.keys(sessionLearnedData[r]).forEach(p => {
                if (!learnedData[r][p]) learnedData[r][p] = [];
                sessionLearnedData[r][p].forEach(d => {
                    if (!learnedData[r][p].includes(d)) learnedData[r][p].push(d);
                });
            });
        });

        // Merge with data from existing clients
        clients.forEach(client => {
            if (!client.region) return;
            if (!learnedData[client.region]) learnedData[client.region] = {};
            if (client.province) {
                if (!learnedData[client.region][client.province]) learnedData[client.region][client.province] = [];
                if (client.district) {
                    // In our ubigeoData, districts are keys in province object, which contain array of caserios
                    // BUT in ClientManagement lines 270-272 treated it as nested objects.
                    // Correct structure: ubigeoData[region][province][district] = string[]

                    // First ensure district exists as a key
                    if (typeof learnedData[client.region][client.province] === 'object' && !Array.isArray(learnedData[client.region][client.province])) {
                        if (!learnedData[client.region][client.province][client.district]) {
                            learnedData[client.region][client.province][client.district] = [];
                        }
                        if (client.caserio && !learnedData[client.region][client.province][client.district].includes(client.caserio)) {
                            learnedData[client.region][client.province][client.district].push(client.caserio);
                        }
                    }
                }
            }
        });

        setAvailableLocations({
            regions: Object.keys(learnedData),
            getProvinces: (region: string) => region && learnedData[region] ? Object.keys(learnedData[region]) : [],
            getDistricts: (region: string, province: string) => region && province && learnedData[region]?.[province] ? Object.keys(learnedData[region][province]) : [],
            getCaserios: (region: string, province: string, district: string) => {
                let allCaserios = region && province && district && learnedData[region]?.[province]?.[district] ? learnedData[region][province][district] : [];

                if (formData.sector && definedZones.some(z => z.name === formData.sector)) {
                    const zone = definedZones.find(z => z.name === formData.sector);
                    if (zone) {
                        allCaserios = allCaserios.filter((c: string) => zone.caserios.includes(c));
                    }
                }
                return allCaserios;
            }
        });

    }, [clients, formData.sector, definedZones, sessionLearnedData]);

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
                        <div className="d-flex gap-2">
                            <input
                                type="file"
                                id="import-excel"
                                accept=".xlsx, .xls"
                                className="d-none"
                                onChange={handleImport}
                                aria-label="Importar archivo Excel de clientes"
                                title="Seleccionar archivo Excel"
                            />
                            <button
                                onClick={() => document.getElementById('import-excel')?.click()}
                                className="action-button"
                                style={{ backgroundColor: '#10B981', color: 'white' }}
                            >
                                <Upload size={18} className="me-2" /> Importar Excel
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditId(null); resetForm(); setShowModal(true); }} className="action-button">
                                + Nuevo Cliente
                            </button>
                        </div>
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
                                    <th className="table-th-collector">Cobrador</th>
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
                                            <div className="fw-bold text-dark">{client.collector_name || 'No asignado'}</div>
                                            <div className="small text-muted mt-1">ID: {client.collector_id || '-'}</div>
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
                                                            alert(err.response?.data?.error || err.message || 'Error al actualizar estado');
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

                {/* Zone Manager Modal */}
                {showZoneModal && (
                    <ZoneDefinitionModal
                        onClose={() => setShowZoneModal(false)}
                        onSaveSuccess={loadZones}
                    />
                )}

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
                                    {/* Zone Selection FIRST */}
                                    <div className="form-group span-2">
                                        <label>Sector / Zona *</label>
                                        <select
                                            name="sector"
                                            value={formData.sector}
                                            onChange={(e) => handleZoneChange(e.target.value)}
                                            className="form-input"
                                            required
                                            title="Sector/Zona Personalizada"
                                            style={{ backgroundColor: '#f0f9ff', fontWeight: 600, borderColor: '#6366f1' }}
                                        >
                                            <option value="">-- Seleccione Zona --</option>
                                            {definedZones.map(z => (
                                                <option key={z.name} value={z.name}>{z.name}</option>
                                            ))}
                                            {formData.sector && !definedZones.find(z => z.name === formData.sector) && (
                                                <option value={formData.sector}>{formData.sector} (Manual)</option>
                                            )}
                                        </select>
                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            Seleccione una zona para filtrar los caseríos disponibles.
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label>Región *</label>
                                        <div className="form-row-group">
                                            {isCustom.region ? (
                                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                                    <input
                                                        name="region"
                                                        value={formData.region}
                                                        onChange={handleInputChange}
                                                        className="form-input"
                                                        placeholder="Nueva región"
                                                        autoFocus
                                                        title="Nueva Región"
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const val = formData.region.trim();
                                                        if (val) {
                                                            setSessionLearnedData(prev => ({ ...prev, [val]: prev[val] || {} }));
                                                            setIsCustom(prev => ({ ...prev, region: false }));
                                                        }
                                                    }} className="btn btn-sm btn-primary">✓</button>
                                                </div>
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
                                                    <option value="CUSTOM_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR REGIÓN</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Provincia *</label>
                                        <div className="form-row-group">
                                            {isCustom.province ? (
                                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                                    <input
                                                        name="province"
                                                        value={formData.province}
                                                        onChange={handleInputChange}
                                                        className="form-input"
                                                        placeholder="Nueva provincia"
                                                        autoFocus
                                                        title="Nueva Provincia"
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const val = formData.province.trim();
                                                        if (val && formData.region) {
                                                            setSessionLearnedData(prev => ({
                                                                ...prev,
                                                                [formData.region]: { ...prev[formData.region], [val]: prev[formData.region]?.[val] || [] }
                                                            }));
                                                            setIsCustom(prev => ({ ...prev, province: false }));
                                                        }
                                                    }} className="btn btn-sm btn-primary">✓</button>
                                                </div>
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
                                                    disabled={!formData.region}
                                                    required
                                                    title="Seleccionar Provincia"
                                                >
                                                    <option value="">Seleccione Provincia</option>
                                                    {availableLocations.getProvinces(formData.region).map(p => <option key={p} value={p}>{p}</option>)}
                                                    <option value="CUSTOM_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR PROVINCIA</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Distrito *</label>
                                        <div className="form-row-group">
                                            {isCustom.district ? (
                                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                                    <input
                                                        name="district"
                                                        value={formData.district}
                                                        onChange={handleInputChange}
                                                        className="form-input"
                                                        placeholder="Nuevo distrito"
                                                        autoFocus
                                                        title="Nuevo Distrito"
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const val = formData.district.trim();
                                                        if (val && formData.region && formData.province) {
                                                            const currentDistricts = sessionLearnedData[formData.region]?.[formData.province] || [];
                                                            setSessionLearnedData(prev => ({
                                                                ...prev,
                                                                [formData.region]: {
                                                                    ...prev[formData.region],
                                                                    [formData.province]: [...new Set([...currentDistricts, val])]
                                                                }
                                                            }));
                                                            setIsCustom(prev => ({ ...prev, district: false }));
                                                        }
                                                    }} className="btn btn-sm btn-primary">✓</button>
                                                </div>
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
                                                    disabled={!formData.province}
                                                    required
                                                    title="Seleccionar Distrito"
                                                >
                                                    <option value="">Seleccione Distrito</option>
                                                    {availableLocations.getDistricts(formData.region, formData.province).map(d => <option key={d} value={d}>{d}</option>)}
                                                    <option value="CUSTOM_NEW" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ AGREGAR DISTRITO</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Caserío / Centro Poblado *</label>
                                        <div className="form-row-group">
                                            {isCustom.caserio || formData.caserio === 'OTRO' ? (
                                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                                    <input
                                                        name="caserio"
                                                        value={formData.caserio === 'OTRO' ? '' : formData.caserio}
                                                        onChange={handleInputChange}
                                                        className="form-input"
                                                        placeholder="Nombre del caserío"
                                                        autoFocus
                                                        title="Nuevo Caserío"
                                                        style={{ borderColor: '#FF6600' }}
                                                    />
                                                    <button type="button" onClick={() => setIsCustom(prev => ({ ...prev, caserio: false }))} className="btn btn-sm btn-primary">✓</button>
                                                </div>
                                            ) : (
                                                <select
                                                    name="caserio"
                                                    value={formData.caserio}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM_NEW' || val === 'OTRO') {
                                                            setIsCustom(prev => ({ ...prev, caserio: true }));
                                                            setFormData(prev => ({ ...prev, caserio: '' }));
                                                        } else {
                                                            handleInputChange(e);
                                                        }
                                                    }}
                                                    className="form-input"
                                                    disabled={!formData.district}
                                                    required
                                                    title="Seleccionar Caserío"
                                                >
                                                    <option value="">Seleccione Caserío</option>
                                                    {availableLocations.getCaserios(formData.region, formData.province, formData.district).map(c => <option key={c} value={c}>{c}</option>)}
                                                    <option value="OTRO" style={{ color: '#FF6600', fontWeight: 'bold' }}>+ OTRO / AGREGAR</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h4 className="form-section-title">Dirección y Contacto</h4>
                                <div className="form-grid">
                                    <div className="form-group span-2">
                                        <label>Dirección / Calle / Jr / Av *</label>
                                        <input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                            placeholder="Ej: Jr. Lima 123"
                                            title="Calle Principal"
                                        />
                                    </div>
                                    <div className="form-group span-2">
                                        <label>Referencia o Detalles Adicionales</label>
                                        <input
                                            name="addressDetails"
                                            value={formData.addressDetails}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Ej: Portón verde, frente al parque"
                                            title="Referencia"
                                        />
                                    </div>
                                </div>

                                <h4 className="form-section-title">Configuración del Servicio</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tipo de Plan *</label>
                                        <select name="planType" value={formData.planType} onChange={handleInputChange} className="form-input" required title="Tipo de Plan">
                                            <option value="INTERNET">Internet Solo</option>
                                            <option value="CABLE">Cable TV Solo</option>
                                            <option value="DUO">Internet + Cable (Dúo)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Costo Mensual (S/) *</label>
                                        <input type="number" name="cost" value={formData.cost} onChange={handleInputChange} className="form-input" required step="0.50" title="Costo" />
                                    </div>
                                    <div className="form-group">
                                        <label>Día de Pago</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" name="paymentDay" value={formData.paymentDay} onChange={handleInputChange} className="form-input" disabled title="Día de Pago" style={{ backgroundColor: '#1a1a1a', color: '#888' }} />
                                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#FF6600' }}>Fijo: 07</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ borderTop: '1px solid #333', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                        {isEditing ? 'Actualizar Cliente' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
                }

                {/* Modal de Preview de Importación */}
                {showPreviewModal && previewData && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '2rem',
                            maxWidth: '800px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}>
                            <h2 style={{ marginBottom: '1rem', color: '#333' }}>🤖 Preview de Importación</h2>

                            <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <h3 style={{ color: '#0369a1' }}>📊 Resumen</h3>
                                <p style={{ color: '#333' }}><strong>Total de filas:</strong> {previewData.summary.totalRows}</p>
                                <p style={{ color: '#333' }}><strong>Con ubicación (tendrán cobrador):</strong> {previewData.summary.stats.withLocation}</p>
                                <p style={{ color: '#333' }}><strong>Sin ubicación:</strong> {previewData.summary.stats.withoutLocation}</p>
                            </div>

                            {previewData.summary.warnings.length > 0 && (
                                <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <h3 style={{ color: '#856404' }}>⚠️ Advertencias</h3>
                                    {previewData.summary.warnings.map((w: string, i: number) => (
                                        <p key={i} style={{ margin: '0.25rem 0', color: '#856404' }}>{w}</p>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ color: '#333' }}>🔍 Columnas Detectadas (IA)</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd', color: '#333' }}>Campo</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ddd', color: '#333' }}>Columna Excel</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(previewData.mapping).map(([field, col]: [string, any]) => (
                                            <tr key={field}>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>{field}</td>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: col ? '#16a34a' : '#dc2626' }}>
                                                    {col || '❌ No detectado'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ color: '#333' }}>👁️ Vista Previa (primeras 5 filas)</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                                            <th style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>DNI</th>
                                            <th style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>Nombres</th>
                                            <th style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>Distrito</th>
                                            <th style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>Caserío</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.summary.preview.map((row: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>{row.dni}</td>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>{row.nombres}</td>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>{row.distrito}</td>
                                                <td style={{ padding: '0.5rem', border: '1px solid #ddd', color: '#333' }}>{row.caserio}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button
                                    onClick={cancelImport}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#6b7280',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ❌ Cancelar
                                </button>
                                <button
                                    onClick={confirmImport}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ✅ Confirmar Importación
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientManagement;
