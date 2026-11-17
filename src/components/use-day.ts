'use client';
import { useEffect, useState } from 'react';
import { dateKey } from '@/lib/dates';
export function useDay() {
  const [day, setDay] = useState('');
  useEffect(() => {
    const update = () => setDay(dateKey());
    update();
    const timer = setInterval(update, 1000);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  return day;
}
