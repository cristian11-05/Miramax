
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ubigeoData } from '../../data/ubigeo';
import './ZoneAssignmentModal.css'; // Reuse styles

interface ZoneDefinitionModalProps {
    onClose: () => void;
    onSaveSuccess: () => void;
}

interface Zone {
    name: string;
    description: string;
    caserios: string[]; // List of caserio names
}

export default function ZoneDefinitionModal({ onClose, onSaveSuccess }: ZoneDefinitionModalProps) {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
    const [tempZone, setTempZone] = useState<Zone>({ name: '', description: '', caserios: [] });
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Selector State
    const [activeRegion] = useState('La Libertad');
    const [activeProvince] = useState('Otuzco');
    const [activeDistrict, setActiveDistrict] = useState('Mache');

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        try {
            const { data } = await api.get('/admin/config');
            if (data.config && data.config.defined_zones) {
                const parsed = JSON.parse(data.config.defined_zones);
                setZones(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            await api.put('/admin/config', {
                defined_zones: zones
            });
            alert('Zonas guardadas correctamente');
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar zonas');
        }
    };

    const handleAddNew = () => {
        setTempZone({ name: '', description: '', caserios: [] });
        setEditingZoneIndex(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (index: number) => {
        setTempZone({ ...zones[index] });
        setEditingZoneIndex(index);
        setIsEditorOpen(true);
    };

    const handleDelete = (index: number) => {
        if (confirm('¿Eliminar esta zona?')) {
            const newZones = [...zones];
            newZones.splice(index, 1);
            setZones(newZones);
        }
    };

    // Editor Logic
    const toggleCaserio = (caserio: string) => {
        setTempZone(prev => {
            const list = prev.caserios || [];
            if (list.includes(caserio)) {
                return { ...prev, caserios: list.filter(c => c !== caserio) };
            } else {
                return { ...prev, caserios: [...list, caserio] };
            }
        });
    };

    const saveTempZone = () => {
        if (!tempZone.name.trim()) return alert('Ingrese un nombre para la zona');

        const newZones = [...zones];
        if (editingZoneIndex !== null) {
            newZones[editingZoneIndex] = tempZone;
        } else {
            newZones.push(tempZone);
        }
        setZones(newZones);
        setIsEditorOpen(false);
    };

    // Helper to get districts
    const districts = ubigeoData[activeRegion][activeProvince]
        ? Object.keys(ubigeoData[activeRegion][activeProvince])
        : [];

    const caseriosInDistrict = ubigeoData[activeRegion][activeProvince]?.[activeDistrict] || [];

    if (loading) return <div className="modal-overlay">Cargando...</div>;

    return (
        <div className="modal-overlay zone-modal-overlay">
            <div className={`card zone-modal-container ${isEditorOpen ? 'modal-lg' : ''}`}>
                <div className="zone-modal-header">
                    <h2 className="zone-modal-title">Gestión de Zonas Personalizadas</h2>
                    <button onClick={onClose} className="zone-modal-close-btn">✕</button>
                </div>

                {!isEditorOpen ? (
                    // List View
                    <div className="zone-modal-content zone-modal-content-block">
                        <div className="d-flex justify-between mb-4">
                            <p>Defina zonas que agrupen varios caseríos para facilitar la asignación.</p>
                            <button onClick={handleAddNew} className="btn btn-primary">+ Nueva Zona</button>
                        </div>

                        <div className="grid gap-4">
                            {zones.map((z, idx) => (
                                <div key={idx} className="card p-3 border d-flex justify-between align-center">
                                    <div>
                                        <h4 className="fw-bold">{z.name}</h4>
                                        <div className="text-muted small">
                                            {z.caserios.length} Caseríos: {z.caserios.slice(0, 5).join(', ')}{z.caserios.length > 5 ? '...' : ''}
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button onClick={() => handleEdit(idx)} className="btn btn-sm btn-outline">Editar</button>
                                        <button onClick={() => handleDelete(idx)} className="btn btn-sm btn-outline-error">🗑️</button>
                                    </div>
                                </div>
                            ))}
                            {zones.length === 0 && <div className="text-center text-muted p-4">No hay zonas definidas</div>}
                        </div>
                    </div>
                ) : (
                    // Editor View
                    <div className="zone-modal-content">
                        {/* Sidebar: Location Picker */}
                        <div className="zone-modal-sidebar">
                            <div className="p-3 border-bottom">
                                <label className="form-label">Nombre de la Zona</label>
                                <input
                                    className="form-input"
                                    placeholder="Ej: Ruta Norte"
                                    value={tempZone.name}
                                    onChange={e => setTempZone(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="zone-section-title mt-2">Distritos</div>
                            <div className="zone-scroll-area zone-scroll-area-limited">
                                {districts.map(d => (
                                    <div
                                        key={d}
                                        className={`district-item ${activeDistrict === d ? 'active' : ''}`}
                                        onClick={() => setActiveDistrict(d)}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main: Caserios Checkbox */}
                        <div className="zone-modal-main">
                            <div className="zone-main-header">
                                <h3>Seleccionar Caseríos para: {tempZone.name || 'Nueva Zona'}</h3>
                            </div>
                            <div className="zone-scroll-area">
                                {caseriosInDistrict.map(c => (
                                    <label key={c} className={`caserio-item ${tempZone.caserios.includes(c) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={tempZone.caserios.includes(c)}
                                            onChange={() => toggleCaserio(c)}
                                            className="caserio-checkbox"
                                        />
                                        <span className="ms-2">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Right: Summary */}
                        <div className="zone-modal-cart">
                            <div className="zone-section-title">Caseríos Seleccionados</div>
                            <div className="zone-scroll-area">
                                {tempZone.caserios.length === 0 && <div className="text-muted small p-2">Ninguno seleccionado</div>}
                                {tempZone.caserios.map(c => (
                                    <div key={c} className="p-2 border-bottom small">
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="zone-modal-footer">
                    {isEditorOpen ? (
                        <>
                            <button onClick={() => setIsEditorOpen(false)} className="btn btn-outline">Cancelar Edición</button>
                            <button onClick={saveTempZone} className="btn btn-primary">Guardar Zona Temporally</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="btn btn-outline">Cerrar</button>
                            <button onClick={handleSaveAll} className="btn btn-primary btn-gradient-orange">Guardar Todo</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
