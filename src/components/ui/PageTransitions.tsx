'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Page transition variants
const pageVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideRight: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' }
  }
};

export function PageTransition({
  children,
  className = '',
  variant = 'fadeIn'
}: PageTransitionProps & { variant?: keyof typeof pageVariants }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants[variant]}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered children animation
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = ''
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Reveal animations
interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = ''
}: RevealProps) {
  const directionVariants = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 }
  };

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        ...directionVariants[direction]
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}

// Counter animation
interface CounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  from,
  to,
  duration = 2,
  className = '',
  prefix = '',
  suffix = ''
}: CounterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ textContent: from }}
        whileInView={{ textContent: to }}
        viewport={{ once: true }}
        transition={{
          duration,
          ease: 'easeOut'
        }}
        onUpdate={(latest) => {
          // This would need a ref to update the DOM directly
          // For now, we'll use a simpler approach
        }}
      >
        {prefix}{to}{suffix}
      </motion.span>
    </motion.span>
  );
}

// Parallax scroll effect
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({
  children,
  speed = 0.5,
  className = ''
}: ParallaxProps) {
  return (
    <motion.div
      className={className}
      style={{
        y: `${speed * 100}%`
      }}
      whileInView={{
        y: `-${speed * 100}%`
      }}
      viewport={{ once: false }}
      transition={{
        duration: 0,
        ease: 'linear'
      }}
    >
      {children}
    </motion.div>
  );
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
}

export function Typewriter({
  text,
  speed = 50,
  className = '',
  cursor = true
}: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(true);

  React.useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  React.useEffect(() => {
    if (cursor) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);

      return () => clearInterval(cursorInterval);
    }
  }, [cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && <span className={showCursor ? 'opacity-100' : 'opacity-0'}>|</span>}
    </span>
  );
}