from fastapi import APIRouter, Depends, HTTPException
from google.cloud import bigquery
from typing import List, Dict, Any
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def get_bq_client():
    """Dependency to get BigQuery client - replace with your auth logic"""
    return bigquery.Client()


@router.get("/bigquery/assets")
async def get_bigquery_assets(
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Fetch all BigQuery projects, datasets, and tables/views with metadata.
    This uses INFORMATION_SCHEMA for comprehensive asset discovery.
    """
    try:
        # Get the project ID from the client
        project_id = client.project
        
        # Fetch all datasets in the project
        datasets = list(client.list_datasets(project=project_id))
        
        datasets_data = []
        
        for dataset_ref in datasets:
            try:
                # Get full dataset object
                dataset = client.get_dataset(dataset_ref.reference)
                dataset_id = dataset.dataset_id
                
                # Use Python API to list tables - way more reliable than SQL queries
                tables = list(client.list_tables(dataset_id))
                
                assets = []
                for table_item in tables:
                    try:
                        # Get full table metadata
                        table_ref = client.get_table(f"{project_id}.{dataset_id}.{table_item.table_id}")
                        
                        # Determine asset type
                        asset_type = "table"
                        if table_ref.table_type == "VIEW":
                            asset_type = "view"
                        elif table_ref.table_type == "MATERIALIZED_VIEW":
                            asset_type = "materialized_view"
                        elif table_ref.table_type == "EXTERNAL":
                            asset_type = "external"
                        
                        assets.append({
                            "name": table_ref.table_id,
                            "type": asset_type,
                            "rowCount": table_ref.num_rows,
                            "sizeBytes": table_ref.num_bytes,
                            "lastModified": table_ref.modified.isoformat() if table_ref.modified else None,
                            "creationTime": table_ref.created.isoformat() if table_ref.created else None,
                        })
                    except Exception as table_error:
                        logger.debug(f"Could not get metadata for {table_item.table_id}: {str(table_error)}")
                        continue
                        
            except Exception as e:
                logger.warning(f"Could not fetch tables for {dataset_id}: {str(e)}")
                continue
            
            if assets:  # Only include datasets that have assets
                datasets_data.append({
                    "name": dataset_id,
                    "location": dataset.location,
                    "assets": assets
                })
        
        # Return data grouped by project
        result = {
            "projects": [{
                "id": project_id,
                "name": project_id,
                "datasets": datasets_data
            }],
            "totalProjects": 1,
            "totalDatasets": len(datasets_data),
            "totalAssets": sum(len(d["assets"]) for d in datasets_data)
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching BigQuery assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bigquery/lineage/{project_id}/{dataset_id}/{table_id}")
async def get_table_lineage(
    project_id: str,
    dataset_id: str,
    table_id: str,
    direction: str = "both",  # upstream, downstream, or both
    depth: int = 3,
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Get lineage for a specific table using BigQuery job history and table metadata.
    
    Args:
        project_id: GCP project ID
        dataset_id: BigQuery dataset ID
        table_id: BigQuery table ID
        direction: 'upstream' (dependencies), 'downstream' (dependents), or 'both'
        depth: How many levels to traverse (1-5)
    """
    try:
        nodes = []
        edges = []
        visited = set()
        
        # Start with the root table
        root_node = {
            "id": f"{project_id}.{dataset_id}.{table_id}",
            "label": table_id,
            "type": "table",
            "projectId": project_id,
            "datasetId": dataset_id,
            "tableName": table_id,
            "level": 0
        }
        nodes.append(root_node)
        visited.add(root_node["id"])
        
        # Get upstream dependencies if requested
        if direction in ["upstream", "both"]:
            upstream_deps = await get_upstream_dependencies(
                client, project_id, dataset_id, table_id, depth
            )
            nodes.extend(upstream_deps["nodes"])
            edges.extend(upstream_deps["edges"])
        
        # Get downstream dependencies if requested
        if direction in ["downstream", "both"]:
            downstream_deps = await get_downstream_dependencies(
                client, project_id, dataset_id, table_id, depth
            )
            nodes.extend(downstream_deps["nodes"])
            edges.extend(downstream_deps["edges"])
        
        # Remove duplicates
        unique_nodes = {node["id"]: node for node in nodes}
        unique_edges = list({f"{edge['source']}-{edge['target']}": edge for edge in edges}.values())
        
        return {
            "nodes": list(unique_nodes.values()),
            "edges": unique_edges,
            "rootNode": root_node["id"]
        }
        
    except Exception as e:
        logger.error(f"Error fetching lineage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def get_upstream_dependencies(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    table_id: str,
    max_depth: int
) -> Dict[str, Any]:
    """Get tables that this table depends on (upstream)"""
    nodes = []
    edges = []
    
    # Query job history for queries that wrote to this table
    try:
        jobs_query = f"""
        SELECT DISTINCT
            referenced_tables.project_id as source_project,
            referenced_tables.dataset_id as source_dataset,
            referenced_tables.table_id as source_table
        FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT,
        UNNEST(referenced_tables) as referenced_tables
        WHERE destination_table.project_id = '{project_id}'
        AND destination_table.dataset_id = '{dataset_id}'
        AND destination_table.table_id = '{table_id}'
        AND creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        AND statement_type IN ('INSERT', 'CREATE_TABLE_AS_SELECT', 'MERGE')
        LIMIT 100
        """
        
        query_job = client.query(jobs_query)
        results = query_job.result()
        
        for row in results:
            if row.source_table:
                source_id = f"{row.source_project}.{row.source_dataset}.{row.source_table}"
                target_id = f"{project_id}.{dataset_id}.{table_id}"
                
                nodes.append({
                    "id": source_id,
                    "label": row.source_table,
                    "type": "table",
                    "projectId": row.source_project,
                    "datasetId": row.source_dataset,
                    "tableName": row.source_table,
                    "level": 1
                })
                
                edges.append({
                    "source": source_id,
                    "target": target_id,
                    "type": "dependency"
                })
    except Exception as e:
        logger.warning(f"Could not fetch upstream dependencies: {str(e)}")
    
    return {"nodes": nodes, "edges": edges}


async def get_downstream_dependencies(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    table_id: str,
    max_depth: int
) -> Dict[str, Any]:
    """Get tables that depend on this table (downstream)"""
    nodes = []
    edges = []
    
    # Query job history to find queries that read from this table
    try:
        jobs_query = f"""
        SELECT DISTINCT
            destination_table.project_id as target_project,
            destination_table.dataset_id as target_dataset,
            destination_table.table_id as target_table
        FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT,
        UNNEST(referenced_tables) as referenced_tables
        WHERE referenced_tables.project_id = '{project_id}'
        AND referenced_tables.dataset_id = '{dataset_id}'
        AND referenced_tables.table_id = '{table_id}'
        AND destination_table.table_id IS NOT NULL
        AND creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        AND statement_type IN ('INSERT', 'CREATE_TABLE_AS_SELECT', 'MERGE')
        LIMIT 100
        """
        
        query_job = client.query(jobs_query)
        results = query_job.result()
        
        for row in results:
            if row.target_table:
                source_id = f"{project_id}.{dataset_id}.{table_id}"
                target_id = f"{row.target_project}.{row.target_dataset}.{row.target_table}"
                
                nodes.append({
                    "id": target_id,
                    "label": row.target_table,
                    "type": "table",
                    "projectId": row.target_project,
                    "datasetId": row.target_dataset,
                    "tableName": row.target_table,
                    "level": 1
                })
                
                edges.append({
                    "source": source_id,
                    "target": target_id,
                    "type": "dependency"
                })
    except Exception as e:
        logger.warning(f"Could not fetch downstream dependencies: {str(e)}")
    
    return {"nodes": nodes, "edges": edges}