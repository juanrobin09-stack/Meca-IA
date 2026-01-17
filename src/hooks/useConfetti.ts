import confetti from 'canvas-confetti';

export function useConfetti() {
  const celebrate = () => {
    // Premier burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
    });

    // Deuxième burst après 200ms
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2563eb', '#3b82f6', '#60a5fa']
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2563eb', '#3b82f6', '#60a5fa']
      });
    }, 400);
  };

  const celebrateSuccess = () => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#22c55e', '#4ade80', '#86efac'] // Vert pour succès
    });
  };

  return { celebrate, celebrateSuccess };
}
