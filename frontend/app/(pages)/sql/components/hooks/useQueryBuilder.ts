import { useState } from 'react';
import { BigQueryTable } from './useBigQuerySchema';

export interface SelectedTable extends BigQueryTable {
  dataset: string;
}

export const useQueryBuilder = () => {
  const [selectedTables, setSelectedTables] = useState<SelectedTable[]>([]);
  const PROJECT_ID = "tokyo-dispatch-475119-i4";

  const addTable = (dataset: string, table: BigQueryTable) => {
    setSelectedTables([...selectedTables, { dataset, ...table }]);
  };

  const removeTable = (idx: number) => {
    setSelectedTables(selectedTables.filter((_, i) => i !== idx));
  };

  const clearTables = () => {
    setSelectedTables([]);
  };

  const generateSQL = (): string => {
    if (selectedTables.length === 0) return "";
    
    let sql = `SELECT *\nFROM \`${PROJECT_ID}.${selectedTables[0].dataset}.${selectedTables[0].name}\` AS ${selectedTables[0].name}`;
    
    for (let i = 1; i < selectedTables.length; i++) {
      const prevTable = selectedTables[i - 1];
      const currTable = selectedTables[i];
      
      const joinColumn = prevTable.columns.find((col: string) => 
        currTable.columns.includes(col)
      );
      
      if (joinColumn) {
        sql += `\nLEFT JOIN \`${PROJECT_ID}.${currTable.dataset}.${currTable.name}\` AS ${currTable.name}\n  ON ${prevTable.name}.${joinColumn} = ${currTable.name}.${joinColumn}`;
      }
    }
    
    sql += "\nLIMIT 100;";
    return sql;
  };

  return {
    selectedTables,
    addTable,
    removeTable,
    clearTables,
    generateSQL
  };
};