#!/usr/bin/env python3
"""
Schema Setup Script for FBR Integrated POS System
This script creates the FBR-compliant schema in the existing database.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_config():
    """Get database configuration from environment or use defaults"""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'admin'),
        'database': os.getenv('DB_NAME', 'pos_system')
    }

def create_schema():
    """Create the FBR-compliant schema"""
    config = get_database_config()
    
    print("Connecting to database...")
    print(f"Host: {config['host']}")
    print(f"Port: {config['port']}")
    print(f"User: {config['user']}")
    print(f"Database: {config['database']}")
    
    # Connect to the specific database
    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database']
        )
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully!")
        print("Creating FBR-compliant schema...")
        
        # Read and execute the schema file
        schema_file = os.path.join(os.path.dirname(__file__), 'create_fbr_schema.sql')
        
        if not os.path.exists(schema_file):
            print(f"❌ Schema file not found: {schema_file}")
            return False
        
        try:
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
            
            # Split the SQL into individual statements
            statements = schema_sql.split(';')
            
            for statement in statements:
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    try:
                        cursor.execute(statement)
                        print(f"✅ Executed: {statement[:50]}...")
                    except Exception as e:
                        if "already exists" not in str(e):
                            print(f"⚠️  Warning: {e}")
            
            conn.commit()
            print("✅ FBR schema created successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error creating schema: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False

def test_connection():
    """Test the database connection"""
    config = get_database_config()
    
    try:
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database']
        )
        cursor = conn.cursor()
        
        # Test basic queries
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Database connection successful!")
        if version:
            print(f"PostgreSQL version: {version[0]}")
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        if tables:
            print("✅ Tables found:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("⚠️  No tables found in database")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 FBR Integrated POS System - Schema Setup")
    print("=" * 60)
    
    # Check if psycopg2 is installed
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 is not installed. Please install it first:")
        print("pip install psycopg2-binary")
        sys.exit(1)
    
    # Create schema
    if not create_schema():
        print("❌ Failed to create schema. Please check the error messages above.")
        sys.exit(1)
    
    # Test connection
    if not test_connection():
        print("❌ Database connection test failed.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ Schema setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Install backend dependencies: 'pip install -r requirements.txt'")
    print("2. Install frontend dependencies: 'npm install'")
    print("3. Start the backend: 'python main.py'")
    print("4. Start the frontend: 'npm start'")
    print("\n🎉 Your FBR Integrated POS System is ready to use!")

if __name__ == "__main__":
    main() 