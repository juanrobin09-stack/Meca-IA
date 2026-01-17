import { motion } from 'framer-motion';
import { Button } from './button';
import type { ButtonProps } from './button';
import { forwardRef } from 'react';

const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-block"
      >
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
