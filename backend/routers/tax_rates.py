from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import TaxRate as TaxRateModel
from schemas import TaxRate, TaxRateCreate

router = APIRouter()

@router.get("/", response_model=List[TaxRate])
def get_tax_rates(db: Session = Depends(get_db)):
    tax_rates = db.query(TaxRateModel).all()
    return tax_rates

@router.get("/{tax_rate_id}", response_model=TaxRate)
def get_tax_rate(tax_rate_id: int, db: Session = Depends(get_db)):
    tax_rate = db.query(TaxRateModel).filter(TaxRateModel.id == tax_rate_id).first()
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    return tax_rate

@router.post("/", response_model=TaxRate)
def create_tax_rate(tax_rate: TaxRateCreate, db: Session = Depends(get_db)):
    # Check if tax rate name already exists
    existing_tax_rate = db.query(TaxRateModel).filter(
        TaxRateModel.name == tax_rate.name
    ).first()
    if existing_tax_rate:
        raise HTTPException(status_code=400, detail="Tax rate name already exists")
    
    db_tax_rate = TaxRateModel(**tax_rate.dict())
    db.add(db_tax_rate)
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

@router.put("/{tax_rate_id}", response_model=TaxRate)
def update_tax_rate(tax_rate_id: int, tax_rate: TaxRateCreate, db: Session = Depends(get_db)):
    db_tax_rate = db.query(TaxRateModel).filter(TaxRateModel.id == tax_rate_id).first()
    if not db_tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    # Check if new tax rate name already exists (excluding current tax rate)
    existing_tax_rate = db.query(TaxRateModel).filter(
        TaxRateModel.name == tax_rate.name,
        TaxRateModel.id != tax_rate_id
    ).first()
    if existing_tax_rate:
        raise HTTPException(status_code=400, detail="Tax rate name already exists")
    
    for field, value in tax_rate.dict().items():
        setattr(db_tax_rate, field, value)
    
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

@router.delete("/{tax_rate_id}")
def delete_tax_rate(tax_rate_id: int, db: Session = Depends(get_db)):
    db_tax_rate = db.query(TaxRateModel).filter(TaxRateModel.id == tax_rate_id).first()
    if not db_tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    db.delete(db_tax_rate)
    db.commit()
    return {"message": "Tax rate deleted successfully"} 