from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Data Platform API")


@app.get("/")
async def root():
    return {"message": "Data Platform API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}