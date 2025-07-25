'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'currency' | 'number' | 'percentage';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  animateColor?: boolean;
}

export default function AnimatedNumber({
  value,
  duration = 1,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  animateColor = false
}: AnimatedNumberProps) {
  const [prevValue, setPrevValue] = useState(value);
  const spring = useSpring(value, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => {
    let formatted = '';
    
    switch (format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(current);
        break;
      case 'percentage':
        formatted = `${current.toFixed(decimals)}%`;
        break;
      default:
        formatted = current.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
    }
    
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
    setPrevValue(value);
  }, [value, spring]);

  const isPositive = value > prevValue;
  const isNegative = value < prevValue;

  return (
    <motion.span
      className={`${className} ${
        animateColor
          ? isPositive
            ? 'text-green-400'
            : isNegative
            ? 'text-red-400'
            : 'text-white'
          : ''
      }`}
      animate={
        animateColor
          ? {
              color: isPositive
                ? '#4ade80'
                : isNegative
                ? '#f87171'
                : '#ffffff',
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}