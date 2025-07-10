#!/usr/bin/env python3
"""
Create sample data for testing the FBR POS System
"""

import os
import sys
from decimal import Decimal
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, Category, TaxRate, Product, Branch, Device, Customer
from schemas import CategoryCreate, TaxRateCreate, ProductCreate, BranchCreate, DeviceCreate, CustomerCreate

def create_sample_data():
    """Create sample data for testing"""
    print("🚀 Creating sample data for FBR POS System...")
    
    # Create database session
    db = next(get_db())
    
    try:
        # Create sample categories
        print("Creating categories...")
        categories = [
            CategoryCreate(name="Beverages", parent_id=None),
            CategoryCreate(name="Dairy", parent_id=None),
            CategoryCreate(name="Bakery", parent_id=None),
        ]
        
        created_categories = []
        for category_data in categories:
            db_category = Category(**category_data.dict())
            db.add(db_category)
            db.commit()
            db.refresh(db_category)
            created_categories.append(db_category)
            print(f"✅ Created category: {db_category.name}")
        
        # Create sample tax rates
        print("Creating tax rates...")
        tax_rates = [
            TaxRateCreate(name="Standard Rate", rate=Decimal("17.00"), code="SRO-1"),
            TaxRateCreate(name="Zero Rate", rate=Decimal("0.00"), code="SRO-2"),
            TaxRateCreate(name="Reduced Rate", rate=Decimal("8.00"), code="SRO-3"),
        ]
        
        created_tax_rates = []
        for tax_data in tax_rates:
            db_tax = TaxRate(**tax_data.dict())
            db.add(db_tax)
            db.commit()
            db.refresh(db_tax)
            created_tax_rates.append(db_tax)
            print(f"✅ Created tax rate: {db_tax.name} ({db_tax.rate}%)")
        
        # Create sample branch
        print("Creating branch...")
        branch_data = BranchCreate(
            name="Main Branch",
            address="123 Main Street, Karachi",
            city="Karachi",
            province="Sindh",
            ntn="1234567",
            strn="7654321",
            fbr_branch_code="BR001"
        )
        
        db_branch = Branch(**branch_data.dict())
        db.add(db_branch)
        db.commit()
        db.refresh(db_branch)
        print(f"✅ Created branch: {db_branch.name}")
        
        # Create sample device
        print("Creating device...")
        device_data = DeviceCreate(
            branch_id=db_branch.id,
            name="POS Terminal 1",
            device_identifier="POS001",
            fbr_pos_reg="POS001"
        )
        
        db_device = Device(**device_data.dict())
        db.add(db_device)
        db.commit()
        db.refresh(db_device)
        print(f"✅ Created device: {db_device.name}")
        
        # Create sample products
        print("Creating products...")
        products = [
            ProductCreate(
                code="COF001",
                name="Coffee Beans",
                category_id=created_categories[0].id,
                price=Decimal("12.99"),
                tax_id=created_tax_rates[0].id,
                hs_code="090111"
            ),
            ProductCreate(
                code="MIL001",
                name="Fresh Milk",
                category_id=created_categories[1].id,
                price=Decimal("3.99"),
                tax_id=created_tax_rates[0].id,
                hs_code="040110"
            ),
            ProductCreate(
                code="BRD001",
                name="Whole Wheat Bread",
                category_id=created_categories[2].id,
                price=Decimal("2.49"),
                tax_id=created_tax_rates[0].id,
                hs_code="190590"
            ),
            ProductCreate(
                code="TEA001",
                name="Green Tea",
                category_id=created_categories[0].id,
                price=Decimal("5.99"),
                tax_id=created_tax_rates[1].id,
                hs_code="090210"
            ),
        ]
        
        for product_data in products:
            db_product = Product(**product_data.dict())
            db.add(db_product)
            db.commit()
            db.refresh(db_product)
            print(f"✅ Created product: {db_product.name} (${db_product.price})")
        
        # Create sample customer
        print("Creating customer...")
        customer_data = CustomerCreate(
            name="John Doe",
            ntn="123456789",
            phone="+92-300-1234567",
            address="456 Customer Street, Karachi"
        )
        
        db_customer = Customer(**customer_data.dict())
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        print(f"✅ Created customer: {db_customer.name}")
        
        print("\n🎉 Sample data created successfully!")
        print(f"📊 Summary:")
        print(f"  - Categories: {len(created_categories)}")
        print(f"  - Tax Rates: {len(created_tax_rates)}")
        print(f"  - Products: {len(products)}")
        print(f"  - Branch: 1")
        print(f"  - Device: 1")
        print(f"  - Customer: 1")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data() 