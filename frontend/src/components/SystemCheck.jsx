import { useState, useEffect } from 'react';
import { Shield, MapPin, Maximize, Clock, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SystemCheck({ isOpen, onClose, onStart }) {
    const [checks, setChecks] = useState({
        location: true, // Mocked as passed
        fullscreen: false,
        time: true // Mocked as passed
    });
    const [canStart, setCanStart] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            setChecks(prev => ({ ...prev, fullscreen: isFullscreen }));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Initial check
        handleFullscreenChange();

        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (checks.location && checks.fullscreen && checks.time) {
            setCanStart(true);
        } else {
            setCanStart(false);
        }
    }, [checks]);

    const requestFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error("Error attempting to enable full-screen mode:", err);
        }
    };

    const checksPassedCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden font-sans text-white animate-in fade-in zoom-in duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                System Check
                            </h2>
                            <p className="text-gray-400 mt-1">Please complete all system checks before proceeding</p>
                        </div>
                        <Shield className="w-8 h-8 text-gray-500" />
                    </div>

                    {/* Status Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">System Requirements</h3>
                            <p className="text-gray-500 text-sm">{checksPassedCount} of {totalChecks} checks passed</p>
                        </div>
                        {canStart ? (
                            <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-xs font-bold">
                                All Checks Passed
                            </span>
                        ) : (
                            <span className="bg-red-900/40 text-red-400 border border-red-900 px-3 py-1 rounded-full text-xs font-bold">
                                Action Required
                            </span>
                        )}

                    </div>

                    <div className="space-y-4 mb-8">
                        {/* Location Check */}
                        <div className={`p-4 rounded-xl border ${checks.location ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-red-900/20 border-red-900/50'} flex items-start justify-between`}>
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-full ${checks.location ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">Location Verification</h4>
                                    <p className="text-sm text-gray-400">Location detection helps prevent unauthorized access</p>
                                </div>
                            </div>
                            {checks.location && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                        </div>

                        {/* Fullscreen Check */}
                        <div className={`p-4 rounded-xl border ${checks.fullscreen ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-red-900/20 border-red-900/50'} flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors duration-300`}>
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-full ${checks.fullscreen ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'} h-fit`}>
                                    <Maximize className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">Fullscreen Mode</h4>
                                    <p className="text-sm text-gray-400">Fullscreen mode is required to prevent using other applications</p>

                                    {!checks.fullscreen && (
                                        <button
                                            onClick={requestFullscreen}
                                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600 transition-all"
                                        >
                                            <Maximize className="w-4 h-4" />
                                            Enable Fullscreen
                                        </button>
                                    )}
                                </div>
                            </div>
                            {checks.fullscreen ? (
                                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                            ) : (
                                <div className="hidden md:block">
                                    <X className="w-6 h-6 text-red-400 shrink-0" />
                                </div>
                            )}
                        </div>

                        {/* Time Check */}
                        <div className={`p-4 rounded-xl border ${checks.time ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-red-900/20 border-red-900/50'} flex items-start justify-between`}>
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-full ${checks.time ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">System Time Check</h4>
                                    <p className="text-sm text-gray-400">System time must be synchronized with the server</p>
                                </div>
                            </div>
                            {checks.time && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                        </div>
                    </div>

                    {!canStart && (
                        <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex gap-3 text-red-400">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">Unable to start assessment</p>
                                <p className="text-sm mt-1">Please resolve all system requirement issues before continuing.</p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-800 pt-6">
                        <div className="flex gap-4 mb-6">
                            <div className="mt-1">
                                <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-xs text-gray-400">i</div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Ready to begin?</h4>
                                <p className="text-sm text-gray-400 mt-1">Clicking the button below will start your assessment and timer. Make sure you're fully prepared.</p>
                            </div>
                        </div>

                        <button
                            onClick={onStart}
                            disabled={!canStart}
                            className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform ${canStart
                                ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] shadow-lg shadow-blue-900/30'
                                : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                                }`}
                        >
                            Start Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}