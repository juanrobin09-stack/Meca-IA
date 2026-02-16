export function useConfetti() {
  const celebrate = async () => {
    const confetti = (await import('canvas-confetti')).default

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
    });

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

  const celebrateSuccess = async () => {
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#22c55e', '#4ade80', '#86efac']
    });
  };

  return { celebrate, celebrateSuccess };
}
