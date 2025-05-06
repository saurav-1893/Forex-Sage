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
    let initialStrategies: TradingStrategy[] = [];
    let initialSelectedId: string | null = null;
    try {
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      if (storedStrategies) {
        const parsedStrategies: TradingStrategy[] = JSON.parse(storedStrategies);
        if (Array.isArray(parsedStrategies) && parsedStrategies.every(s => s.id && s.name && s.rules)) {
          initialStrategies = parsedStrategies;
          if (parsedStrategies.length > 0) {
            // Check if a previously selected ID is still valid
            const currentSelectedId = localStorage.getItem(`${STRATEGIES_STORAGE_KEY}_selected`);
            if (currentSelectedId && parsedStrategies.find(s => s.id === currentSelectedId)) {
              initialSelectedId = currentSelectedId;
            } else {
              initialSelectedId = parsedStrategies[0].id;
            }
          }
        } else {
          initialStrategies = DefaultStrategies;
           if (DefaultStrategies.length > 0) {
            initialSelectedId = DefaultStrategies[0].id;
          }
        }
      } else {
        initialStrategies = DefaultStrategies;
        if (DefaultStrategies.length > 0) {
          initialSelectedId = DefaultStrategies[0].id;
        }
      }
    } catch (error) {
      console.error("Failed to load strategies from localStorage:", error);
      initialStrategies = DefaultStrategies; 
      if (DefaultStrategies.length > 0) {
        initialSelectedId = DefaultStrategies[0].id;
      }
    }
    setStrategies(initialStrategies);
    setSelectedStrategyId(initialSelectedId);
    setIsInitialized(true);
  }, []); 

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
        if (selectedStrategyId) {
          localStorage.setItem(`${STRATEGIES_STORAGE_KEY}_selected`, selectedStrategyId);
        } else {
          localStorage.removeItem(`${STRATEGIES_STORAGE_KEY}_selected`);
        }
      } catch (error) {
        console.error("Failed to save strategies to localStorage:", error);
      }
    }
  }, [strategies, selectedStrategyId, isInitialized]);

  const addStrategy = useCallback((strategy: Omit<TradingStrategy, 'id'>) => {
    const newStrategy: TradingStrategy = { ...strategy, id: uuidv4() };
    setStrategies(prev => {
      const updatedStrategies = [...prev, newStrategy];
      return updatedStrategies;
    });
    setSelectedStrategyId(newStrategy.id); 
    return newStrategy;
  }, []);

  const updateStrategy = useCallback((updatedStrategy: TradingStrategy) => {
    setStrategies(prev => prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s));
  }, []);

  const deleteStrategy = useCallback((strategyId: string) => {
    setStrategies(prev => {
      const newStrategies = prev.filter(s => s.id !== strategyId);
      if (selectedStrategyId === strategyId) {
        const newSelectedId = newStrategies.length > 0 ? newStrategies[0].id : null;
        setSelectedStrategyId(newSelectedId);
      }
      return newStrategies;
    });
  }, [selectedStrategyId]);

  const getStrategyById = useCallback((strategyId: string | null): TradingStrategy | null => {
    if (!strategyId) return null;
    return strategies.find(s => s.id === strategyId) || null;
  }, [strategies]);

  const handleSetSelectedStrategyId = useCallback((id: string | null) => {
    setSelectedStrategyId(id);
  }, []);


  return {
    strategies,
    selectedStrategyId,
    setSelectedStrategyId: handleSetSelectedStrategyId,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    getStrategyById,
    isStrategyManagerInitialized: isInitialized,
  };
}
