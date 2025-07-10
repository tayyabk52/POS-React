from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Customer as CustomerModel
from schemas import Customer, CustomerCreate

router = APIRouter()

@router.get("/", response_model=List[Customer])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(CustomerModel).all()
    return customers

@router.get("/{customer_id}", response_model=Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=Customer)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = CustomerModel(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=Customer)
def update_customer(customer_id: int, customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for field, value in customer.dict().items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"} 