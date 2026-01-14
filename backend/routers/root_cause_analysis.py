from fastapi import APIRouter, HTTPException
from google.cloud import bigquery
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

router = APIRouter()
bq_client = bigquery.Client()

def get_table_metadata(project_id: str, dataset_id: str, table_id: str) -> Dict[str, Any]:
    """Fetch detailed metadata for a table"""
    try:
        table_ref = bq_client.get_table(f"{project_id}.{dataset_id}.{table_id}")
        
        # Calculate freshness
        modified_time = table_ref.modified
        hours_since_modified = (datetime.now(modified_time.tzinfo) - modified_time).total_seconds() / 3600
        
        if hours_since_modified < 24:
            freshness = "fresh"
        elif hours_since_modified < 72:
            freshness = "recent"
        else:
            freshness = "stale"
        
        return {
            "projectId": project_id,
            "datasetId": dataset_id,
            "tableId": table_id,
            "numRows": table_ref.num_rows,
            "numBytes": table_ref.num_bytes,
            "modifiedAt": modified_time.isoformat(),
            "createdAt": table_ref.created.isoformat(),
            "freshness": freshness,
            "type": table_ref.table_type.lower()
        }
    except Exception as e:
        print(f"Error fetching metadata for {project_id}.{dataset_id}.{table_id}: {e}")
        return None

def get_recent_job_failures(project_id: str, dataset_id: str, table_id: str, hours: int = 24) -> List[Dict[str, Any]]:
    """Get recent job failures for a table"""
    try:
        # Query INFORMATION_SCHEMA for recent job failures
        query = f"""
        SELECT 
            job_id,
            creation_time,
            error_result.reason as error_reason,
            error_result.message as error_message,
            query
        FROM `{project_id}.region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
        WHERE 
            creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {hours} HOUR)
            AND state = 'DONE'
            AND error_result IS NOT NULL
            AND (
                LOWER(query) LIKE '%{dataset_id}.{table_id}%'
                OR destination_table.table_id = '{table_id}'
            )
        ORDER BY creation_time DESC
        LIMIT 5
        """
        
        query_job = bq_client.query(query)
        results = query_job.result()
        
        failures = []
        for row in results:
            failures.append({
                "jobId": row.job_id,
                "creationTime": row.creation_time.isoformat(),
                "errorReason": row.error_reason,
                "errorMessage": row.error_message
            })
        
        return failures
    except Exception as e:
        print(f"Error fetching job failures: {e}")
        return []

def analyze_upstream_dependencies(
    project_id: str, 
    dataset_id: str, 
    table_id: str,
    lineage_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Analyze upstream dependencies to find potential root causes"""
    
    suspicious_nodes = []
    target_node_id = f"{project_id}.{dataset_id}.{table_id}"
    
    # Get all nodes and edges
    nodes = {node["id"]: node for node in lineage_data.get("nodes", [])}
    edges = lineage_data.get("edges", [])
    
    # BFS to find all upstream nodes
    visited = set()
    queue = [target_node_id]
    visited.add(target_node_id)
    
    while queue:
        current_id = queue.pop(0)
        
        # Find incoming edges (upstream dependencies)
        incoming_edges = [e for e in edges if e["target"] == current_id]
        
        for edge in incoming_edges:
            source_id = edge["source"]
            if source_id not in visited:
                visited.add(source_id)
                queue.append(source_id)
                
                # Analyze this upstream node
                node = nodes.get(source_id)
                if not node:
                    continue
                
                # Parse node ID to get table details
                parts = source_id.split(".")
                if len(parts) != 3:
                    continue
                
                src_project, src_dataset, src_table = parts
                
                # Fetch fresh metadata
                metadata = get_table_metadata(src_project, src_dataset, src_table)
                if not metadata:
                    continue
                
                issues = []
                severity = "info"
                
                # Check 1: Data freshness
                if metadata["freshness"] == "stale":
                    issues.append("Data is stale (not updated in >72 hours)")
                    severity = "critical"
                elif metadata["freshness"] == "recent":
                    issues.append("Data may be outdated (>24 hours old)")
                    severity = "warning" if severity == "info" else severity
                
                # Check 2: Recent modifications (potential breaking changes)
                modified_time = datetime.fromisoformat(metadata["modifiedAt"].replace('Z', '+00:00'))
                hours_since_modified = (datetime.now(modified_time.tzinfo) - modified_time).total_seconds() / 3600
                
                if hours_since_modified < 24:
                    issues.append(f"Modified {int(hours_since_modified)} hours ago (potential breaking change)")
                    severity = "critical" if severity == "info" else severity
                
                # Check 3: Empty table
                if metadata["numRows"] == 0:
                    issues.append("Table is empty (0 rows)")
                    severity = "critical"
                
                # Check 4: Recent job failures
                failures = get_recent_job_failures(src_project, src_dataset, src_table, hours=24)
                if failures:
                    issues.append(f"{len(failures)} job failure(s) in last 24 hours")
                    severity = "critical"
                
                # Add to suspicious nodes if issues found
                if issues:
                    suspicious_nodes.append({
                        "node": {
                            "id": source_id,
                            "data": {
                                "label": src_table,
                                "datasetId": src_dataset,
                                "type": metadata["type"]
                            }
                        },
                        "issues": issues,
                        "severity": severity,
                        "lastModified": metadata["modifiedAt"],
                        "freshness": metadata["freshness"],
                        "numRows": metadata["numRows"],
                        "jobFailures": failures
                    })
    
    # Sort by severity
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    suspicious_nodes.sort(key=lambda x: severity_order[x["severity"]])
    
    # Generate recommendation
    if not suspicious_nodes:
        recommendation = "No obvious upstream issues detected. The problem may be in the transformation logic or external factors."
    elif suspicious_nodes[0]["severity"] == "critical":
        table_name = suspicious_nodes[0]["node"]["data"]["label"]
        recommendation = f"Start by investigating '{table_name}'. It has critical issues that are likely propagating downstream."
    else:
        recommendation = "Check the flagged upstream tables. Issues may be cascading from multiple sources."
    
    return {
        "suspiciousNodes": suspicious_nodes,
        "analyzedNodes": len(visited),
        "recommendation": recommendation,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/bigquery/root-cause/{project_id}/{dataset_id}/{table_id}")
async def get_root_cause_analysis(project_id: str, dataset_id: str, table_id: str):
    """
    Analyze upstream dependencies to find potential root causes for data issues
    """
    try:
        # Import here to avoid circular dependency
        import requests
        
        # Fetch lineage data by calling the existing endpoint
        lineage_url = f"http://localhost:8000/api/bigquery/lineage/{project_id}/{dataset_id}/{table_id}"
        params = {"direction": "upstream", "depth": 5}
        
        response = requests.get(lineage_url, params=params)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Failed to fetch lineage: {response.text}"
            )
        
        lineage_data = response.json()
        
        # Perform root cause analysis
        analysis = analyze_upstream_dependencies(
            project_id=project_id,
            dataset_id=dataset_id,
            table_id=table_id,
            lineage_data=lineage_data
        )
        
        return analysis
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch lineage data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Root cause analysis failed: {str(e)}")