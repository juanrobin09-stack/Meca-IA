import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Camera, FileText, MapPin, ChevronRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: MessageSquare,
    title: 'Tu as 2 diagnostics GRATUITS !',
    description: 'Décris ton problème de voiture et obtiens un diagnostic pro instantané. Sans carte bancaire.',
    color: 'bg-blue-500'
  },
  {
    icon: Camera,
    title: 'Prends une photo',
    description: 'Voyant allumé ? Pièce bizarre ? Envoie une photo et l\'IA l\'analyse pour toi.',
    color: 'bg-purple-500'
  },
  {
    icon: FileText,
    title: '1 analyse de devis offerte',
    description: 'Upload un devis de garage, on te dit si le prix est correct ou s\'il faut négocier.',
    color: 'bg-green-500'
  },
  {
    icon: MapPin,
    title: 'Trouve un garage',
    description: 'Recherche des garages de confiance près de chez toi avec les vrais avis Google.',
    color: 'bg-orange-500'
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('mecaia_onboarding_done', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('mecaia_onboarding_done', 'true');
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="w-full max-w-md p-8 relative bg-gray-800">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Passer l'introduction"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <motion.div
                className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3 text-white">{step.title}</h2>
              <p className="text-gray-300 mb-8">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'bg-blue-600 w-6' : 'bg-gray-600 w-2'
                }`}
                layout
              />
            ))}
          </div>

          {/* Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleNext} className="w-full" size="lg">
              {currentStep < steps.length - 1 ? (
                <>
                  Suivant <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>C'est parti !</>
              )}
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
