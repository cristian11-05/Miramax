import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { getDistricts, getCaserios } from '../../data/ubigeo';
import './ZoneAssignmentModal.css';

interface ZoneAssignmentModalProps {
    collector: { id: number; full_name: string; zone?: string };
    onClose: () => void;
    onSuccess: () => void;
}

export default function ZoneAssignmentModal({ collector, onClose, onSuccess }: ZoneAssignmentModalProps) {
    const [selectedRegion] = useState('La Libertad');
    const [selectedProvince] = useState('Otuzco');
    const [activeDistrict, setActiveDistrict] = useState('');

    const [allClients, setAllClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // assignments: Record<district, Set<caserio>>
    const [selections, setSelections] = useState<Record<string, string[]>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/clients');
            setAllClients(data.clients || []);

            // Initial active district
            const districts = getDistricts(selectedRegion, selectedProvince);
            if (districts.length > 0) setActiveDistrict(districts[0]);

            // Try to infer current selections from clients already assigned to this collector
            const currentAssignments: Record<string, string[]> = {};
            data.clients.forEach((c: any) => {
                if (c.collector_id === collector.id && c.district && c.caserio) {
                    if (!currentAssignments[c.district]) currentAssignments[c.district] = [];
                    if (!currentAssignments[c.district].includes(c.caserio)) {
                        currentAssignments[c.district].push(c.caserio);
                    }
                }
            });
            setSelections(currentAssignments);

        } catch (error) {
            console.error(error);
            alert("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats per district
    const districtStats = useMemo(() => {
        const districts = getDistricts(selectedRegion, selectedProvince);
        return districts.map(d => {
            const clientsInDistrict = allClients.filter(c => c.district === d);
            const selectedCount = selections[d]?.length || 0;
            const totalCaserios = getCaserios(selectedRegion, selectedProvince, d).length;

            return {
                name: d,
                totalClients: clientsInDistrict.length,
                selectedCount,
                totalCaserios,
                isFull: selectedCount > 0 && selectedCount === totalCaserios
            };
        });
    }, [allClients, selections, selectedProvince, selectedRegion]);

    // Calculate details for active district
    const caserioStats = useMemo(() => {
        if (!activeDistrict) return [];
        const allPossible = getCaserios(selectedRegion, selectedProvince, activeDistrict);
        const selectedList = selections[activeDistrict] || [];

        return allPossible.map(name => {
            const clients = allClients.filter(c => c.district === activeDistrict && c.caserio === name);
            const isAssignedToOther = clients.some(c => c.collector_id && c.collector_id !== collector.id);
            const isAssignedToMe = clients.every(c => c.collector_id === collector.id) && clients.length > 0;

            return {
                name,
                totalClients: clients.length,
                isSelected: selectedList.includes(name),
                isAssignedToOther,
                isAssignedToMe,
                sample: clients.slice(0, 2).map(c => c.full_name).join(', ')
            };
        });
    }, [activeDistrict, allClients, selections, collector.id, selectedProvince, selectedRegion]);

    const toggleCaserio = (caserio: string) => {
        setSelections(prev => {
            const district = activeDistrict;
            const current = prev[district] || [];
            if (current.includes(caserio)) {
                return { ...prev, [district]: current.filter(c => c !== caserio) };
            } else {
                return { ...prev, [district]: [...current, caserio] };
            }
        });
    };

    const toggleAllInDistrict = () => {
        const allNames = caserioStats.map(s => s.name);
        const isAllSelected = caserioStats.every(s => s.isSelected);

        setSelections(prev => ({
            ...prev,
            [activeDistrict]: isAllSelected ? [] : allNames
        }));
    };

    const removeDistrict = (district: string) => {
        setSelections(prev => {
            const next = { ...prev };
            delete next[district];
            return next;
        });
    };

    const handleSave = async () => {
        const locations = Object.entries(selections)
            .filter(([_, caserios]) => caserios.length > 0)
            .map(([district, caserios]) => ({ district, caserios }));

        if (locations.length === 0) {
            alert("Seleccione al menos un caserío");
            return;
        }

        const summary = locations.map(l => `${l.district} (${l.caserios.length})`).join(', ');

        try {
            await api.post(`/admin/collectors/${collector.id}/assign-locations`, {
                locations,
                summary
            });
            alert('Ruta actualizada exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.details || error.response?.data?.error || error.message || 'Error al guardar la ruta';
            alert(`Error: ${msg}`);
        }
    };

    if (loading) return (
        <div className="modal-overlay zone-modal-overlay">
            <div className="card zone-modal-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Cargando información geográfica...</p>
            </div>
        </div>
    );

    const totalSelectedCaserios = Object.values(selections).reduce((sum, list) => sum + list.length, 0);

    return (
        <div className="modal-overlay zone-modal-overlay">
            <div className="card zone-modal-container">
                {/* Header */}
                <div className="zone-modal-header">
                    <div>
                        <h2 className="zone-modal-title">📍 Asignar Ruta Multizona</h2>
                        <p className="zone-modal-subtitle">Configurando cobertura para <strong>{collector.full_name}</strong></p>
                    </div>
                    <button onClick={onClose} className="zone-modal-close-btn">✕</button>
                </div>

                {/* Main Content Split */}
                <div className="zone-modal-content">
                    {/* Left: Districts Explorer */}
                    <div className="zone-modal-sidebar">
                        <div className="zone-section-title">Distritos</div>
                        <div className="zone-scroll-area">
                            {districtStats.map(d => (
                                <div
                                    key={d.name}
                                    onClick={() => setActiveDistrict(d.name)}
                                    className={`district-item ${d.name === activeDistrict ? 'active' : ''}`}
                                >
                                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                                        <span className="mini-badge bg-blue-soft">{d.totalClients} 👥</span>
                                        {d.selectedCount > 0 && (
                                            <span className="mini-badge bg-green-soft">{d.selectedCount} ✓</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Caserios Checklist */}
                    <div className="zone-modal-main">
                        <div className="zone-main-header">
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Caseríos en {activeDistrict}</h3>
                            <button onClick={toggleAllInDistrict} className="text-btn">
                                {caserioStats.every(s => s.isSelected) ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                            </button>
                        </div>
                        <div className="zone-scroll-area">
                            {caserioStats.map(s => (
                                <label key={s.name} className={`caserio-item ${s.isSelected ? 'selected' : ''}`}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={s.isSelected}
                                            onChange={() => toggleCaserio(s.name)}
                                            className="caserio-checkbox"
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                                {s.sample ? `Clientes: ${s.sample}...` : 'Sin clientes en esta zona'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: s.totalClients > 0 ? '#3B82F6' : '#9CA3AF' }}>
                                            {s.totalClients}
                                        </div>
                                        {s.isAssignedToOther && (
                                            <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600 }}>Ocupado ⚠️</span>
                                        )}
                                        {s.isAssignedToMe && (
                                            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>Actual ✓</span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Right: Summary Cart */}
                    <div className="zone-modal-cart">
                        <div className="zone-section-title">Resumen de Ruta</div>
                        <div className="zone-scroll-area">
                            {Object.entries(selections).map(([dist, list]) => list.length > 0 && (
                                <div key={dist} className="cart-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--primary)' }}>{dist}</strong>
                                        <button onClick={() => removeDistrict(dist)} className="remove-btn">🗑️</button>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                        {list.length} caseríos: {list.join(', ')}
                                    </div>
                                </div>
                            ))}
                            {totalSelectedCaserios === 0 && (
                                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 1rem' }}>
                                    No hay zonas seleccionadas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="zone-modal-footer">
                    <div style={{ marginRight: 'auto' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{totalSelectedCaserios}</span>
                        <span style={{ color: '#6B7280', marginLeft: '5px' }}>Zonas seleccionadas</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline" style={{ borderRadius: '10px' }}>Cancelar</button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary btn-gradient-orange"
                        disabled={totalSelectedCaserios === 0}
                    >
                        Guardar Ruta Completa
                    </button>
                </div>
            </div>
        </div>
    );
}
