from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from database import get_db
from models import Product as ProductModel, Category as CategoryModel, TaxRate as TaxRateModel
from schemas import Product, ProductCreate, ProductUpdate

router = APIRouter()

@router.get("/", response_model=List[Product])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    tax_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProductModel)
    
    if search:
        query = query.filter(ProductModel.name.ilike(f"%{search}%"))
    
    if category_id:
        query = query.filter(ProductModel.category_id == category_id)
    
    if tax_id:
        query = query.filter(ProductModel.tax_id == tax_id)
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/code/{product_code}", response_model=Product)
def get_product_by_code(product_code: str, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=Product)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Check if product code already exists
    existing_product = db.query(ProductModel).filter(ProductModel.code == product.code).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    # Validate category exists
    if product.category_id:
        category = db.query(CategoryModel).filter(CategoryModel.id == product.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    # Validate tax rate exists
    if product.tax_id:
        tax_rate = db.query(TaxRateModel).filter(TaxRateModel.id == product.tax_id).first()
        if not tax_rate:
            raise HTTPException(status_code=400, detail="Tax rate not found")
    
    db_product = ProductModel(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if new code already exists (excluding current product)
    if product.code and product.code != db_product.code:
        existing_product = db.query(ProductModel).filter(
            ProductModel.code == product.code,
            ProductModel.id != product_id
        ).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="Product code already exists")
    
    # Validate category exists
    if product.category_id:
        category = db.query(CategoryModel).filter(CategoryModel.id == product.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    # Validate tax rate exists
    if product.tax_id:
        tax_rate = db.query(TaxRateModel).filter(TaxRateModel.id == product.tax_id).first()
        if not tax_rate:
            raise HTTPException(status_code=400, detail="Tax rate not found")
    
    update_data = product.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"} 