"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TradingStrategy } from '@/types/strategy';
import { DefaultStrategies } from '@/types/strategy';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const STRATEGIES_STORAGE_KEY = 'forexSageTradingStrategies';

export function useStrategyManager() {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      if (storedStrategies) {
        const parsedStrategies: TradingStrategy[] = JSON.parse(storedStrategies);
        // Basic validation, could be enhanced with Zod parsing if needed
        if (Array.isArray(parsedStrategies) && parsedStrategies.every(s => s.id && s.name && s.rules)) {
          setStrategies(parsedStrategies);
          if (parsedStrategies.length > 0 && !selectedStrategyId) {
            setSelectedStrategyId(parsedStrategies[0].id);
          }
        } else {
          // Corrupted data, initialize with defaults
          setStrategies(DefaultStrategies);
           if (DefaultStrategies.length > 0) {
            setSelectedStrategyId(DefaultStrategies[0].id);
          }
        }
      } else {
        // No stored strategies, initialize with defaults
        setStrategies(DefaultStrategies);
        if (DefaultStrategies.length > 0) {
          setSelectedStrategyId(DefaultStrategies[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load strategies from localStorage:", error);
      setStrategies(DefaultStrategies); // Fallback to defaults on error
      if (DefaultStrategies.length > 0) {
        setSelectedStrategyId(DefaultStrategies[0].id);
      }
    }
    setIsInitialized(true);
  }, []); // selectedStrategyId removed from dependencies to avoid re-selection loop

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
      } catch (error) {
        console.error("Failed to save strategies to localStorage:", error);
      }
    }
  }, [strategies, isInitialized]);

  const addStrategy = useCallback((strategy: Omit<TradingStrategy, 'id'>) => {
    const newStrategy: TradingStrategy = { ...strategy, id: uuidv4() };
    setStrategies(prev => [...prev, newStrategy]);
    setSelectedStrategyId(newStrategy.id); // Optionally select the new strategy
    return newStrategy;
  }, []);

  const updateStrategy = useCallback((updatedStrategy: TradingStrategy) => {
    setStrategies(prev => prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s));
  }, []);

  const deleteStrategy = useCallback((strategyId: string) => {
    setStrategies(prev => {
      const newStrategies = prev.filter(s => s.id !== strategyId);
      if (selectedStrategyId === strategyId) {
        setSelectedStrategyId(newStrategies.length > 0 ? newStrategies[0].id : null);
      }
      return newStrategies;
    });
  }, [selectedStrategyId]);

  const getStrategyById = useCallback((strategyId: string | null): TradingStrategy | null => {
    if (!strategyId) return null;
    return strategies.find(s => s.id === strategyId) || null;
  }, [strategies]);

  return {
    strategies,
    selectedStrategyId,
    setSelectedStrategyId,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    getStrategyById,
    isStrategyManagerInitialized: isInitialized,
  };
}
