const API_BASE_URL = 'http://localhost:8000';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    parent_id?: number;
  };
  price: number;
  tax_id?: number;
  tax_rate?: {
    id: number;
    name: string;
    rate: number;
    code?: string;
  };
  hs_code?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
}

export interface Sale {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_id?: number;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    ntn?: string;
    address?: string;
  };
  branch_id: number;
  branch?: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    province?: string;
    ntn: string;
    strn: string;
    fbr_branch_code: string;
  };
  device_id: number;
  device?: {
    id: number;
    name: string;
    device_identifier: string;
    fbr_pos_reg: string;
  };
  invoice_type: 'PURCHASE' | 'SALE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
  sale_type_code: string;
  seller_ntn: string;
  seller_strn: string;
  buyer_ntn?: string;
  buyer_name?: string;
  total_qty: number;
  total_sales_value: number;
  total_tax: number;
  total_discount: number;
  total_amount: number;
  usin: string;
  fbr_invoice_no?: string;
  qr_payload?: string;
  fbr_payload?: any;
  fbr_response?: any;
  fbr_status: 'PENDING' | 'SENT' | 'SUCCESS' | 'FAILED';
  sync_attempts: number;
  last_synced_at?: string;
  created_at: string;
  items: SaleItem[];
  payments: Payment[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product: Product;
  hs_code?: string;
  quantity: number;
  unit_price: number;
  value_excl_tax: number;
  sales_tax: number;
  further_tax: number;
  c_v_t: number;
  w_h_tax_1: number;
  w_h_tax_2: number;
  discount: number;
  sro_item_serial_no?: string;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: number;
  sale_id: number;
  method: string;
  amount: number;
  payment_date: string;
  details?: any;
}

export interface Customer {
  id: number;
  name: string;
  ntn?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  ntn: string;
  strn: string;
  fbr_branch_code: string;
  created_at: string;
}

export interface Device {
  id: number;
  branch_id: number;
  name: string;
  device_identifier: string;
  fbr_pos_reg: string;
  branch?: Branch;
  created_at: string;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  code?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  branch_id?: number;
  branch?: Branch;
  is_active: boolean;
  created_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      // Convert string prices to numbers for frontend compatibility
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.price && typeof item.price === 'string') {
            item.price = parseFloat(item.price);
          }
        });
      } else if (data.price && typeof data.price === 'string') {
        data.price = parseFloat(data.price);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await this.request<Product[]>('/api/products/');
    return response.data || response;
  }

  async getProduct(id: number): Promise<Product> {
    const response = await this.request<Product>(`/api/products/${id}`);
    return response.data || response;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const response = await this.request<Product>('/api/products/', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response.data || response;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return response.data || response;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.request<Category[]>('/api/categories/');
    return response.data || response;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await this.request<Category>(`/api/categories/${id}`);
    return response.data || response;
  }

  async createCategory(category: Omit<Category, 'id' | 'parent' | 'children'>): Promise<Category> {
    const response = await this.request<Category>('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response.data || response;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await this.request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return response.data || response;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    const response = await this.request<Sale[]>('/api/sales/');
    const sales = (response.data || response) as any[];
    // Convert monetary fields to numbers
    return sales.map((sale) => ({
      ...sale,
      total_amount: Number(sale.total_amount),
      total_sales_value: Number(sale.total_sales_value),
      total_tax: Number(sale.total_tax),
      total_discount: Number(sale.total_discount),
      total_qty: Number(sale.total_qty),
      items: sale.items?.map((item: any) => ({
        ...item,
        unit_price: Number(item.unit_price),
        value_excl_tax: Number(item.value_excl_tax),
        sales_tax: Number(item.sales_tax),
        further_tax: Number(item.further_tax),
        c_v_t: Number(item.c_v_t),
        w_h_tax_1: Number(item.w_h_tax_1),
        w_h_tax_2: Number(item.w_h_tax_2),
        discount: Number(item.discount),
        line_total: Number(item.line_total),
      })) || [],
      payments: sale.payments?.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount),
      })) || [],
    }));
  }

  async getSale(id: number): Promise<Sale> {
    const response = await this.request<Sale>(`/api/sales/${id}`);
    return response.data || response;
  }

  async createSale(sale: any): Promise<Sale> {
    const response = await this.request<Sale>('/api/sales/', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    return response.data || response;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const response = await this.request<Customer[]>('/api/customers/');
    return response.data || response;
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await this.request<Customer>(`/api/customers/${id}`);
    return response.data || response;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const response = await this.request<Customer>('/api/customers/', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return response.data || response;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    const response = await this.request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    return response.data || response;
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.request(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    const response = await this.request<Branch[]>('/api/branches/');
    return response.data || response;
  }

  async getBranch(id: number): Promise<Branch> {
    const response = await this.request<Branch>(`/api/branches/${id}`);
    return response.data || response;
  }

  async createBranch(branch: Omit<Branch, 'id' | 'created_at'>): Promise<Branch> {
    const response = await this.request<Branch>('/api/branches/', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
    return response.data || response;
  }

  async updateBranch(id: number, branch: Partial<Branch>): Promise<Branch> {
    const response = await this.request<Branch>(`/api/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branch),
    });
    return response.data || response;
  }

  async deleteBranch(id: number): Promise<void> {
    await this.request(`/api/branches/${id}`, {
      method: 'DELETE',
    });
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    const response = await this.request<Device[]>('/api/devices/');
    return response.data || response;
  }

  async getDevice(id: number): Promise<Device> {
    const response = await this.request<Device>(`/api/devices/${id}`);
    return response.data || response;
  }

  async createDevice(device: Omit<Device, 'id' | 'created_at'>): Promise<Device> {
    const response = await this.request<Device>('/api/devices/', {
      method: 'POST',
      body: JSON.stringify(device),
    });
    return response.data || response;
  }

  async updateDevice(id: number, device: Partial<Device>): Promise<Device> {
    const response = await this.request<Device>(`/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
    return response.data || response;
  }

  async deleteDevice(id: number): Promise<void> {
    await this.request(`/api/devices/${id}`, {
      method: 'DELETE',
    });
  }

  // Tax Rates
  async getTaxRates(): Promise<TaxRate[]> {
    const response = await this.request<TaxRate[]>('/api/tax-rates/');
    return response.data || response;
  }

  async getTaxRate(id: number): Promise<TaxRate> {
    const response = await this.request<TaxRate>(`/api/tax-rates/${id}`);
    return response.data || response;
  }

  async createTaxRate(taxRate: Omit<TaxRate, 'id'>): Promise<TaxRate> {
    const response = await this.request<TaxRate>('/api/tax-rates/', {
      method: 'POST',
      body: JSON.stringify(taxRate),
    });
    return response.data || response;
  }

  async updateTaxRate(id: number, taxRate: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.request<TaxRate>(`/api/tax-rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taxRate),
    });
    return response.data || response;
  }

  async deleteTaxRate(id: number): Promise<void> {
    await this.request(`/api/tax-rates/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await this.request<User[]>('/api/users/');
    return response.data || response;
  }
}

export const apiService = new ApiService();
export default apiService; 