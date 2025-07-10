#!/usr/bin/env python3
"""
Test PostgreSQL Connection
"""

import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def test_connection():
    """Test PostgreSQL connection"""
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'admin'),
        'database': 'postgres'  # Connect to default postgres database first
    }
    
    print("Testing PostgreSQL connection...")
    print(f"Host: {config['host']}")
    print(f"Port: {config['port']}")
    print(f"User: {config['user']}")
    print(f"Password: {config['password']}")
    
    try:
        # Try connecting to default postgres database
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database='postgres'
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connection successful!")
        if version:
            print(f"PostgreSQL version: {version[0]}")
        else:
            print("PostgreSQL version: Unknown")
        
        # Check if pos_system database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'pos_system'")
        exists = cursor.fetchone()
        
        if exists:
            print("✅ pos_system database exists!")
        else:
            print("❌ pos_system database does not exist!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection() 