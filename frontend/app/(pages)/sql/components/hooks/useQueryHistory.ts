
import { useState, useEffect } from 'react';

export interface QueryHistoryItem {
  id: string;
  sql: string;
  query: string; 
  timestamp: Date | number; 
  executionTime?: number;
  rowCount?: number;
  error?: boolean; 
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  tags: string[];
  createdAt: Date;
  isFavorite: boolean;
}

export const useQueryHistory = () => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

  useEffect(() => {
    // Load from localStorage
    const savedHistory = localStorage.getItem('query_history');
    const savedQueriesData = localStorage.getItem('saved_queries');

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (savedQueriesData) {
      setSavedQueries(JSON.parse(savedQueriesData));
    }
  }, []);

  const addToHistory = (
    sql: string, 
    executionTime?: number, 
    rowCount?: number,
    hasError?: boolean
  ) => {
    const timestamp = Date.now();
    const newItem: QueryHistoryItem = {
      id: timestamp.toString(),
      sql,
      query: sql, // Alias for compatibility
      timestamp,
      executionTime,
      rowCount,
      error: hasError || false,
    };

    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('query_history', JSON.stringify(updatedHistory));
  };

  const saveQuery = (name: string, sql: string, tags: string[] = []) => {
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name,
      sql,
      tags,
      createdAt: new Date(),
      isFavorite: false,
    };

    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('saved_queries', JSON.stringify(updated));
  };

  const deleteQuery = (id: string) => {
    const updated = savedQueries.filter((q) => q.id !== id);
    setSavedQueries(updated);
    localStorage.setItem('saved_queries', JSON.stringify(updated));
  };

  const toggleFavorite = (id: string) => {
    const updated = savedQueries.map((q) =>
      q.id === id ? { ...q, isFavorite: !q.isFavorite } : q
    );
    setSavedQueries(updated);
    localStorage.setItem('saved_queries', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('query_history');
  };

  return {
    history,
    savedQueries,
    addToHistory,
    saveQuery,
    deleteQuery,
    toggleFavorite,
    clearHistory,
  };
};