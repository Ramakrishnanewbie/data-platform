import { useState, useEffect } from 'react';
import axios from 'axios';

export interface BigQueryTable {
  name: string;
  columns: string[];
  primaryKey: string | null;
  row_count: number;
}

export interface BigQueryDataset {
  name: string;
  tables: BigQueryTable[];
}

export const useBigQuerySchema = () => {
  const [datasets, setDatasets] = useState<BigQueryDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("http://localhost:8000/api/bigquery/schema");
      setDatasets(data.datasets);
    } catch (err) {
      setError("Failed to fetch schema");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return { datasets, loading, error, refetch: fetchSchema };
};