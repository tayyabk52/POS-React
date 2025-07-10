#!/usr/bin/env python3
"""
Development Startup Script for FBR Integrated POS System
This script helps set up and start the development environment.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, description, cwd=None):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully!")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {description} failed!")
            if result.stderr:
                print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False
    
    return True

def check_prerequisites():
    """Check if required software is installed"""
    print("🔍 Checking prerequisites...")
    
    # Check Python
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Python: {result.stdout.strip()}")
        else:
            print("❌ Python not found")
            return False
    except:
        print("❌ Python not found")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except:
        print("❌ Node.js not found")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except:
        print("❌ npm not found")
        return False
    
    return True

def setup_database():
    """Set up the database"""
    print("\n🗄️  Setting up database...")
    
    # Check if psycopg2 is installed
    try:
        import psycopg2
        print("✅ psycopg2 is installed")
    except ImportError:
        print("📦 Installing psycopg2...")
        if not run_command("pip install psycopg2-binary", "Installing psycopg2"):
            return False
    
    # Run database setup script
    if not run_command("python backend/setup_database.py", "Setting up database", cwd="."):
        print("❌ Database setup failed. Please check your PostgreSQL installation.")
        return False
    
    return True

def install_dependencies():
    """Install Python and Node.js dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Install Python dependencies
    if not run_command("pip install -r backend/requirements.txt", "Installing Python dependencies"):
        return False
    
    # Install Node.js dependencies
    if not run_command("npm install", "Installing Node.js dependencies"):
        return False
    
    return True

def start_development():
    """Start the development servers"""
    print("\n🚀 Starting development servers...")
    
    # Start backend server
    print("🔄 Starting backend server...")
    backend_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd="backend"
    )
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend server
    print("🔄 Starting frontend server...")
    frontend_process = subprocess.Popen(
        ["npm", "start"],
        cwd="."
    )
    
    print("\n🎉 Development servers started!")
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("\n⏹️  Press Ctrl+C to stop the servers")
    
    try:
        # Wait for processes to complete
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("✅ Servers stopped")

def main():
    """Main function"""
    print("🚀 FBR Integrated POS System - Development Setup")
    print("=" * 60)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please install:")
        print("- Python 3.8+")
        print("- Node.js 16+")
        print("- PostgreSQL")
        sys.exit(1)
    
    # Set up database
    if not setup_database():
        print("\n❌ Database setup failed.")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Dependency installation failed.")
        sys.exit(1)
    
    # Start development servers
    start_development()

if __name__ == "__main__":
    main() 