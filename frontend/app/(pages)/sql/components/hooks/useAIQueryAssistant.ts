import { useState } from 'react';
import axios from 'axios';

export const useAIQueryAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSQLFromNaturalLanguage = async (
    prompt: string,
    schema: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post('http://localhost:8000/api/ai/generate-sql', {
        prompt,
        schema,
      });
      return data.sql;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Failed to generate SQL';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const explainQuery = async (sql: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post('http://localhost:8000/api/ai/explain-query', {
        sql,
      });
      return data.explanation;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Failed to explain query';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const optimizeQuery = async (sql: string): Promise<{
    optimized_sql: string;
    suggestions: string[];
  }> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post('http://localhost:8000/api/ai/optimize-query', {
        sql,
      });
      return data;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Failed to optimize query';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateSQLFromNaturalLanguage,
    explainQuery,
    optimizeQuery,
  };
};