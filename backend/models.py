from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
import enum

# Enums for FBR compliance
class InvoiceTypeEnum(enum.Enum):
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    DEBIT_NOTE = "DEBIT_NOTE"
    CREDIT_NOTE = "CREDIT_NOTE"

class FBRStatusEnum(enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(Text)
    city = Column(String(50))
    province = Column(String(50))
    ntn = Column(String(7), nullable=False)  # NTN number
    strn = Column(String(7), nullable=False)  # STRN number
    fbr_branch_code = Column(String(20), unique=True, nullable=False)
    sale_type_code = Column(String(20), nullable=False)  # e.g. 'T1000017'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    devices = relationship("Device", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    name = Column(String(100), nullable=False)
    device_identifier = Column(String(100), unique=True, nullable=False)
    fbr_pos_reg = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    branch = relationship("Branch", back_populates="devices")
    sales = relationship("Sale", back_populates="device")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Self-referential relationship
    parent = relationship("Category", remote_side=[id])
    children = relationship("Category")
    products = relationship("Product", back_populates="category")

class TaxRate(Base):
    __tablename__ = "tax_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    code = Column(String(20))  # FBR SRO Schedule code
    
    # Relationships
    products = relationship("Product", back_populates="tax_rate")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    tax_id = Column(Integer, ForeignKey("tax_rates.id"), nullable=True)
    hs_code = Column(String(20))  # FBR Harmonized System Code
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="products")
    tax_rate = relationship("TaxRate", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    ntn = Column(String(9))  # NTN or CNIC
    phone = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sales = relationship("Sale", back_populates="customer")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(30), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    invoice_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    invoice_type = Column(Enum(InvoiceTypeEnum), nullable=False)
    sale_type_code = Column(String(20), nullable=False)  # e.g. 'T1000017'
    seller_ntn = Column(String(7), nullable=False)
    seller_strn = Column(String(7), nullable=False)
    buyer_ntn = Column(String(9), nullable=True)
    buyer_name = Column(String(150), nullable=True)
    total_qty = Column(Numeric(10, 2), nullable=False)
    total_sales_value = Column(Numeric(14, 2), nullable=False)
    total_tax = Column(Numeric(14, 2), nullable=False)
    total_discount = Column(Numeric(14, 2), default=0)
    total_amount = Column(Numeric(14, 2), nullable=False)
    usin = Column(String(50), unique=True, nullable=False)  # Unique Sale Invoice Number
    fbr_invoice_no = Column(String(50), unique=True, nullable=True)
    qr_payload = Column(Text, nullable=True)
    fbr_payload = Column(JSONB, nullable=True)
    fbr_response = Column(JSONB, nullable=True)
    fbr_status = Column(Enum(FBRStatusEnum), nullable=False, default=FBRStatusEnum.PENDING)
    sync_attempts = Column(Integer, nullable=False, default=0)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    branch = relationship("Branch", back_populates="sales")
    device = relationship("Device", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    hs_code = Column(String(20), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    value_excl_tax = Column(Numeric(14, 2), nullable=False)
    sales_tax = Column(Numeric(14, 2), nullable=False)
    further_tax = Column(Numeric(14, 2), default=0)
    c_v_t = Column(Numeric(14, 2), default=0)  # CVT - Capital Value Tax
    w_h_tax_1 = Column(Numeric(14, 2), default=0)  # Withholding Tax 1
    w_h_tax_2 = Column(Numeric(14, 2), default=0)  # Withholding Tax 2
    discount = Column(Numeric(14, 2), default=0)
    sro_item_serial_no = Column(String(10), nullable=True)
    line_total = Column(Numeric(14, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    method = Column(String(30), nullable=False)  # e.g., 'Cash', 'Card'
    amount = Column(Numeric(14, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    details = Column(JSONB, nullable=True)  # additional info (card type, transaction ID)
    
    # Relationships
    sale = relationship("Sale", back_populates="payments")

class InvoiceSyncLog(Base):
    __tablename__ = "invoice_sync_log"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    attempt_no = Column(Integer, nullable=False)
    payload = Column(JSONB, nullable=True)
    response = Column(JSONB, nullable=True)
    status = Column(Enum(FBRStatusEnum), nullable=False)
    attempted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now()) 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch") 