from fastapi import APIRouter, Depends, HTTPException
from google.cloud import bigquery
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from redis_cache import get_cache, generate_cache_key, TTL_ASSETS, TTL_LINEAGE

router = APIRouter()
logger = logging.getLogger(__name__)


def get_bq_client():
    """Dependency to get BigQuery client"""
    return bigquery.Client()


@router.get("/bigquery/table-metadata/{project_id}/{dataset_id}/{table_id}")
async def get_table_metadata(
    project_id: str,
    dataset_id: str,
    table_id: str,
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Get comprehensive metadata for a specific table.
    Includes schema, stats, and table properties.
    """
    cache = get_cache()
    cache_key = generate_cache_key("metadata", project_id, dataset_id, table_id)
    
    # Try cache first
    if cache and cache.is_connected():
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"✨ Returning cached metadata for {project_id}.{dataset_id}.{table_id}")
            cached_data["cached"] = True
            return cached_data
    
    logger.info(f"🔄 Fetching fresh metadata for {project_id}.{dataset_id}.{table_id}")
    
    try:
        # Get full table reference
        table_ref = client.get_table(f"{project_id}.{dataset_id}.{table_id}")
        
        # Determine table type
        table_type = "table"
        if table_ref.table_type == "VIEW":
            table_type = "view"
        elif table_ref.table_type == "MATERIALIZED_VIEW":
            table_type = "materialized_view"
        elif table_ref.table_type == "EXTERNAL":
            table_type = "external"
        
        # Build schema information
        schema = []
        for field in table_ref.schema:
            schema.append({
                "name": field.name,
                "type": field.field_type,
                "mode": field.mode,
                "description": field.description or "",
            })
        
        # Calculate data freshness
        last_modified = table_ref.modified
        if last_modified:
            hours_since_modified = (datetime.now(last_modified.tzinfo) - last_modified).total_seconds() / 3600
            if hours_since_modified < 24:
                freshness = "fresh"  # 🟢
            elif hours_since_modified < 168:  # 7 days
                freshness = "recent"  # 🟡
            else:
                freshness = "stale"  # 🔴
        else:
            freshness = "unknown"
        
        # Get view definition if it's a view
        view_query = None
        if table_type in ["view", "materialized_view"]:
            view_query = table_ref.view_query or table_ref.mview_query
        
        # Get partitioning info
        partitioning_info = None
        if table_ref.time_partitioning:
            partitioning_info = {
                "type": table_ref.time_partitioning.type_,
                "field": table_ref.time_partitioning.field,
                "expiration_ms": table_ref.time_partitioning.expiration_ms
            }
        
        # Get clustering info
        clustering_fields = table_ref.clustering_fields if table_ref.clustering_fields else []
        
        result = {
            "projectId": project_id,
            "datasetId": dataset_id,
            "tableId": table_id,
            "tableName": table_id,
            "type": table_type,
            "schema": schema,
            "numRows": table_ref.num_rows,
            "numBytes": table_ref.num_bytes,
            "createdAt": table_ref.created.isoformat() if table_ref.created else None,
            "modifiedAt": table_ref.modified.isoformat() if table_ref.modified else None,
            "freshness": freshness,
            "description": table_ref.description or "",
            "labels": dict(table_ref.labels) if table_ref.labels else {},
            "location": table_ref.location,
            "viewQuery": view_query,
            "partitioning": partitioning_info,
            "clusteringFields": clustering_fields,
            "expirationTime": table_ref.expires.isoformat() if table_ref.expires else None,
            "cached": False
        }
        
        # Cache for 6 hours (metadata doesn't change often)
        if cache and cache.is_connected():
            cache.set(cache_key, result, ttl=TTL_ASSETS)
            logger.info(f"💾 Cached table metadata with TTL={TTL_ASSETS}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching table metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bigquery/table-preview/{project_id}/{dataset_id}/{table_id}")
async def get_table_preview(
    project_id: str,
    dataset_id: str,
    table_id: str,
    limit: int = 10,
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Get a preview of table data (first N rows).
    """
    cache = get_cache()
    cache_key = generate_cache_key("preview", project_id, dataset_id, table_id, limit)
    
    # Try cache first
    if cache and cache.is_connected():
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"✨ Returning cached preview for {project_id}.{dataset_id}.{table_id}")
            cached_data["cached"] = True
            return cached_data
    
    logger.info(f"🔄 Fetching fresh preview for {project_id}.{dataset_id}.{table_id}")
    
    try:
        # Query to get preview data
        query = f"""
        SELECT *
        FROM `{project_id}.{dataset_id}.{table_id}`
        LIMIT {limit}
        """
        
        query_job = client.query(query)
        results = query_job.result()
        
        # Get schema
        schema = [{"name": field.name, "type": field.field_type} for field in results.schema]
        
        # Get rows
        rows = []
        for row in results:
            row_dict = {}
            for key, value in dict(row).items():
                # Convert to JSON-serializable format
                if isinstance(value, datetime):
                    row_dict[key] = value.isoformat()
                elif isinstance(value, bytes):
                    row_dict[key] = value.decode('utf-8', errors='ignore')
                else:
                    row_dict[key] = value
            rows.append(row_dict)
        
        result = {
            "projectId": project_id,
            "datasetId": dataset_id,
            "tableId": table_id,
            "schema": schema,
            "rows": rows,
            "totalRows": len(rows),
            "limit": limit,
            "cached": False
        }
        
        # Cache for 1 hour (preview can change)
        if cache and cache.is_connected():
            cache.set(cache_key, result, ttl=TTL_LINEAGE)
            logger.info(f"💾 Cached table preview with TTL={TTL_LINEAGE}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching table preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bigquery/assets")
