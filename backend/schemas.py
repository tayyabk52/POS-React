from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Enums for FBR compliance
class InvoiceTypeEnum(str, Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    DEBIT_NOTE = "DEBIT_NOTE"
    CREDIT_NOTE = "CREDIT_NOTE"

class FBRStatusEnum(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

# Branch schemas
class BranchBase(BaseModel):
    name: str = Field(..., max_length=100)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=50)
    province: Optional[str] = Field(None, max_length=50)
    ntn: str = Field(..., min_length=7, max_length=7)  # NTN number
    strn: str = Field(..., min_length=7, max_length=7)  # STRN number
    fbr_branch_code: str = Field(..., max_length=20)
    sale_type_code: str = Field(..., max_length=20)  # e.g. 'T1000017'

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Device schemas
class DeviceBase(BaseModel):
    branch_id: int
    name: str = Field(..., max_length=100)
    device_identifier: str = Field(..., max_length=100)
    fbr_pos_reg: str = Field(..., max_length=20)

class DeviceCreate(DeviceBase):
    pass

class Device(DeviceBase):
    id: int
    created_at: datetime
    branch: Branch

    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategorySimple(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class Category(CategoryBase):
    id: int
    parent: Optional["CategorySimple"] = None
    children: List["CategorySimple"] = []
    class Config:
        from_attributes = True

# Tax Rate schemas
class TaxRateBase(BaseModel):
    name: str = Field(..., max_length=100)
    rate: Decimal = Field(...)
    code: Optional[str] = Field(None, max_length=20)  # FBR SRO Schedule code

class TaxRateCreate(TaxRateBase):
    pass

class TaxRate(TaxRateBase):
    id: int

    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=150)
    category_id: Optional[int] = None
    price: Decimal = Field(...)
    tax_id: Optional[int] = None
    hs_code: Optional[str] = Field(None, max_length=20)  # FBR Harmonized System Code

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=150)
    category_id: Optional[int] = None
    price: Optional[Decimal] = Field(None)
    tax_id: Optional[int] = None
    hs_code: Optional[str] = Field(None, max_length=20)

class Product(ProductBase):
    id: int
    created_at: datetime
    category: Optional[Category] = None
    tax_rate: Optional[TaxRate] = None

    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    is_admin: bool = False
    branch_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    branch_id: Optional[int] = None

class User(UserBase):
    id: int
    created_at: datetime
    branch: Optional[Branch] = None

    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str = Field(..., max_length=150)
    ntn: Optional[str] = Field(None, max_length=9)  # NTN or CNIC
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Sale Item schemas
class SaleItemBase(BaseModel):
    product_id: int
    hs_code: Optional[str] = Field(None, max_length=20)
    quantity: Decimal = Field(...)
    unit_price: Decimal = Field(...)
    value_excl_tax: Decimal = Field(...)
    sales_tax: Decimal = Field(...)
    further_tax: Decimal = Field(0)
    c_v_t: Decimal = Field(0)  # CVT - Capital Value Tax
    w_h_tax_1: Decimal = Field(0)  # Withholding Tax 1
    w_h_tax_2: Decimal = Field(0)  # Withholding Tax 2
    discount: Decimal = Field(0)
    sro_item_serial_no: Optional[str] = Field(None, max_length=10)
    line_total: Decimal = Field(...)

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    created_at: datetime
    product: Product

    class Config:
        from_attributes = True

# Payment schemas
class PaymentBase(BaseModel):
    method: str = Field(..., max_length=30)  # e.g., 'Cash', 'Card'
    amount: Decimal = Field(...)
    details: Optional[Dict[str, Any]] = None  # additional info (card type, transaction ID)

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    payment_date: datetime

    class Config:
        from_attributes = True

# Sale schemas
class SaleBase(BaseModel):
    invoice_no: str = Field(..., max_length=30)
    branch_id: int
    device_id: int
    customer_id: Optional[int] = None
    invoice_type: InvoiceTypeEnum
    sale_type_code: str = Field(..., max_length=20)  # e.g. 'T1000017'
    seller_ntn: str = Field(..., min_length=7, max_length=7)
    seller_strn: str = Field(..., min_length=7, max_length=7)
    buyer_ntn: Optional[str] = Field(None, max_length=9)
    buyer_name: Optional[str] = Field(None, max_length=150)
    total_qty: Decimal = Field(...)
    total_sales_value: Decimal = Field(...)
    total_tax: Decimal = Field(...)
    total_discount: Decimal = Field(0)
    total_amount: Decimal = Field(...)
    usin: str = Field(..., max_length=50)  # Unique Sale Invoice Number

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    payments: List[PaymentCreate]

class Sale(SaleBase):
    id: int
    invoice_date: datetime
    fbr_invoice_no: Optional[str] = None
    qr_payload: Optional[str] = None
    fbr_payload: Optional[Dict[str, Any]] = None
    fbr_response: Optional[Dict[str, Any]] = None
    fbr_status: FBRStatusEnum
    sync_attempts: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    branch: Branch
    device: Device
    customer: Optional[Customer] = None
    items: List[SaleItem]
    payments: List[Payment]

    class Config:
        from_attributes = True

# Invoice Sync Log schemas
class InvoiceSyncLogBase(BaseModel):
    sale_id: int
    attempt_no: int
    payload: Optional[Dict[str, Any]] = None
    response: Optional[Dict[str, Any]] = None
    status: FBRStatusEnum

class InvoiceSyncLogCreate(InvoiceSyncLogBase):
    pass

class InvoiceSyncLog(InvoiceSyncLogBase):
    id: int
    attempted_at: datetime

    class Config:
        from_attributes = True

# Response schemas
class SaleSummary(BaseModel):
    id: int
    invoice_no: str
    total_amount: Decimal
    fbr_status: FBRStatusEnum
    created_at: datetime
    item_count: int

    class Config:
        from_attributes = True

# FBR Integration schemas
class FBRInvoicePayload(BaseModel):
    """FBR Invoice Payload structure"""
    invoice_number: str
    pos_id: str
    buyer_ntn: Optional[str]
    buyer_name: Optional[str]
    invoice_date: str
    invoice_type: str
    sale_type_code: str
    seller_ntn: str
    seller_strn: str
    total_amount: Decimal
    total_tax: Decimal
    items: List[Dict[str, Any]]

class FBRResponse(BaseModel):
    """FBR API Response structure"""
    status: str
    message: str
    invoice_number: Optional[str]
    qr_code: Optional[str]
    error_details: Optional[Dict[str, Any]] 

Category.update_forward_refs()
CategorySimple.update_forward_refs() 