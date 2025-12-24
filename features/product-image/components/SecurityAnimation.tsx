import React, { useState, useEffect, useRef } from 'react';

const DURATION = 3000; // 3 seconds

const SecurityAnimation: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }
            const elapsedTime = timestamp - startTimeRef.current;
            const newProgress = Math.min(Math.floor((elapsedTime / DURATION) * 100), 100);
            setProgress(newProgress);

            if (elapsedTime < DURATION) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const getStatusText = () => {
        if (progress < 25) return "AUTHENTICATING...";
        if (progress < 50) return "CHECKING CREDENTIALS...";
        if (progress < 75) return "ESTABLISHING SECURE CONNECTION...";
        if (progress < 100) return "ENCRYPTING SESSION...";
        return "ACCESS GRANTED";
    };

    return (
        <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center z-50 animate-fade-in">
            <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-200 text-center">
                <style>
                    {`
                        @keyframes scan {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(100%); }
                        }
                        .scan-line {
                            animation: scan 1.5s ease-in-out infinite;
                        }
                    `}
                </style>
                <div className="relative w-24 h-24 mx-auto mb-6 overflow-hidden">
                    <svg className="w-full h-full text-blue-500" viewBox="0 0 100 100">
                        {/* Fingerprint lines */}
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,5 A 45,45 0 0,1 50,95" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,10 A 40,40 0 0,1 50,90" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,15 A 35,35 0 0,1 50,85" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,20 A 30,30 0 0,1 50,80" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,25 A 25,25 0 0,1 50,75" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,30 A 20,20 0 0,1 50,70" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,35 A 15,15 0 0,1 50,65" />
                        <path stroke="currentColor" strokeWidth="2" fill="none" d="M 50,40 A 10,10 0 0,1 50,60" />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="scan-line absolute w-full h-1 bg-cyan-400 opacity-50"></div>
                    </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-800">SECURITY CHECK</h2>
                <div className="mt-4 h-6 text-sm font-mono text-slate-500">
                    <p>{getStatusText()}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-width duration-100" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-lg font-bold mt-2 text-slate-700">{progress}%</p>
            </div>
        </div>
    );
};

export default SecurityAnimation;
