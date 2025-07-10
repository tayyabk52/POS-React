#!/usr/bin/env python3
"""
Reset Database and Create Fresh Test Data
This script clears all data and creates fresh test data for the POS system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, get_db
from models import Base, Branch, Device, Category, TaxRate, Product, Customer, Sale, SaleItem, Payment
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

def reset_and_create_data():
    """Reset database and create fresh test data"""
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Resetting database...")
        
        # Clear all data in reverse order of dependencies
        db.execute(text("DELETE FROM payments"))
        db.execute(text("DELETE FROM sale_items"))
        db.execute(text("DELETE FROM sales"))
        db.execute(text("DELETE FROM products"))
        db.execute(text("DELETE FROM customers"))
        db.execute(text("DELETE FROM devices"))
        db.execute(text("DELETE FROM branches"))
        db.execute(text("DELETE FROM categories"))
        db.execute(text("DELETE FROM tax_rates"))
        
        db.commit()
        print("✅ Database cleared successfully!")
        
        print("\nCreating fresh test data...")
        
        # 1. Create Branches
        print("Creating branches...")
        branches = [
            Branch(
                name="Main Branch",
                address="123 Main Street, Karachi",
                city="Karachi",
                province="Sindh",
                ntn="1234567",
                strn="1234567",
                fbr_branch_code="BR001"
            ),
            Branch(
                name="Lahore Branch",
                address="456 Mall Road, Lahore",
                city="Lahore",
                province="Punjab",
                ntn="2345678",
                strn="2345678",
                fbr_branch_code="BR002"
            )
        ]
        
        for branch in branches:
            db.add(branch)
        db.commit()
        print(f"Created {len(branches)} branches")
        
        # 2. Create Devices
        print("Creating devices...")
        devices = [
            Device(
                branch_id=branches[0].id,
                name="POS Terminal 1",
                device_identifier="POS001",
                fbr_pos_reg="POS001"
            ),
            Device(
                branch_id=branches[0].id,
                name="POS Terminal 2",
                device_identifier="POS002",
                fbr_pos_reg="POS002"
            ),
            Device(
                branch_id=branches[1].id,
                name="POS Terminal 3",
                device_identifier="POS003",
                fbr_pos_reg="POS003"
            )
        ]
        
        for device in devices:
            db.add(device)
        db.commit()
        print(f"Created {len(devices)} devices")
        
        # 3. Create Tax Rates
        print("Creating tax rates...")
        tax_rates = [
            TaxRate(name="Standard Rate", rate=17.0, code="SRO-1"),
            TaxRate(name="Zero Rate", rate=0.0, code="SRO-2"),
            TaxRate(name="Reduced Rate", rate=5.0, code="SRO-3"),
            TaxRate(name="Exempt", rate=0.0, code="SRO-4")
        ]
        
        for tax_rate in tax_rates:
            db.add(tax_rate)
        db.commit()
        print(f"Created {len(tax_rates)} tax rates")
        
        # 4. Create Categories
        print("Creating categories...")
        categories = [
            Category(name="Electronics", parent_id=None),
            Category(name="Clothing", parent_id=None),
            Category(name="Food & Beverages", parent_id=None),
            Category(name="Books", parent_id=None),
            Category(name="Home & Garden", parent_id=None)
        ]
        
        for category in categories:
            db.add(category)
        db.commit()
        
        # Add subcategories
        subcategories = [
            Category(name="Smartphones", parent_id=categories[0].id),
            Category(name="Laptops", parent_id=categories[0].id),
            Category(name="Men's Clothing", parent_id=categories[1].id),
            Category(name="Women's Clothing", parent_id=categories[1].id),
            Category(name="Beverages", parent_id=categories[2].id),
            Category(name="Snacks", parent_id=categories[2].id)
        ]
        
        for subcategory in subcategories:
            db.add(subcategory)
        db.commit()
        print(f"Created {len(categories) + len(subcategories)} categories")
        
        # 5. Create Products
        print("Creating products...")
        products = [
            # Electronics
            Product(
                code="PHONE001",
                name="iPhone 15 Pro",
                category_id=categories[0].id,
                price=150000.00,
                tax_id=tax_rates[0].id,
                hs_code="8517120000"
            ),
            Product(
                code="LAPTOP001",
                name="MacBook Pro 16",
                category_id=subcategories[1].id,
                price=450000.00,
                tax_id=tax_rates[0].id,
                hs_code="8471410000"
            ),
            Product(
                code="PHONE002",
                name="Samsung Galaxy S24",
                category_id=subcategories[0].id,
                price=120000.00,
                tax_id=tax_rates[0].id,
                hs_code="8517120000"
            ),
            
            # Clothing
            Product(
                code="SHIRT001",
                name="Men's Cotton Shirt",
                category_id=subcategories[2].id,
                price=2500.00,
                tax_id=tax_rates[0].id,
                hs_code="6205200000"
            ),
            Product(
                code="DRESS001",
                name="Women's Summer Dress",
                category_id=subcategories[3].id,
                price=3500.00,
                tax_id=tax_rates[0].id,
                hs_code="6204430000"
            ),
            
            # Food & Beverages
            Product(
                code="COLA001",
                name="Coca Cola 1.5L",
                category_id=subcategories[4].id,
                price=150.00,
                tax_id=tax_rates[0].id,
                hs_code="2202100000"
            ),
            Product(
                code="CHIPS001",
                name="Lay's Potato Chips",
                category_id=subcategories[5].id,
                price=100.00,
                tax_id=tax_rates[0].id,
                hs_code="2005200000"
            ),
            
            # Books (Zero Tax)
            Product(
                code="BOOK001",
                name="Programming Fundamentals",
                category_id=categories[3].id,
                price=1500.00,
                tax_id=tax_rates[1].id,
                hs_code="4901990000"
            ),
            
            # Home & Garden
            Product(
                code="GARDEN001",
                name="Garden Hose 50ft",
                category_id=categories[4].id,
                price=2500.00,
                tax_id=tax_rates[0].id,
                hs_code="3917230000"
            )
        ]
        
        for product in products:
            db.add(product)
        db.commit()
        print(f"Created {len(products)} products")
        
        # 6. Create Customers
        print("Creating customers...")
        customers = [
            Customer(
                name="Ahmed Khan",
                ntn="123456789",
                phone="+92 300 1234567",
                address="House 123, Street 5, Gulberg III, Lahore"
            ),
            Customer(
                name="Fatima Ali",
                ntn="987654321",
                phone="+92 301 9876543",
                address="Apartment 45, Block 7, Clifton, Karachi"
            ),
            Customer(
                name="Muhammad Hassan",
                phone="+92 302 5551234",
                address="Shop 12, Main Bazaar, Islamabad"
            ),
            Customer(
                name="Ayesha Malik",
                ntn="456789123",
                phone="+92 303 7778889",
                address="Villa 8, Phase 6, DHA, Karachi"
            ),
            Customer(
                name="Omar Farooq",
                phone="+92 304 1112223",
                address="House 67, Street 12, Model Town, Lahore"
            )
        ]
        
        for customer in customers:
            db.add(customer)
        db.commit()
        print(f"Created {len(customers)} customers")
        
        print("\n✅ Test data created successfully!")
        print("\n📊 Summary:")
        print(f"   • {len(branches)} Branches")
        print(f"   • {len(devices)} Devices")
        print(f"   • {len(tax_rates)} Tax Rates")
        print(f"   • {len(categories) + len(subcategories)} Categories")
        print(f"   • {len(products)} Products")
        print(f"   • {len(customers)} Customers")
        print("\n🚀 You can now test the POS system!")
        print("\n💡 Test Transaction Steps:")
        print("   1. Go to POS page")
        print("   2. Select a customer")
        print("   3. Select branch and device")
        print("   4. Add products to cart")
        print("   5. Complete the sale!")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_create_data() 