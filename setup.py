#!/usr/bin/env python3
"""
Setup script for POS System
This script helps with initial setup and database configuration.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_node_version():
    """Check if Node.js is installed."""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()} detected")
            return True
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found")
        return False

def install_python_dependencies():
    """Install Python dependencies."""
    print("\n📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'backend/requirements.txt'], check=True)
        print("✅ Python dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Python dependencies: {e}")
        return False
    return True

def install_node_dependencies():
    """Install Node.js dependencies."""
    print("\n📦 Installing Node.js dependencies...")
    try:
        subprocess.run(['npm', 'install'], check=True)
        print("✅ Node.js dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Node.js dependencies: {e}")
        return False
    return True

def create_env_file():
    """Create .env file from template."""
    env_file = Path("backend/.env")
    env_example = Path("backend/env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if env_example.exists():
        print("\n📝 Creating .env file from template...")
        try:
            with open(env_example, 'r') as f:
                content = f.read()
            
            with open(env_file, 'w') as f:
                f.write(content)
            
            print("✅ .env file created successfully")
            print("⚠️  Please update the DATABASE_URL in backend/.env with your PostgreSQL credentials")
            return True
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    else:
        print("❌ env.example file not found")
        return False

def check_database_connection():
    """Check database connection."""
    print("\n🔍 Checking database connection...")
    try:
        # This would need to be implemented based on your database setup
        print("⚠️  Please ensure PostgreSQL is running and the database 'pos_system' exists")
        print("⚠️  Update the DATABASE_URL in backend/.env with correct credentials")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 POS System Setup")
    print("=" * 50)
    
    # Check prerequisites
    check_python_version()
    if not check_node_version():
        print("\n❌ Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    
    # Install dependencies
    if not install_python_dependencies():
        sys.exit(1)
    
    if not install_node_dependencies():
        sys.exit(1)
    
    # Create environment file
    if not create_env_file():
        sys.exit(1)
    
    # Check database
    check_database_connection()
    
    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Update backend/.env with your PostgreSQL credentials")
    print("2. Create the 'pos_system' database in PostgreSQL")
    print("3. Run 'npm run dev' to start the development servers")
    print("4. Access the application at http://localhost:3000")
    print("\n📚 For more information, see README.md")

if __name__ == "__main__":
    main() 