async def get_bigquery_assets(
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Fetch all BigQuery projects, datasets, and tables/views with metadata.
    Uses Redis caching with 6 hour TTL for performance.
    """
    cache = get_cache()
    cache_key = "assets:all_projects"
    
    # Try cache first
    if cache and cache.is_connected():
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info("✨ Returning cached assets data")
            cached_data["cached"] = True
            return cached_data
    
    logger.info("🔄 Fetching fresh assets data from BigQuery...")
    
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
            "totalAssets": sum(len(d["assets"]) for d in datasets_data),
            "cached": False
        }
        
        # Cache the result for 6 hours
        if cache and cache.is_connected():
            cache.set(cache_key, result, ttl=TTL_ASSETS)
            logger.info(f"💾 Cached assets data with TTL={TTL_ASSETS}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching BigQuery assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bigquery/lineage/{project_id}/{dataset_id}/{table_id}")
async def get_table_lineage(
    project_id: str,
    dataset_id: str,
    table_id: str,
    direction: str = "both",
    depth: int = 3,
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Get lineage for a specific table using BigQuery job history and table metadata.
    """
    cache = get_cache()
    cache_key = generate_cache_key(
        "lineage",
        project_id,
        dataset_id,
        table_id,
        direction,
        depth
    )
    
    # Try cache first
    if cache and cache.is_connected():
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"✨ Returning cached lineage for {project_id}.{dataset_id}.{table_id}")
            cached_data["cached"] = True
            return cached_data
    
    logger.info(f"🔄 Fetching fresh lineage data for {project_id}.{dataset_id}.{table_id}")
    
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
        
        result = {
            "nodes": list(unique_nodes.values()),
            "edges": unique_edges,
            "rootNode": root_node["id"],
            "cached": False
        }
        
        # Cache the result for 1 hour
        if cache and cache.is_connected():
            cache.set(cache_key, result, ttl=TTL_LINEAGE)
            logger.info(f"💾 Cached lineage data with TTL={TTL_LINEAGE}s")
        
        return result
        
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



@router.get("/bigquery/edge-query/{source_table}/{target_table}")
async def get_edge_query(
    source_table: str,  # Format: project.dataset.table
    target_table: str,  # Format: project.dataset.table
    client: bigquery.Client = Depends(get_bq_client)
) -> Dict[str, Any]:
    """
    Get the SQL query that created the relationship between two tables.
    Searches job history for queries where source was read and target was written.
    """
    cache = get_cache()
    cache_key = generate_cache_key("edge-query", source_table, target_table)
    
    # Try cache first
    if cache and cache.is_connected():
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"✨ Returning cached edge query for {source_table} → {target_table}")
            cached_data["cached"] = True
            return cached_data
    
    logger.info(f"🔄 Fetching edge query for {source_table} → {target_table}")
    
    try:
        # Parse table names
        source_parts = source_table.split('.')
        target_parts = target_table.split('.')
        
        if len(source_parts) != 3 or len(target_parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid table format. Use: project.dataset.table")
        
        source_project, source_dataset, source_table_name = source_parts
        target_project, target_dataset, target_table_name = target_parts
        
        # Query to find the job that created this relationship
        jobs_query = f"""
        SELECT 
            query,
            job_id,
            user_email,
            start_time,
            end_time,
            total_bytes_processed,
            total_slot_ms,
            statement_type,
            TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) as duration_ms
        FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT,
        UNNEST(referenced_tables) as referenced_tables
        WHERE referenced_tables.project_id = '{source_project}'
        AND referenced_tables.dataset_id = '{source_dataset}'
        AND referenced_tables.table_id = '{source_table_name}'
        AND destination_table.project_id = '{target_project}'
        AND destination_table.dataset_id = '{target_dataset}'
        AND destination_table.table_id = '{target_table_name}'
        AND statement_type IN ('INSERT', 'CREATE_TABLE_AS_SELECT', 'MERGE', 'UPDATE')
        ORDER BY end_time DESC
        LIMIT 1
        """
        
        query_job = client.query(jobs_query)
        results = list(query_job.result())
        
        if not results:
            return {
                "sourceTable": source_table,
                "targetTable": target_table,
                "query": None,
                "message": "No query found for this relationship",
                "cached": False
            }
        
        row = results[0]
        
        # Calculate cost estimate (rough estimate: $5 per TB)
        bytes_processed = row.total_bytes_processed or 0
        cost_estimate = (bytes_processed / (1024 ** 4)) * 5  # $5 per TB
        
        result = {
            "sourceTable": source_table,
            "targetTable": target_table,
            "query": row.query,
            "jobId": row.job_id,
            "userEmail": row.user_email,
            "startTime": row.start_time.isoformat() if row.start_time else None,
            "endTime": row.end_time.isoformat() if row.end_time else None,
            "durationMs": row.duration_ms,
            "bytesProcessed": bytes_processed,
            "totalSlotMs": row.total_slot_ms,
            "statementType": row.statement_type,
            "costEstimate": round(cost_estimate, 4),
            "cached": False
        }
        
        # Cache for 1 hour
        if cache and cache.is_connected():
            cache.set(cache_key, result, ttl=TTL_LINEAGE)
            logger.info(f"💾 Cached edge query with TTL={TTL_LINEAGE}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching edge query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))