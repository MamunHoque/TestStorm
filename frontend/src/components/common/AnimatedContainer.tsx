import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  stagger?: boolean;
  staggerDelay?: number;
}

export function AnimatedContainer({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  stagger = false,
  staggerDelay = 0.1,
}: AnimatedContainerProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20, opacity: 0 };
      case 'down': return { y: -20, opacity: 0 };
      case 'left': return { x: 20, opacity: 0 };
      case 'right': return { x: -20, opacity: 0 };
      case 'fade': return { opacity: 0 };
      default: return { y: 20, opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up':
      case 'down': return { y: 0, opacity: 1 };
      case 'left':
      case 'right': return { x: 0, opacity: 1 };
      case 'fade': return { opacity: 1 };
      default: return { y: 0, opacity: 1 };
    }
  };

  if (stagger) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: delay,
            },
          },
        }}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: getInitialPosition(),
              visible: {
                ...getAnimatePosition(),
                transition: {
                  duration,
                  ease: [0.25, 0.46, 0.45, 0.94],
                },
              },
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

interface TabTransitionProps {
  children: React.ReactNode;
  activeKey: string;
  className?: string;
}

export function TabTransition({ children, activeKey, className = '' }: TabTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        className={className}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface PanelTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export function PanelTransition({ children, isVisible, className = '' }: PanelTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ScaleTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export function ScaleTransition({ children, isVisible, className = '' }: ScaleTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}