from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Branch as BranchModel
from schemas import Branch, BranchCreate

router = APIRouter()

@router.get("/", response_model=List[Branch])
def get_branches(db: Session = Depends(get_db)):
    branches = db.query(BranchModel).all()
    return branches

@router.get("/{branch_id}", response_model=Branch)
def get_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(BranchModel).filter(BranchModel.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("/", response_model=Branch)
def create_branch(branch: BranchCreate, db: Session = Depends(get_db)):
    # Check if FBR branch code already exists
    existing_branch = db.query(BranchModel).filter(
        BranchModel.fbr_branch_code == branch.fbr_branch_code
    ).first()
    if existing_branch:
        raise HTTPException(status_code=400, detail="FBR branch code already exists")
    
    db_branch = BranchModel(**branch.dict())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.put("/{branch_id}", response_model=Branch)
def update_branch(branch_id: int, branch: BranchCreate, db: Session = Depends(get_db)):
    db_branch = db.query(BranchModel).filter(BranchModel.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if new FBR branch code already exists (excluding current branch)
    existing_branch = db.query(BranchModel).filter(
        BranchModel.fbr_branch_code == branch.fbr_branch_code,
        BranchModel.id != branch_id
    ).first()
    if existing_branch:
        raise HTTPException(status_code=400, detail="FBR branch code already exists")
    
    for field, value in branch.dict().items():
        setattr(db_branch, field, value)
    
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    db_branch = db.query(BranchModel).filter(BranchModel.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db.delete(db_branch)
    db.commit()
    return {"message": "Branch deleted successfully"} 