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

    // Defined Zones
    const [definedZones, setDefinedZones] = useState<{ name: string, caserios: string[] }[]>([]);
    const [showZoneSelector, setShowZoneSelector] = useState(false);

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

    const loadDefinedZones = async () => {
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

    useEffect(() => {
        loadDefinedZones();
    }, []);

    const handleApplyZone = (zone: { name: string, caserios: string[] }) => {
        if (!confirm(`¿Aplicar zona "${zone.name}"? Esto agregará ${zone.caserios.length} caseríos a la selección.`)) return;

        const newSelections = { ...selections };

        zone.caserios.forEach(caserioName => {
            // Find district for this caserio (reverse lookup needed essentially, or search all districts)
            // Since we know region/province (Otuzco), we can search districts
            const districts = getDistricts(selectedRegion, selectedProvince);
            for (const d of districts) {
                const districtCaserios = getCaserios(selectedRegion, selectedProvince, d);
                if (districtCaserios.includes(caserioName)) {
                    if (!newSelections[d]) newSelections[d] = [];
                    if (!newSelections[d].includes(caserioName)) {
                        newSelections[d].push(caserioName);
                    }
                    break; // Found the district
                }
            }
        });

        setSelections(newSelections);
        setShowZoneSelector(false);
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
            <div className="card zone-modal-container spinner-container">
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
                        <div className="zone-header-controls">
                            <p className="zone-modal-subtitle">Configurando cobertura para <strong>{collector.full_name}</strong></p>
                            <button onClick={() => setShowZoneSelector(!showZoneSelector)} className="btn btn-sm btn-outline text-primary btn-load-zone">
                                📥 Cargar Zona Predefinida
                            </button>
                            {showZoneSelector && (
                                <div className="zone-selector-dropdown">
                                    {definedZones.map(z => (
                                        <div
                                            key={z.name}
                                            className="zone-selector-item"
                                            onClick={() => handleApplyZone(z)}
                                        >
                                            {z.name} ({z.caserios.length})
                                        </div>
                                    ))}
                                    {definedZones.length === 0 && <div className="p-2 text-muted">No hay zonas definidas</div>}
                                </div>
                            )}
                        </div>
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
                                    <div className="district-name">{d.name}</div>
                                    <div className="district-badges">
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
                            <h3 className="caserios-header-title">Caseríos en {activeDistrict}</h3>
                            <button onClick={toggleAllInDistrict} className="text-btn">
                                {caserioStats.every(s => s.isSelected) ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                            </button>
                        </div>
                        <div className="zone-scroll-area">
                            {caserioStats.map(s => (
                                <label key={s.name} className={`caserio-item ${s.isSelected ? 'selected' : ''}`}>
                                    <div className="caserio-row">
                                        <input
                                            type="checkbox"
                                            checked={s.isSelected}
                                            onChange={() => toggleCaserio(s.name)}
                                            className="caserio-checkbox"
                                        />
                                        <div className="caserio-text-col">
                                            <div className="caserio-name">{s.name}</div>
                                            <div className="caserio-sub">
                                                {s.sample ? `Clientes: ${s.sample}...` : 'Sin clientes en esta zona'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="caserio-stats-col">
                                        <div className={`stat-total ${s.totalClients > 0 ? 'has-clients' : ''}`}>
                                            {s.totalClients}
                                        </div>
                                        {s.isAssignedToOther && (
                                            <span className="stat-badge-occupied">Ocupado ⚠️</span>
                                        )}
                                        {s.isAssignedToMe && (
                                            <span className="stat-badge-current">Actual ✓</span>
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
                                    <div className="cart-item-header">
                                        <strong className="cart-district-name">{dist}</strong>
                                        <button onClick={() => removeDistrict(dist)} className="remove-btn">🗑️</button>
                                    </div>
                                    <div className="cart-list-text">
                                        {list.length} caseríos: {list.join(', ')}
                                    </div>
                                </div>
                            ))}
                            {totalSelectedCaserios === 0 && (
                                <div className="cart-empty">
                                    No hay zonas seleccionadas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="zone-modal-footer">
                    <div className="footer-stats-left">
                        <span className="footer-count">{totalSelectedCaserios}</span>
                        <span className="footer-label">Zonas seleccionadas</span>
                    </div>
                    <button onClick={onClose} className="btn btn-outline btn-cancel">Cancelar</button>
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
