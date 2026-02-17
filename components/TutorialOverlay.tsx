
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
}

interface TutorialOverlayProps {
    pageKey: string;
    steps: TutorialStep[];
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ pageKey, steps }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0, arrowDirection: 'down' as 'up' | 'down' });
    const [targetFound, setTargetFound] = useState(false);
    const bubbleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem(`tutorial_${pageKey}`);
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [pageKey]);

    useLayoutEffect(() => {
        if (!isVisible || steps.length === 0) return;

        const step = steps[currentStep];
        const targetElement = document.getElementById(step.targetId);

        if (targetElement) {
            setTargetFound(true);
            const updatePosition = () => {
                const rect = targetElement.getBoundingClientRect();
                const scrollY = window.scrollY;

                let arrowDirection: 'up' | 'down' = 'down';
                let top = rect.top + scrollY - 20;

                // If target is too close to top, show bubble below
                if (rect.top < 180) {
                    top = rect.bottom + scrollY + 20;
                    arrowDirection = 'up';
                }

                let left = rect.left + rect.width / 2;

                // Bounds checking for horizontal
                const bWidth = 280;
                const padding = 16;
                if (left < bWidth / 2 + padding) left = bWidth / 2 + padding;
                if (left > window.innerWidth - (bWidth / 2 + padding)) left = window.innerWidth - (bWidth / 2 + padding);

                setBubblePosition({ top, left, arrowDirection });

                // Scroll into view if needed
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        } else {
            setTargetFound(false);
            // Auto-skip if target not found
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                handleComplete();
            }
        }
    }, [isVisible, currentStep, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        if (dontShowAgain) {
            localStorage.setItem(`tutorial_${pageKey}`, 'true');
        }
        setIsVisible(false);
    };

    if (!isVisible || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Background Dim - only visible when target is found */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-[3px] transition-opacity duration-300 pointer-events-auto ${targetFound ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleComplete}
            />

            {/* Speech Bubble */}
            {targetFound && (
                <div
                    ref={bubbleRef}
                    className="absolute pointer-events-auto transition-all duration-300 ease-out"
                    style={{
                        top: bubblePosition.top,
                        left: bubblePosition.left,
                        transform: `translateX(-50%) ${bubblePosition.arrowDirection === 'down' ? 'translateY(-100%)' : 'translateY(0%)'}`
                    }}
                >
                    <div className="bg-white dark:bg-slate-900 w-[280px] rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-scale-in relative">
                        {/* Arrow */}
                        <div
                            className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-900 transition-all ${bubblePosition.arrowDirection === 'down' ? '-bottom-2 border-r border-b border-slate-200 dark:border-slate-800 shadow-[2px_2px_2px_rgba(0,0,0,0.05)]' : '-top-2 border-l border-t border-slate-200 dark:border-slate-800 shadow-[-2px_-2px_2px_rgba(0,0,0,0.05)]'
                                }`}
                        />

                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{step.title}</h3>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-400 uppercase tracking-widest">{currentStep + 1}/{steps.length}</span>
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            {step.content}
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={handleNext}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm"
                            >
                                {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                            </button>

                            <div className="flex items-center justify-center">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="peer hidden"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                    />
                                    <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-700 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                        <span className="material-icons-round text-white text-[12px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">Não mostrar novamente</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorialOverlay;
