from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from database import engine, get_db
from models import Base
from routers import products, sales, categories, branches, devices, tax_rates, customers, users
from schemas import ProductCreate, Product, SaleCreate, Sale, CategoryCreate, Category

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FBR Integrated POS System API",
    description="Point of Sale System Backend API with FBR Integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(sales.router, prefix="/api/sales", tags=["sales"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(branches.router, prefix="/api/branches", tags=["branches"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(tax_rates.router, prefix="/api/tax-rates", tags=["tax-rates"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "FBR Integrated POS System API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "FBR Integrated POS System is operational"}

@app.get("/api/fbr-status")
async def fbr_status():
    """Get FBR integration status"""
    return {
        "fbr_integration": "enabled",
        "compliance": "FBR POS Integration Ready",
        "features": [
            "Invoice Generation",
            "Tax Calculation",
            "FBR Sync",
            "QR Code Generation",
            "Audit Trail"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 