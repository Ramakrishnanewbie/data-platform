from fastapi import FastAPI

app=FastAPI(
    title="Backend for Data Platform",
    description="This is the backend service for the Data Platform application.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.get("/")
def root():
    return {"message": "Welcome to the Data Platform Backend!"} 

@app.get("/health")
def health_check():
    return {"status": "healthy"}

