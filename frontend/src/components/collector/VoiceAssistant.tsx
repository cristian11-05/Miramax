import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, MessageSquare, Loader, Settings } from 'lucide-react';
import api from '../../services/api';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Speech Recognition Setup
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-PE';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                handleUserMessage(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            const esVoices = available.filter(v => v.lang.startsWith('es'));
            setVoices(esVoices);

            // Intentar seleccionar una voz "Google" o la primera disponible
            const googleVoice = esVoices.find(v => v.name.includes('Google'));
            if (googleVoice) {
                setSelectedVoice(googleVoice);
            } else if (esVoices.length > 0) {
                setSelectedVoice(esVoices[0]);
            }
        };

        loadVoices();

        // Algunos navegadores cargan voces asíncronamente
        window.speechSynthesis.onvoiceschanged = loadVoices;

    }, []);

    const speak = (text: string) => {
        if (synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-PE';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            synthRef.current.speak(utterance);
        }
    };

    const handleUserMessage = async (text: string) => {
        setMessages(prev => [...prev, { role: 'user', text }]);
        setIsProcessing(true);

        try {
            const res = await api.post('/collector/chat', { query: text });
            const answer = res.data.text || "No tengo una respuesta para eso.";

            setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
            speak(answer);

        } catch (error) {
            console.error("AI Error:", error);
            const errMsg = "Tuve un problema de conexión. Intenta de nuevo.";
            setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
            speak(errMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="voice-assistant-fab"
                aria-label="Abrir asistente de voz"
                title="Hablar con el asistente"
            >
                <div className="ping-ring"></div>
                <Mic size={28} />
            </button>

            {/* Chat Interface Modal */}
            {isOpen && (
                <div className="va-overlay">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Asistente AI</h3>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 hover:bg-slate-800 rounded-full transition-colors ${showSettings ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
                                title="Configurar Voz"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white p-2"
                                aria-label="Cerrar asistente"
                                title="Cerrar"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="bg-slate-800 p-4 border-b border-slate-700 animate-in slide-in-from-top-2 fade-in">
                            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">
                                Seleccionar Voz ({voices.length})
                            </label>
                            <select
                                title="Seleccionar voz del asistente"
                                className="w-full bg-slate-900 text-white rounded-lg p-2 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedVoice?.name || ''}
                                onChange={(e) => {
                                    const voice = voices.find(v => v.name === e.target.value);
                                    if (voice) {
                                        setSelectedVoice(voice);
                                        // Prueba de voz
                                        const u = new SpeechSynthesisUtterance("Hola, soy tu asistente.");
                                        u.voice = voice;
                                        synthRef.current.speak(u);
                                    }
                                }}
                            >
                                {voices.map(v => (
                                    <option key={v.name} value={v.name}>
                                        {v.name} ({v.lang})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                                <Mic size={48} className="mb-4" />
                                <p className="text-center">Presiona el micrófono y pregunta <br />sobre tus cobranzas.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                        max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === 'user'
                                        ? 'bg-orange-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}
                                    `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-slate-100 rounded-2xl p-4 rounded-tl-none border border-slate-700 flex items-center gap-2">
                                    <Loader className="animate-spin" size={16} />
                                    <span className="text-xs">Pensando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col items-center justify-center gap-4">
                        <button
                            onClick={toggleListening}
                            className={`va-mic-btn ${isListening ? 'listening' : 'idle'}`}
                            aria-label={isListening ? "Detener escucha" : "Iniciar escucha"}
                            title={isListening ? "Detener" : "Hablar"}
                        >
                            {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                        </button>
                        <p className="text-slate-400 text-sm font-medium">
                            {isListening ? 'Escuchando...' : 'Toca para hablar'}
                        </p>
                    </div>
                </div>

            )}
        </>
    );
};

export default VoiceAssistant;
