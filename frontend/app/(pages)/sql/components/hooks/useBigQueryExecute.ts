import { useState } from 'react';
import axios from 'axios';

export interface QueryResult {
  schema: { name: string; type: string }[];
  rows: any[];
  total_rows: number;
  cached: boolean;
}

export const useBigQueryExecute = () => {
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.post("http://localhost:8000/api/bigquery/execute", {
        query
      });
      setResults(data);
      return data;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.detail || err.message 
        : "An error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return { results, loading, error, executeQuery, clearResults };
};