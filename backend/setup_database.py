#!/usr/bin/env python3
"""
Database Setup Script for FBR Integrated POS System
This script automatically creates the database and schema for the POS system.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_config():
    """Get database configuration from environment or use defaults"""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password'),
        'database': os.getenv('DB_NAME', 'pos_system')
    }

def create_database():
    """Create the database if it doesn't exist"""
    config = get_database_config()
    
    # Connect to PostgreSQL server (not specific database)
    conn = psycopg2.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password']
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (config['database'],))
    exists = cursor.fetchone()
    
    if not exists:
        print(f"Creating database '{config['database']}'...")
        cursor.execute(f"CREATE DATABASE {config['database']}")
        print(f"✅ Database '{config['database']}' created successfully!")
    else:
        print(f"✅ Database '{config['database']}' already exists!")
    
    cursor.close()
    conn.close()

def create_schema():
    """Create the FBR-compliant schema"""
    config = get_database_config()
    
    # Connect to the specific database
    conn = psycopg2.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password'],
        database=config['database']
    )
    cursor = conn.cursor()
    
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
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 FBR Integrated POS System - Database Setup")
    print("=" * 60)
    
    # Check if psycopg2 is installed
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 is not installed. Please install it first:")
        print("pip install psycopg2-binary")
        sys.exit(1)
    
    # Get database configuration
    config = get_database_config()
    print(f"📋 Database Configuration:")
    print(f"  Host: {config['host']}")
    print(f"  Port: {config['port']}")
    print(f"  User: {config['user']}")
    print(f"  Database: {config['database']}")
    print()
    
    # Create database
    try:
        create_database()
    except Exception as e:
        print(f"❌ Failed to create database: {e}")
        print("Please check your PostgreSQL connection settings.")
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
    print("✅ Database setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Update backend/.env with your database credentials")
    print("2. Run 'npm install' to install frontend dependencies")
    print("3. Run 'cd backend && pip install -r requirements.txt'")
    print("4. Start the backend: 'npm run backend'")
    print("5. Start the frontend: 'npm start'")
    print("\n🎉 Your FBR Integrated POS System is ready to use!")

if __name__ == "__main__":
    main() 