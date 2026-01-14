
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google.cloud import bigquery
import vertexai
from vertexai.generative_models import GenerativeModel
import json
import hashlib
from datetime import date, datetime
from decimal import Decimal
import os
from dotenv import load_dotenv
from routers import bq_lineage

# Load environment variables
load_dotenv()

app = FastAPI(title="Data Platform API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Clients
bq_client = bigquery.Client()

# Initialize Vertex AI (uses same credentials as BigQuery)
PROJECT_ID = "tokyo-dispatch-475119-i4"
LOCATION = "us-central1"

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    gemini_model = GenerativeModel("gemini-2.0-flash-exp")
    print("✅ Vertex AI Gemini initialized successfully")
except Exception as e:
    gemini_model = None
    print(f"⚠️  WARNING: Vertex AI initialization failed: {e}")

# Simple in-memory cache
cache = {}

class QueryRequest(BaseModel):
    query: str

class AIRequest(BaseModel):
    prompt: str = None
    sql: str = None
    schema_context: str = Field(None, alias="schema")

def serialize_bigquery_value(value):
    """Convert BigQuery types to JSON-serializable types"""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    elif isinstance(value, Decimal):
        return float(value)
    elif isinstance(value, bytes):
        return value.decode('utf-8')
    return value

@app.get("/")
async def root():
    return {"message": "Data Platform API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/bigquery/schema")
async def get_schema():
    """Fetch BigQuery datasets and tables"""
    cache_key = "schema:all_datasets"
    
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        datasets = []
        
        for dataset in bq_client.list_datasets():
            dataset_id = dataset.dataset_id
            tables = []
            
            for table in bq_client.list_tables(dataset_id):
                table_ref = bq_client.get_table(f"{dataset_id}.{table.table_id}")
                
                columns = [field.name for field in table_ref.schema]
                
                primary_key = None
                for field in table_ref.schema:
                    if 'id' in field.name.lower() or field.name.lower().endswith('_key'):
                        primary_key = field.name
                        break
                
                tables.append({
                    "name": table.table_id,
                    "columns": columns,
                    "primaryKey": primary_key,
                    "row_count": table_ref.num_rows
                })
            
            if tables:
                datasets.append({
                    "name": dataset_id,
                    "tables": tables
                })
        
        result = {"datasets": datasets}
        cache[cache_key] = result
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bigquery/execute")
async def execute_bigquery(request: QueryRequest):
    """Execute BigQuery with proper serialization"""
    cache_key = f"query:{hashlib.md5(request.query.encode()).hexdigest()}"
    
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        query_job = bq_client.query(request.query)
        results = query_job.result()
        
        schema = [{"name": field.name, "type": field.field_type} for field in results.schema]
        
        # Properly serialize rows
        rows = []
        for row in results:
            serialized_row = {}
            for key, value in dict(row).items():
                serialized_row[key] = serialize_bigquery_value(value)
            rows.append(serialized_row)
        
        result = {
            "schema": schema,
            "rows": rows,
            "total_rows": len(rows),
            "cached": False
        }
        
        if request.query.strip().upper().startswith("SELECT"):
            cache[cache_key] = result
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/cache/clear")
async def clear_cache():
    """Clear all cache"""
    cache.clear()
    return {"status": "cache cleared"}

# ==================== AI ENDPOINTS ====================

@app.post("/api/ai/generate-sql")
async def generate_sql(request: AIRequest):
    """Generate SQL from natural language using Vertex AI Gemini"""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not available.")
    
    try:
        prompt_text = f"""You are a BigQuery SQL expert. Generate a SQL query based on this request.

Schema context:
{request.schema_context or 'No schema provided'}

User request: {request.prompt}

Return ONLY the SQL query, no explanation or markdown. Use proper BigQuery syntax with backticks for fully qualified table names like `tokyo-dispatch-475119-i4.dataset.table`."""

        response = gemini_model.generate_content(prompt_text)
        sql = response.text.strip()
        
        # Remove markdown code blocks if present
        sql = sql.replace("```sql", "").replace("```", "").strip()
        
        return {"sql": sql}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vertex AI error: {str(e)}")

@app.post("/api/ai/explain-query")
async def explain_query(request: AIRequest):
    """Explain what a SQL query does using Vertex AI Gemini"""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not available.")
    
    try:
        prompt_text = f"""Explain this BigQuery SQL query in simple, clear terms:

{request.sql}

Provide a brief explanation (2-3 sentences) of what this query does. Focus on the business logic, not technical details."""

        response = gemini_model.generate_content(prompt_text)
        explanation = response.text.strip()
        
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vertex AI error: {str(e)}")

@app.post("/api/ai/optimize-query")
async def optimize_query(request: AIRequest):
    """Suggest optimizations for a SQL query using Vertex AI Gemini"""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not available.")
    
    try:
        prompt_text = f"""Analyze this BigQuery SQL query and suggest optimizations:

{request.sql}

Provide your response as JSON with this exact format:
{{
    "optimized_sql": "the optimized version of the query",
    "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
}}

Focus on BigQuery-specific optimizations like partitioning, clustering, avoiding SELECT *, using appropriate JOINs, etc."""

        response = gemini_model.generate_content(prompt_text)
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        return result
    except json.JSONDecodeError:
        return {
            "optimized_sql": request.sql,
            "suggestions": ["Unable to parse optimization suggestions. Please try again."]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vertex AI error: {str(e)}")
    
    

app.include_router(bq_lineage.router, prefix="/api", tags=["bigquery"])