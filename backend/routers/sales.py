from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from database import get_db
from models import (
    Sale as SaleModel, 
    SaleItem as SaleItemModel, 
    Product as ProductModel,
    Branch as BranchModel,
    Device as DeviceModel,
    Customer as CustomerModel,
    Payment as PaymentModel,
    InvoiceSyncLog as InvoiceSyncLogModel,
    FBRStatusEnum,
    InvoiceTypeEnum
)
from schemas import Sale, SaleCreate, SaleSummary, FBRInvoicePayload, FBRResponse

router = APIRouter()

@router.get("/", response_model=List[SaleSummary])
def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    branch_id: Optional[int] = None,
    device_id: Optional[int] = None,
    fbr_status: Optional[FBRStatusEnum] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SaleModel)
    
    if start_date:
        query = query.filter(SaleModel.invoice_date >= start_date)
    
    if end_date:
        query = query.filter(SaleModel.invoice_date <= end_date)
    
    if branch_id:
        query = query.filter(SaleModel.branch_id == branch_id)
    
    if device_id:
        query = query.filter(SaleModel.device_id == device_id)
    
    if fbr_status:
        query = query.filter(SaleModel.fbr_status == fbr_status)
    
    sales = query.order_by(SaleModel.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for sale in sales:
        item_count = db.query(SaleItemModel).filter(SaleItemModel.sale_id == sale.id).count()
        result.append(SaleSummary(
            id=sale.id,
            invoice_no=sale.invoice_no,
            total_amount=sale.total_amount,
            fbr_status=sale.fbr_status,
            created_at=sale.created_at,
            item_count=item_count
        ))
    
    return result

@router.get("/{sale_id}", response_model=Sale)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.post("/", response_model=Sale)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    # Validate branch exists
    branch = db.query(BranchModel).filter(BranchModel.id == sale.branch_id).first()
    if not branch:
        raise HTTPException(status_code=400, detail="Branch not found")
    
    # Validate device exists
    device = db.query(DeviceModel).filter(DeviceModel.id == sale.device_id).first()
    if not device:
        raise HTTPException(status_code=400, detail="Device not found")
    
    # Validate customer exists if provided
    if sale.customer_id:
        customer = db.query(CustomerModel).filter(CustomerModel.id == sale.customer_id).first()
        if not customer:
            raise HTTPException(status_code=400, detail="Customer not found")
    
    # Check if invoice number already exists
    existing_invoice = db.query(SaleModel).filter(SaleModel.invoice_no == sale.invoice_no).first()
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Invoice number already exists")
    
    # Check if USIN already exists
    existing_usin = db.query(SaleModel).filter(SaleModel.usin == sale.usin).first()
    if existing_usin:
        raise HTTPException(status_code=400, detail="USIN already exists")
    
    # Create the sale
    db_sale = SaleModel(
        invoice_no=sale.invoice_no,
        branch_id=sale.branch_id,
        device_id=sale.device_id,
        customer_id=sale.customer_id,
        invoice_type=sale.invoice_type,
        sale_type_code=sale.sale_type_code,
        seller_ntn=sale.seller_ntn,
        seller_strn=sale.seller_strn,
        buyer_ntn=sale.buyer_ntn,
        buyer_name=sale.buyer_name,
        total_qty=sale.total_qty,
        total_sales_value=sale.total_sales_value,
        total_tax=sale.total_tax,
        total_discount=sale.total_discount,
        total_amount=sale.total_amount,
        usin=sale.usin
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    
    # Create sale items
    for item in sale.items:
        # Validate product exists
        product = db.query(ProductModel).filter(ProductModel.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        # Create sale item
        db_item = SaleItemModel(
            sale_id=db_sale.id,
            product_id=item.product_id,
            hs_code=item.hs_code,
            quantity=item.quantity,
            unit_price=item.unit_price,
            value_excl_tax=item.value_excl_tax,
            sales_tax=item.sales_tax,
            further_tax=item.further_tax,
            c_v_t=item.c_v_t,
            w_h_tax_1=item.w_h_tax_1,
            w_h_tax_2=item.w_h_tax_2,
            discount=item.discount,
            sro_item_serial_no=item.sro_item_serial_no,
            line_total=item.line_total
        )
        db.add(db_item)
    
    # Create payments
    for payment in sale.payments:
        db_payment = PaymentModel(
            sale_id=db_sale.id,
            method=payment.method,
            amount=payment.amount,
            details=payment.details
        )
        db.add(db_payment)
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.post("/{sale_id}/sync-fbr")
def sync_sale_to_fbr(sale_id: int, db: Session = Depends(get_db)):
    """Sync sale to FBR system"""
    sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Create sync log entry
    sync_log = InvoiceSyncLogModel(
        sale_id=sale_id,
        attempt_no=sale.sync_attempts + 1,
        status=FBRStatusEnum.PENDING
    )
    db.add(sync_log)
    
    # Update sale sync attempts
    sale.sync_attempts += 1
    sale.fbr_status = FBRStatusEnum.SENT
    sale.last_synced_at = datetime.utcnow()
    
    db.commit()
    
    # TODO: Implement actual FBR API call here
    # This would involve making HTTP requests to FBR's API
    
    return {
        "message": "Sale queued for FBR sync",
        "sale_id": sale_id,
        "sync_attempts": sale.sync_attempts
    }

@router.get("/stats/daily")
def get_daily_stats(db: Session = Depends(get_db)):
    today = date.today()
    sales = db.query(SaleModel).filter(
        SaleModel.invoice_date >= today
    ).all()
    
    total_sales = len(sales)
    total_revenue = sum(sale.total_amount for sale in sales)
    total_tax = sum(sale.total_tax for sale in sales)
    
    return {
        "date": today,
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "total_tax": total_tax
    }

@router.get("/stats/monthly")
def get_monthly_stats(db: Session = Depends(get_db)):
    current_month = datetime.now().replace(day=1)
    sales = db.query(SaleModel).filter(
        SaleModel.invoice_date >= current_month
    ).all()
    
    total_sales = len(sales)
    total_revenue = sum(sale.total_amount for sale in sales)
    total_tax = sum(sale.total_tax for sale in sales)
    
    return {
        "month": current_month.strftime("%Y-%m"),
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "total_tax": total_tax
    }

@router.get("/fbr-status/{sale_id}")
def get_fbr_status(sale_id: int, db: Session = Depends(get_db)):
    """Get FBR sync status for a sale"""
    sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    sync_logs = db.query(InvoiceSyncLogModel).filter(
        InvoiceSyncLogModel.sale_id == sale_id
    ).order_by(InvoiceSyncLogModel.attempted_at.desc()).all()
    
    return {
        "sale_id": sale_id,
        "fbr_status": sale.fbr_status,
        "sync_attempts": sale.sync_attempts,
        "last_synced_at": sale.last_synced_at,
        "fbr_invoice_no": sale.fbr_invoice_no,
        "sync_logs": [
            {
                "attempt_no": log.attempt_no,
                "status": log.status,
                "attempted_at": log.attempted_at
            }
            for log in sync_logs
        ]
    } 