import { useState, useEffect } from 'react';
import { Shield, MapPin, Maximize, Clock, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SystemCheck({ isOpen, onClose, onStart }) {
    const { isDark } = useTheme();
    const [checks, setChecks] = useState({ location: true, fullscreen: false, time: true });
    const [canStart, setCanStart] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setChecks(prev => ({ ...prev, fullscreen: !!document.fullscreenElement }));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        handleFullscreenChange();
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        setCanStart(checks.location && checks.fullscreen && checks.time);
    }, [checks]);

    const requestFullscreen = async () => {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const checksPassedCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    if (!isOpen) return null;

    // ── theme tokens ──
    const modal = isDark
        ? 'relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden font-sans text-white animate-in fade-in zoom-in duration-300'
        : 'relative w-full max-w-2xl sc-modal rounded-2xl shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in duration-300';

    const closeBtn = isDark
        ? 'absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors'
        : 'absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors';

    const titleCls  = isDark ? 'text-2xl font-bold text-white flex items-center gap-2' : 'text-2xl font-bold text-gray-900 flex items-center gap-2';
    const subCls    = isDark ? 'text-gray-400 mt-1' : 'text-gray-500 mt-1';
    const h3Cls     = isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-800';
    const countCls  = isDark ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm';
    const shieldCls = isDark ? 'w-8 h-8 text-gray-500' : 'w-8 h-8 text-blue-300';

    const checkRow = (passed) => isDark
        ? `p-4 rounded-xl border ${passed ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-red-900/20 border-red-900/50'}`
        : `p-4 rounded-xl border ${passed ? 'sc-check-pass' : 'sc-check-fail'}`;

    const iconWrap = (passed) => isDark
        ? `p-2 rounded-full ${passed ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`
        : `p-2 rounded-full ${passed ? 'sc-icon-pass' : 'sc-icon-fail'}`;

    const checkTitle = isDark ? 'font-semibold text-white' : 'font-semibold text-gray-800';
    const checkDesc  = isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500';

    const fsBtn = isDark
        ? 'mt-3 flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600 transition-all'
        : 'mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all';

    const divider = isDark ? 'border-t border-gray-800 pt-6' : 'border-t border-gray-100 pt-6';
    const infoIcon = isDark
        ? 'w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-xs text-gray-400'
        : 'w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400';
    const readyTitle = isDark ? 'font-semibold text-white text-sm' : 'font-semibold text-gray-800 text-sm';
    const readyDesc  = isDark ? 'text-sm text-gray-400 mt-1' : 'text-sm text-gray-500 mt-1';

    const startBtn = canStart
        ? 'w-full py-4 rounded-lg font-bold text-lg transition-all transform bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] shadow-lg shadow-blue-500/30'
        : isDark
            ? 'w-full py-4 rounded-lg font-bold text-lg bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
            : 'w-full py-4 rounded-lg font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className={modal}>

                <button onClick={onClose} className={closeBtn}>
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className={titleCls}>System Check</h2>
                            <p className={subCls}>Please complete all system checks before proceeding</p>
                        </div>
                        <Shield className={shieldCls} />
                    </div>

                    {/* Status row */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={h3Cls}>System Requirements</h3>
                            <p className={countCls}>{checksPassedCount} of {totalChecks} checks passed</p>
                        </div>
                        {canStart ? (
                            <span className={isDark
                                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-xs font-bold'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold'}>
                                All Checks Passed
                            </span>
                        ) : (
                            <span className={isDark
                                ? 'bg-red-900/40 text-red-400 border border-red-900 px-3 py-1 rounded-full text-xs font-bold'
                                : 'bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold'}>
                                Action Required
                            </span>
                        )}
                    </div>

                    {/* Check rows */}
                    <div className="space-y-4 mb-8">
                        {/* Location */}
                        <div className={`${checkRow(checks.location)} flex items-start justify-between`}>
                            <div className="flex gap-4">
                                <div className={`${iconWrap(checks.location)} h-fit`}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={checkTitle}>Location Verification</h4>
                                    <p className={checkDesc}>Location detection helps prevent unauthorized access</p>
                                </div>
                            </div>
                            {checks.location && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                        </div>

                        {/* Fullscreen */}
                        <div className={`${checkRow(checks.fullscreen)} flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors duration-300`}>
                            <div className="flex gap-4">
                                <div className={`${iconWrap(checks.fullscreen)} h-fit`}>
                                    <Maximize className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={checkTitle}>Fullscreen Mode</h4>
                                    <p className={checkDesc}>Fullscreen mode is required to prevent using other applications</p>
                                    {!checks.fullscreen && (
                                        <button onClick={requestFullscreen} className={fsBtn}>
                                            <Maximize className="w-4 h-4" />
                                            Enable Fullscreen
                                        </button>
                                    )}
                                </div>
                            </div>
                            {checks.fullscreen
                                ? <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                                : <div className="hidden md:block"><X className="w-6 h-6 text-red-400 shrink-0" /></div>
                            }
                        </div>

                        {/* Time */}
                        <div className={`${checkRow(checks.time)} flex items-start justify-between`}>
                            <div className="flex gap-4">
                                <div className={`${iconWrap(checks.time)} h-fit`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={checkTitle}>System Time Check</h4>
                                    <p className={checkDesc}>System time must be synchronized with the server</p>
                                </div>
                            </div>
                            {checks.time && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                        </div>
                    </div>

                    {/* Error banner */}
                    {!canStart && (
                        <div className={`mb-8 p-4 rounded-lg flex gap-3 ${isDark
                            ? 'bg-red-900/20 border border-red-900/50 text-red-400'
                            : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">Unable to start assessment</p>
                                <p className="text-sm mt-1">Please resolve all system requirement issues before continuing.</p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className={divider}>
                        <div className="flex gap-4 mb-6">
                            <div className="mt-1">
                                <div className={infoIcon}>i</div>
                            </div>
                            <div>
                                <h4 className={readyTitle}>Ready to begin?</h4>
                                <p className={readyDesc}>Clicking the button below will start your assessment and timer. Make sure you're fully prepared.</p>
                            </div>
                        </div>
                        <button onClick={onStart} disabled={!canStart} className={startBtn}>
                            Start Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
