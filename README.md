# FBR Integrated POS System - React + Python Backend

A modern Point of Sale (POS) system built with React frontend and Python FastAPI backend, **fully compliant with FBR (Federal Board of Revenue) requirements** and designed to be packaged as a single executable file for easy client deployment.

## 🎯 **FBR Compliance Features**

- **✅ FBR Invoice Integration** - Automatic invoice generation with FBR-compliant format
- **✅ Tax Calculation** - Proper sales tax, further tax, CVT, and withholding tax calculations
- **✅ USIN Generation** - Unique Sale Invoice Numbers as required by FBR
- **✅ QR Code Generation** - FBR-compliant QR codes for invoices
- **✅ Branch & Device Management** - Multi-branch support with FBR registration
- **✅ Audit Trail** - Complete logging of all FBR sync attempts
- **✅ Real-time Sync** - Automatic synchronization with FBR systems

## 🚀 **Key Features**

- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time POS**: Product grid with cart functionality and FBR tax calculations
- **Inventory Management**: Product and category management with HS codes
- **Sales Tracking**: Complete sales history with FBR integration
- **Multi-Branch Support**: Manage multiple outlets with separate FBR registrations
- **Device Management**: Track POS devices with FBR registration numbers
- **Tax Management**: Configurable tax rates with FBR SRO schedule codes
- **Database**: PostgreSQL integration for reliable data storage
- **Packaging**: Electron-based packaging for single executable distribution

## 🏗️ **Technology Stack**

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API communication

### Backend
- Python FastAPI
- SQLAlchemy ORM with PostgreSQL
- Pydantic for data validation
- FBR API integration ready
- Decimal precision for tax calculations

### Packaging
- Electron for desktop application
- Electron Builder for executable creation

## 📋 **Prerequisites**

- Node.js 16+ and npm
- Python 3.8+
- PostgreSQL database
- Git

## 🛠️ **Installation & Setup**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd react-pos-app
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Database Setup

Create a PostgreSQL database named `pos_system` and run the FBR schema:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d pos_system

# Run the FBR schema script
\i backend/create_fbr_schema.sql
```

Update the connection string in `backend/database.py`:

```python
DATABASE_URL = "postgresql://username:password@localhost:5432/pos_system"
```

### 5. Environment Configuration

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pos_system
SECRET_KEY=your-secret-key-here
FBR_API_URL=https://fbr.gov.pk/api
FBR_API_KEY=your-fbr-api-key
```

## 🚀 **Development**

### Start Development Servers

1. **Start Backend Server**:
```bash
npm run backend
# or
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Start Frontend Server**:
```bash
npm start
```

3. **Start Both Servers**:
```bash
npm run dev
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- FBR Status: http://localhost:8000/api/fbr-status

## 🏗️ **Building for Production**

### 1. Build React App
```bash
npm run build
```

### 2. Create Executable
```bash
npm run electron-pack
```

The executable will be created in the `dist` folder.

## 📊 **Project Structure**

```
react-pos-app/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── database.py         # Database configuration
│   ├── models.py           # FBR-compliant SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas with FBR fields
│   ├── routers/            # API route handlers
│   │   ├── products.py     # Product management
│   │   ├── sales.py        # Sales with FBR integration
│   │   ├── categories.py   # Category management
│   │   ├── branches.py     # Branch/outlet management
│   │   ├── devices.py      # POS device management
│   │   └── tax_rates.py    # Tax rate management
│   ├── create_fbr_schema.sql # FBR database schema
│   └── requirements.txt    # Python dependencies
├── public/                 # Static files
│   ├── index.html
│   └── electron.js        # Electron main process
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── App.tsx            # Main app component
│   ├── index.tsx          # React entry point
│   └── index.css          # Global styles
├── package.json           # Node.js dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md             # This file
```

## 🔌 **API Endpoints**

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/{id}` - Get product by ID
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/code/{code}` - Get product by code

