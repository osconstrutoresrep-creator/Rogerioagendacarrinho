
import React, { useState, useEffect } from 'react';

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

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem(`tutorial_${pageKey}`);
        if (!hasSeenTutorial) {
            setIsVisible(true);
        }
    }, [pageKey]);

    if (!isVisible || steps.length === 0) return null;

    const step = steps[currentStep];

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

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-scale-in border border-white/10 relative">
                {/* Progress Dots */}
                <div className="flex gap-1.5 mb-6 justify-center">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}
                        />
                    ))}
                </div>

                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-8">
                    {step.content}
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleNext}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] text-lg"
                    >
                        {currentStep === steps.length - 1 ? 'Entendi, Vamos lá!' : 'Próximo'}
                    </button>

                    <div className="flex items-center justify-center gap-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="peer hidden"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                />
                                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-700 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                    <span className="material-icons-round text-white text-[16px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Não mostrar novamente</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
