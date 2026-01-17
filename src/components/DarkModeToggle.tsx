import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/hooks/useDarkMode';

export function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-500" />
      )}
    </motion.button>
  );
}