### Sales (FBR Integrated)
- `GET /api/sales` - List all sales
- `POST /api/sales` - Create new sale with FBR compliance
- `GET /api/sales/{id}` - Get sale by ID
- `POST /api/sales/{id}/sync-fbr` - Sync sale to FBR
- `GET /api/sales/fbr-status/{id}` - Get FBR sync status
- `GET /api/sales/stats/daily` - Daily sales statistics
- `GET /api/sales/stats/monthly` - Monthly sales statistics

### Branches
- `GET /api/branches` - List all branches
- `POST /api/branches` - Create new branch
- `GET /api/branches/{id}` - Get branch by ID
- `PUT /api/branches/{id}` - Update branch
- `DELETE /api/branches/{id}` - Delete branch

### Devices
- `GET /api/devices` - List all POS devices
- `POST /api/devices` - Create new device
- `GET /api/devices/{id}` - Get device by ID
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device

### Tax Rates
- `GET /api/tax-rates` - List all tax rates
- `POST /api/tax-rates` - Create new tax rate
- `GET /api/tax-rates/{id}` - Get tax rate by ID
- `PUT /api/tax-rates/{id}` - Update tax rate
- `DELETE /api/tax-rates/{id}` - Delete tax rate

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

## 🗄️ **FBR Database Schema**

### Core Tables
- `branches` - Store locations with FBR branch codes
- `devices` - POS devices with FBR registration numbers
- `categories` - Product categories with hierarchy
- `tax_rates` - Tax rates with FBR SRO schedule codes
- `products` - Products with HS codes and tax rates
- `customers` - Customer information (optional)
- `sales` - Sales invoices with FBR integration
- `sale_items` - Line items with detailed tax breakdown
- `payments` - Payment information
- `invoice_sync_log` - FBR sync audit trail

### FBR-Specific Fields
- **USIN** - Unique Sale Invoice Number
- **FBR Invoice Number** - Assigned by FBR system
- **QR Payload** - FBR-compliant QR code data
- **FBR Status** - Sync status (PENDING, SENT, SUCCESS, FAILED)
- **Tax Breakdown** - Sales tax, further tax, CVT, withholding taxes
- **HS Codes** - Harmonized System codes for products
- **SRO Codes** - FBR SRO schedule codes for tax rates

## 🔧 **FBR Integration Features**

### Automatic Features
- **Invoice Generation** - FBR-compliant invoice format
- **Tax Calculation** - Automatic calculation of all required taxes
- **USIN Generation** - Unique invoice numbers
- **QR Code Generation** - FBR-compliant QR codes
- **Real-time Sync** - Automatic synchronization with FBR

### Manual Features
- **Branch Management** - Register multiple outlets
- **Device Management** - Register POS devices
- **Tax Rate Configuration** - Set up FBR-compliant tax rates
- **Audit Trail** - Complete logging of all FBR interactions

## 📦 **Deployment**

### For Client Distribution

1. Build the application:
```bash
npm run build
npm run electron-pack
```

2. The executable will be in the `dist` folder
3. Distribute the executable file to clients
4. Clients only need to run the executable - no installation required

### Requirements for Client Machines

- Windows 10/11 (for Windows executable)
- PostgreSQL database (can be installed separately)
- No additional software installation required

## 🔒 **FBR Compliance Checklist**

- ✅ **Invoice Format** - FBR-compliant invoice structure
- ✅ **Tax Calculation** - All required taxes calculated
- ✅ **USIN Generation** - Unique invoice numbers
- ✅ **QR Code** - FBR-compliant QR codes
- ✅ **Branch Registration** - Multi-branch support
- ✅ **Device Registration** - POS device tracking
- ✅ **Audit Trail** - Complete transaction logging
- ✅ **Real-time Sync** - Automatic FBR synchronization
- ✅ **Data Validation** - FBR field validation
- ✅ **Error Handling** - Proper error management

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support and questions, please contact the development team.

---

**Note**: This system is designed to be fully compliant with FBR requirements for POS systems in Pakistan. Ensure you have proper FBR registration and API access before deploying in production. 