import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ubigeoData, getDistricts, getCaserios } from '../../data/ubigeo';

interface ZoneAssignmentModalProps {
    collector: { id: number; full_name: string; zone?: string };
    onClose: () => void;
    onSuccess: () => void;
}

export default function ZoneAssignmentModal({ collector, onClose, onSuccess }: ZoneAssignmentModalProps) {
    const [step, setStep] = useState(1);
    const [selectedRegion, setSelectedRegion] = useState('La Libertad');
    const [selectedProvince, setSelectedProvince] = useState('Otuzco');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Caseríos stats loaded from backend
    const [caserioStats, setCaserioStats] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // Selection
    const [selectedCaserios, setSelectedCaserios] = useState<string[]>([]);

    const loadCaserioStats = async (district: string) => {
        setLoadingStats(true);
        try {
            // Get all clients to count per caserio (optimized approach would be a dedicated stats endpoint)
            // For now, we fetch all clients and filter client-side or use a specific report endpoint if available.
            // Let's assume we use the existing clients list to count, optimizing later if needed.
            const { data } = await api.get('/admin/clients');
            const clients = data.clients;

            // Get all possible caserios from UBIGEO data
            const allCaserios = getCaserios(selectedRegion, selectedProvince, district);

            // Count clients per caserio
            const stats = allCaserios.map(caserioName => {
                const clientsInCaserio = clients.filter(
                    (c: any) => c.district === district && c.caserio === caserioName
                );

                // Check if already assigned to THIS collector (mostly)
                const assignedCount = clientsInCaserio.filter((c: any) => c.collector_id === collector.id).length;
                const otherAssignedCount = clientsInCaserio.filter((c: any) => c.collector_id && c.collector_id !== collector.id).length;

                return {
                    name: caserioName,
                    totalClients: clientsInCaserio.length,
                    alreadyAssignedMe: assignedCount > 0 && assignedCount === clientsInCaserio.length,
                    assignedToOthers: otherAssignedCount > 0,
                    clientSample: clientsInCaserio.slice(0, 3).map((c: any) => c.full_name).join(', ')
                };
            }).filter(s => s.totalClients > 0); // Only show caserios with clients? or show all? 
            // Better show all or at least those with clients. Let's show those with clients for utility + all form ubigeo 

            setCaserioStats(stats.sort((a, b) => b.totalClients - a.totalClients));
        } catch (error) {
            console.error(error);
            alert("Error cargando daos de clientes");
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dist = e.target.value;
        setSelectedDistrict(dist);
        if (dist) {
            loadCaserioStats(dist);
            setStep(2);
        } else {
            setStep(1);
        }
    };

    const toggleCaserio = (caserio: string) => {
        if (selectedCaserios.includes(caserio)) {
            setSelectedCaserios(prev => prev.filter(c => c !== caserio));
        } else {
            setSelectedCaserios(prev => [...prev, caserio]);
        }
    };

    const handleAssign = async () => {
        if (selectedCaserios.length === 0) return;

        try {
            await api.post(`/admin/collectors/${collector.id}/assign-locations`, {
                district: selectedDistrict,
                caserios: selectedCaserios
            });
            alert('Ruta asignada exitosamente');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Error al asignar ruta');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card modal-card" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header modal-header">
                    <h3 className="card-title">📍 Asignar Ruta: {collector.full_name}</h3>
                    <button onClick={onClose} className="modal-close-button">×</button>
                </div>

                <div className="card-body" style={{ overflowY: 'auto', flex: 1 }}>
                    <div className="step-indicator" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        <div style={{ fontWeight: step === 1 ? 'bold' : 'normal', color: step === 1 ? '#FF6600' : '#888' }}>
                            1. Seleccionar Zona
                        </div>
                        <div style={{ fontWeight: step === 2 ? 'bold' : 'normal', color: step === 2 ? '#FF6600' : '#888' }}>
                            2. Elegir Caseríos
                        </div>
                    </div>

                    {/* STEP 1: FILTERS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="form-label">Región</label>
                            <select
                                className="form-input"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                disabled
                            >
                                <option>{selectedRegion}</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Provincia</label>
                            <select
                                className="form-input"
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                            >
                                {Object.keys(ubigeoData[selectedRegion]).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label className="form-label">Distrito *</label>
                        <select
                            className="form-input"
                            value={selectedDistrict}
                            onChange={handleDistrictChange}
                            style={{ border: '2px solid #FF6600' }}
                        >
                            <option value="">-- Seleccionar Distrito --</option>
                            {getDistricts(selectedRegion, selectedProvince).map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* STEP 2: LIST */}
                    {step === 2 && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0 }}>Caseríos en {selectedDistrict}</h4>
                                <span className="badge badge-info">{caserioStats.length} encontrados</span>
                            </div>

                            {loadingStats ? (
                                <div className="text-center p-4">Cargando clientes...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {caserioStats.map(stat => (
                                        <label
                                            key={stat.name}
                                            className="caserio-item"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem',
                                                border: selectedCaserios.includes(stat.name) ? '1px solid #FF6600' : '1px solid #eee',
                                                backgroundColor: selectedCaserios.includes(stat.name) ? '#fff5eb' : 'white',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCaserios.includes(stat.name)}
                                                    onChange={() => toggleCaserio(stat.name)}
                                                    style={{ width: '18px', height: '18px', accentColor: '#FF6600' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{stat.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                                        {stat.clientSample ? `Ej: ${stat.clientSample}...` : 'Sin clientes registrados'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="badge" style={{ backgroundColor: stat.totalClients > 0 ? '#3B82F6' : '#eee', color: stat.totalClients > 0 ? 'white' : '#888' }}>
                                                    {stat.totalClients} Clientes
                                                </div>
                                                {stat.assignedToOthers && <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '2px' }}>Ocupado ⚠️</div>}
                                            </div>
                                        </label>
                                    ))}

                                    {caserioStats.length === 0 && (
                                        <div className="text-center text-gray-500 py-4">
                                            No hay clientes registrados en caseríos conocidos de este distrito.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <div style={{ marginRight: 'auto', fontSize: '0.9rem' }}>
                        {selectedCaserios.length} caseríos seleccionados
                    </div>
                    <button onClick={onClose} className="btn btn-outline">Cancelar</button>
                    <button
                        onClick={handleAssign}
                        className="btn btn-primary"
                        disabled={selectedCaserios.length === 0}
                    >
                        Guardar Asignación
                    </button>
                </div>
            </div>
        </div>
    );
}
