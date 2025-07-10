from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Device as DeviceModel, Branch as BranchModel
from schemas import Device, DeviceCreate

router = APIRouter()

@router.get("/", response_model=List[Device])
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(DeviceModel).all()
    return devices

@router.get("/{device_id}", response_model=Device)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/", response_model=Device)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    # Validate branch exists
    branch = db.query(BranchModel).filter(BranchModel.id == device.branch_id).first()
    if not branch:
        raise HTTPException(status_code=400, detail="Branch not found")
    
    # Check if device identifier already exists
    existing_device = db.query(DeviceModel).filter(
        DeviceModel.device_identifier == device.device_identifier
    ).first()
    if existing_device:
        raise HTTPException(status_code=400, detail="Device identifier already exists")
    
    # Check if FBR POS registration already exists
    existing_fbr_pos = db.query(DeviceModel).filter(
        DeviceModel.fbr_pos_reg == device.fbr_pos_reg
    ).first()
    if existing_fbr_pos:
        raise HTTPException(status_code=400, detail="FBR POS registration already exists")
    
    db_device = DeviceModel(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.put("/{device_id}", response_model=Device)
def update_device(device_id: int, device: DeviceCreate, db: Session = Depends(get_db)):
    db_device = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Validate branch exists
    branch = db.query(BranchModel).filter(BranchModel.id == device.branch_id).first()
    if not branch:
        raise HTTPException(status_code=400, detail="Branch not found")
    
    # Check if new device identifier already exists (excluding current device)
    existing_device = db.query(DeviceModel).filter(
        DeviceModel.device_identifier == device.device_identifier,
        DeviceModel.id != device_id
    ).first()
    if existing_device:
        raise HTTPException(status_code=400, detail="Device identifier already exists")
    
    # Check if new FBR POS registration already exists (excluding current device)
    existing_fbr_pos = db.query(DeviceModel).filter(
        DeviceModel.fbr_pos_reg == device.fbr_pos_reg,
        DeviceModel.id != device_id
    ).first()
    if existing_fbr_pos:
        raise HTTPException(status_code=400, detail="FBR POS registration already exists")
    
    for field, value in device.dict().items():
        setattr(db_device, field, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    db_device = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(db_device)
    db.commit()
    return {"message": "Device deleted successfully"} 