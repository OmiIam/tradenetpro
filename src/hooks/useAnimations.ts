'use client';

import { useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

// Hook for scroll-triggered animations
export function useScrollAnimation(threshold: number = 0.1) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true,
    margin: '-50px'
  });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return { ref, controls };
}

// Hook for staggered animations
export function useStaggerAnimation(staggerDelay: number = 0.1) {
  const controls = useAnimation();

  const startAnimation = async () => {
    await controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * staggerDelay }
    }));
  };

  return { controls, startAnimation };
}

// Hook for complex sequence animations
export function useSequenceAnimation() {
  const controls = useAnimation();

  const playSequence = async (sequences: Array<{ 
    animate: any; 
    transition?: any; 
    delay?: number; 
  }>) => {
    for (const sequence of sequences) {
      if (sequence.delay) {
        await new Promise(resolve => setTimeout(resolve, sequence.delay));
      }
      await controls.start(sequence.animate, sequence.transition);
    }
  };

  return { controls, playSequence };
}

// Hook for hover animations with variants
export function useHoverAnimation() {
  const controls = useAnimation();

  const onHoverStart = () => {
    controls.start('hover');
  };

  const onHoverEnd = () => {
    controls.start('initial');
  };

  return { controls, onHoverStart, onHoverEnd };
}

// Hook for loading animations
export function useLoadingAnimation(isLoading: boolean) {
  const controls = useAnimation();

  useEffect(() => {
    if (isLoading) {
      controls.start({
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      });
    } else {
      controls.start({
        opacity: 1,
        transition: { duration: 0.3 }
      });
    }
  }, [isLoading, controls]);

  return controls;
}

// Hook for typewriter effect
export function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayText, isComplete };
}

// Hook for count-up animation
export function useCountUp(
  end: number, 
  duration: number = 2000, 
  start: number = 0
) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
    const startTime = Date.now();
    const difference = end - start;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = start + (difference * easeOut);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateCount);
  };

  return { count: Math.floor(count), startAnimation, isAnimating };
}

// Hook for mouse tracking
export function useMouseTracking() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', updateMousePosition);
      return () => element.removeEventListener('mousemove', updateMousePosition);
    }
  }, []);

  return { ref, mousePosition };
}

// Hook for intersection observer animations
export function useIntersectionAnimation(
  animationConfig: {
    initial: any;
    animate: any;
    transition?: any;
  }
) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start(animationConfig.animate, animationConfig.transition);
    }
  }, [isInView, controls, animationConfig]);

  return { ref, controls, isInView };
}

// Hook for particle systems
export function useParticleSystem(count: number = 50) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: Math.random() * 0.02 + 0.005
    }))
  );

  const updateParticles = () => {
    particles.current = particles.current.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: Math.max(0, particle.life - particle.decay)
    })).filter(particle => particle.life > 0);

    // Add new particles if needed
    while (particles.current.length < count) {
      particles.current.push({
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        decay: Math.random() * 0.02 + 0.005
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(updateParticles, 50);
    return () => clearInterval(interval);
  }, [count]);

  return particles.current;
}

// Animation presets
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    }
  },
  float: {
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
};

// Import useState for typewriter hook
import { useState } from 'react';