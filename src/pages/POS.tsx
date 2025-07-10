import React, { useState, useEffect, useContext, useRef } from 'react';
import { createContext } from 'react';
import { Plus, Minus, Trash2, CreditCard, DollarSign, Loader2, User, Search, Calculator, Settings, Receipt, QrCode, FileText } from 'lucide-react';
import { apiService, Product, Customer, Category, Branch, Device, TaxRate } from '../services/api';
import Modal from '../components/Modal';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  salesTax: number;
  furtherTax: number;
  cvt: number;
  whTax1: number;
  whTax2: number;
  discount: number;
  total: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
  details?: any;
}

type TaxType = 'salesTax' | 'furtherTax' | 'cvt' | 'whTax1' | 'whTax2';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSaleSettingsModal, setShowSaleSettingsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [processingSale, setProcessingSale] = useState(false);
  
  // Sale Settings
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PURCHASE' | 'DEBIT_NOTE' | 'CREDIT_NOTE'>('SALE');
  // Remove saleTypeCode state, always use selectedBranch.sale_type_code
  const [buyerNTN, setBuyerNTN] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [totalDiscount, setTotalDiscount] = useState(0);
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('cash');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0);
  
  // Receipt Data
  const [lastSale, setLastSale] = useState<any>(null);

  // 1. Add state for tax toggles per cart item
  const [cartTaxToggles, setCartTaxToggles] = useState<{[productId: number]: Record<TaxType, boolean>}>({});

  // 2. Add state for amount paid in checkout
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, customersData, categoriesData, branchesData, devicesData, taxRatesData] = await Promise.all([
          apiService.getProducts(),
          apiService.getCustomers(),
          apiService.getCategories(),
          apiService.getBranches(),
          apiService.getDevices(),
          apiService.getTaxRates()
        ]);
        setProducts(productsData);
        setCustomers(customersData);
        setCategories(categoriesData);
        setBranches(branchesData);
        setDevices(devicesData);
        setTaxRates(taxRatesData);
        
        // Set default branch and device if available
        if (branchesData.length > 0) {
          setSelectedBranch(branchesData[0]);
        }
        if (devicesData.length > 0) {
          setSelectedDevice(devicesData[0]);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateTaxes = (price: number, quantity: number, taxRate?: TaxRate) => {
    if (!taxRate) return { salesTax: 0, furtherTax: 0, cvt: 0, whTax1: 0, whTax2: 0 };
    
    const subtotal = price * quantity;
    const salesTax = (subtotal * taxRate.rate) / 100;
    const furtherTax = salesTax * 0.03; // 3% of sales tax
    const cvt = subtotal * 0.01; // 1% of subtotal
    const whTax1 = subtotal * 0.005; // 0.5% of subtotal
    const whTax2 = subtotal * 0.002; // 0.2% of subtotal
    
    return { salesTax, furtherTax, cvt, whTax1, whTax2 };
  };

  // 3. Update addToCart to initialize tax toggles for new items
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
    const taxRate = product.tax_rate;
    // Default: all taxes ON
    const defaultToggles = {salesTax: true, furtherTax: true, cvt: true, whTax1: true, whTax2: true};
    if (!cartTaxToggles[product.id]) {
      setCartTaxToggles(prev => ({...prev, [product.id]: defaultToggles}));
    }
    if (existingItem) {
      setCart(cart.map(item => {
        if (item.product.id === product.id) {
          const newQuantity = item.quantity + 1;
          return updateCartItemWithToggles(item, newQuantity, cartTaxToggles[product.id] || defaultToggles);
        }
        return item;
      }));
    } else {
      const toggles = cartTaxToggles[product.id] || defaultToggles;
      setCart([...cart, updateCartItemWithToggles({product, quantity: 1, unitPrice: price, subtotal: price, salesTax: 0, furtherTax: 0, cvt: 0, whTax1: 0, whTax2: 0, discount: 0, total: 0}, 1, toggles)]);
    }
  };

  // 4. Helper to update cart item with toggles
  function updateCartItemWithToggles(item: CartItem, quantity: number, toggles: {salesTax: boolean, furtherTax: boolean, cvt: boolean, whTax1: boolean, whTax2: boolean}) {
    const price = item.unitPrice;
    const taxRate = item.product.tax_rate;
    const subtotal = price * quantity;
    let salesTax = 0, furtherTax = 0, cvt = 0, whTax1 = 0, whTax2 = 0;
    if (taxRate) {
      if (toggles.salesTax) salesTax = (subtotal * taxRate.rate) / 100;
      if (toggles.furtherTax) furtherTax = salesTax * 0.03;
      if (toggles.cvt) cvt = subtotal * 0.01;
      if (toggles.whTax1) whTax1 = subtotal * 0.005;
      if (toggles.whTax2) whTax2 = subtotal * 0.002;
    }
    const total = subtotal + salesTax + furtherTax + cvt + whTax1 + whTax2 - item.discount;
    return {...item, quantity, subtotal, salesTax, furtherTax, cvt, whTax1, whTax2, total};
  }

  // 5. Update updateQuantity to use toggles
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const toggles = cartTaxToggles[productId] || {salesTax: true, furtherTax: true, cvt: true, whTax1: true, whTax2: true};
        return updateCartItemWithToggles(item, quantity, toggles);
      }
      return item;
    }));
  };

  // 6. Update updateItemDiscount to use toggles
  const updateItemDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const toggles = cartTaxToggles[productId] || {salesTax: true, furtherTax: true, cvt: true, whTax1: true, whTax2: true};
        return updateCartItemWithToggles({...item, discount}, item.quantity, toggles);
      }
      return item;
    }));
  };

  // 7. Handler for toggling taxes
  const handleToggleTax = (productId: number, tax: TaxType) => {
    setCartTaxToggles(prev => {
      const toggles = {...(prev[productId] || {salesTax: true, furtherTax: true, cvt: true, whTax1: true, whTax2: true})};
      toggles[tax] = !toggles[tax];
      // Update cart item with new toggles
      setCart(cart => cart.map(item => item.product.id === productId ? updateCartItemWithToggles(item, item.quantity, toggles) : item));
      return {...prev, [productId]: toggles};
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getTotalSalesTax = () => {
    return cart.reduce((sum, item) => sum + item.salesTax, 0);
  };

  const getTotalFurtherTax = () => {
    return cart.reduce((sum, item) => sum + item.furtherTax, 0);
  };

  const getTotalCVT = () => {
    return cart.reduce((sum, item) => sum + item.cvt, 0);
  };

  const getTotalWHTax1 = () => {
    return cart.reduce((sum, item) => sum + item.whTax1, 0);
  };

  const getTotalWHTax2 = () => {
    return cart.reduce((sum, item) => sum + item.whTax2, 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0) + totalDiscount;
  };

  const getTotal = () => {
    return getSubtotal() + getTotalSalesTax() + getTotalFurtherTax() + getTotalCVT() + getTotalWHTax1() + getTotalWHTax2() - getTotalDiscount();
  };

  const getTotalQty = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethods([]);
    setTotalDiscount(0);
    setBuyerNTN('');
    setBuyerName('');
  };

  const addPaymentMethod = () => {
    if (currentPaymentAmount > 0) {
      setPaymentMethods([...paymentMethods, {
        method: currentPaymentMethod,
        amount: currentPaymentAmount,
        details: { payment_type: currentPaymentMethod }
      }]);
      setCurrentPaymentAmount(0);
    }
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (!selectedBranch) {
      alert('Please select a branch');
      return;
    }

    if (!selectedDevice) {
      alert('Please select a device');
      return;
    }

    setShowCheckoutModal(true);
  };

  const processSale = async () => {
    try {
      setProcessingSale(true);
      // Fetch latest branch and device from backend
      const branch = selectedBranch ? await apiService.getBranch(selectedBranch.id) : null;
      const device = selectedDevice ? await apiService.getDevice(selectedDevice.id) : null;
      if (!branch || !device) throw new Error('Branch or device not selected');

      // Calculate totals
      const totalQty = getTotalQty();
      const totalSalesValue = getSubtotal();
      const totalTax = getTotalSalesTax() + getTotalFurtherTax() + getTotalCVT() + getTotalWHTax1() + getTotalWHTax2();
      const totalAmount = getTotal();

      // Generate unique invoice number and USIN
      const timestamp = Date.now();
      const invoiceNo = `INV-${timestamp}`;
      const usin = `USIN-${timestamp}`;

      const saleData = {
        invoice_no: invoiceNo,
        branch_id: branch.id,
        device_id: device.id,
        customer_id: selectedCustomer!.id,
        invoice_date: new Date().toISOString(),
        invoice_type: invoiceType,
        sale_type_code: branch.sale_type_code,
        seller_ntn: branch.ntn,
        seller_strn: branch.strn,
        buyer_ntn: buyerNTN || selectedCustomer!.ntn || undefined,
        buyer_name: buyerName || selectedCustomer!.name,
        total_qty: totalQty,
        total_sales_value: totalSalesValue,
        total_tax: totalTax,
        total_discount: getTotalDiscount(),
        total_amount: totalAmount,
        usin: usin,
        fbr_status: 'PENDING',
        sync_attempts: 0,
        items: cart.map(item => {
          return {
            product_id: item.product.id,
            hs_code: item.product.hs_code || undefined,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            value_excl_tax: item.subtotal,
            sales_tax: item.salesTax,
            further_tax: item.furtherTax,
            c_v_t: item.cvt,
            w_h_tax_1: item.whTax1,
            w_h_tax_2: item.whTax2,
            discount: item.discount,
            sro_item_serial_no: undefined,
            line_total: item.total
          };
        }),
        payments: paymentMethods.length > 0 ? paymentMethods : [{
          method: 'cash',
          amount: totalAmount,
          details: { payment_type: 'cash' }
        }]
      };

      const createdSale = await apiService.createSale(saleData);
      setLastSale(createdSale);

      // Clear cart and close modal
      clearCart();
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Error processing sale:', err);
      alert('Failed to process sale. Please try again.');
    } finally {
      setProcessingSale(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading POS system...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full space-x-6">
        {/* Products Grid */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col justify-between h-56 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-5 group hover:-translate-y-1 duration-150 min-w-0"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 font-bold text-2xl mb-2 shadow-inner">
                      {product.name.charAt(0)}
                    </div>
                    <div className="font-bold text-lg text-gray-900 truncate w-full" title={product.name}>{product.name}</div>
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {product.category && (
                        <span className="bg-gray-50 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                          {product.category.name}
                        </span>
                      )}
                      {product.tax_rate && (
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">
                          Tax: {product.tax_rate.rate}%
                        </span>
                      )}
                      {product.hs_code && (
                        <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full border border-green-100">
                          HS: {product.hs_code}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 truncate w-full">Code: {product.code}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="inline-block bg-primary-600 text-white text-base font-semibold px-4 py-1 rounded-full shadow-sm">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Cart</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSaleSettingsModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Sale Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Customer Selection */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Customer</h3>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  Change
                </button>
              </div>
              {selectedCustomer ? (
                <div className="text-sm">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && <p className="text-gray-500">{selectedCustomer.phone}</p>}
                  {selectedCustomer.ntn && <p className="text-gray-500">NTN: {selectedCustomer.ntn}</p>}
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full text-left text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Select Customer
                </button>
              )}
            </div>

            {/* Branch & Device Selection */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Branch</label>
                  <select
                    value={selectedBranch?.id || ''}
                    onChange={(e) => {
                      const branch = branches.find(b => b.id === parseInt(e.target.value));
                      setSelectedBranch(branch || null);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Device</label>
                  <select
                    value={selectedDevice?.id || ''}
                    onChange={(e) => {
                      const device = devices.find(d => d.id === parseInt(e.target.value));
                      setSelectedDevice(device || null);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Select Device</option>
                    {devices.map(device => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span>${item.unitPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Quantity:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                      
                      {item.salesTax > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Sales Tax:</span>
                          <span>${item.salesTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {item.furtherTax > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Further Tax:</span>
                          <span>${item.furtherTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {item.cvt > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>CVT:</span>
                          <span>${item.cvt.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {item.whTax1 > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>WH Tax 1:</span>
                          <span>${item.whTax1.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {item.whTax2 > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>WH Tax 2:</span>
                          <span>${item.whTax2.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 flex-wrap text-xs mt-2">
                        {(['salesTax','furtherTax','cvt','whTax1','whTax2'] as TaxType[]).map(tax => (
                          <label key={tax} className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={cartTaxToggles[item.product.id]?.[tax]} onChange={() => handleToggleTax(item.product.id, tax)} />
                            <span className="capitalize">{tax.replace(/([A-Z])/g, ' $1')}</span>
                          </label>
                        ))}
                      </div>
                      
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total:</span>
                        <span>${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Sales Tax:</span>
                    <span>${getTotalSalesTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Further Tax:</span>
                    <span>${getTotalFurtherTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>CVT:</span>
                    <span>${getTotalCVT().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>WH Tax 1:</span>
                    <span>${getTotalWHTax1().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>WH Tax 2:</span>
                    <span>${getTotalWHTax2().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-${getTotalDiscount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4">
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || !selectedCustomer || !selectedBranch || !selectedDevice}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Selection Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title="Select Customer"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{customer.name}</div>
                  {customer.phone && <div className="text-sm text-gray-500">{customer.phone}</div>}
                  {customer.ntn && <div className="text-sm text-gray-500">NTN: {customer.ntn}</div>}
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* Sale Settings Modal */}
        <Modal
          isOpen={showSaleSettingsModal}
          onClose={() => setShowSaleSettingsModal(false)}
          title="Sale Settings"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="SALE">Sale</option>
                <option value="PURCHASE">Purchase</option>
                <option value="DEBIT_NOTE">Debit Note</option>
                <option value="CREDIT_NOTE">Credit Note</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type Code</label>
              <input
                type="text"
                value={selectedBranch?.sale_type_code || ''}
                onChange={(e) => {
                  if (selectedBranch) {
                    setBranches(branches.map(b => b.id === selectedBranch.id ? { ...b, sale_type_code: e.target.value } : b));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buyer NTN (Optional)</label>
              <input
                type="text"
                value={buyerNTN}
                onChange={(e) => setBuyerNTN(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Name (Optional)</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Discount</label>
              <input
                type="number"
                value={totalDiscount}
                onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </Modal>

        {/* Checkout Modal */}
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          title="Complete Sale"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
              <p className="text-gray-600">{selectedCustomer?.name}</p>
              {selectedCustomer?.ntn && <p className="text-sm text-gray-500">NTN: {selectedCustomer.ntn}</p>}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Branch & Device</h3>
              <p className="text-gray-600">{selectedBranch?.name} - {selectedDevice?.name}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Sale Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Invoice Type:</span>
                  <span>{invoiceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sale Type Code:</span>
                  <span>{selectedBranch?.sale_type_code}</span>
                </div>
                {buyerNTN && (
                  <div className="flex justify-between">
                    <span>Buyer NTN:</span>
                    <span>{buyerNTN}</span>
                  </div>
                )}
                {buyerName && (
                  <div className="flex justify-between">
                    <span>Buyer Name:</span>
                    <span>{buyerName}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Items</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Sales Tax:</span>
                <span>${getTotalSalesTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Further Tax:</span>
                <span>${getTotalFurtherTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>CVT:</span>
                <span>${getTotalCVT().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>WH Tax 1:</span>
                <span>${getTotalWHTax1().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>WH Tax 2:</span>
                <span>${getTotalWHTax2().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>-${getTotalDiscount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Payment Methods</h3>
              <div className="space-y-2">
                {paymentMethods.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="capitalize">{payment.method}</span>
                    <div className="flex items-center space-x-2">
                      <span>${payment.amount.toFixed(2)}</span>
                      <button
                        onClick={() => removePaymentMethod(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <select
                    value={currentPaymentMethod}
                    onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_payment">Mobile Payment</option>
                  </select>
                  <input
                    type="number"
                    value={currentPaymentAmount}
                    onChange={(e) => setCurrentPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                  <button
                    onClick={addPaymentMethod}
                    className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <label className="font-medium">Amount Paid:</label>
              <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="border rounded px-2 py-1 w-32" min={0} />
              <span className="ml-4 font-medium">Change to Return: <span className="text-green-600">${(amountPaid - getTotal()).toFixed(2)}</span></span>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={processSale}
                disabled={processingSale}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300"
              >
                {processingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Sale'
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Sale Receipt"
        >
          {lastSale && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">FBR Integrated POS System</h3>
                <p className="text-sm text-gray-600">Sale Receipt</p>
              </div>
              {/* Branch Details */}
              <div className="border-b pb-2 mb-2">
                <div className="font-semibold text-gray-900">{lastSale.branch?.name}</div>
                {lastSale.branch?.address && <div className="text-xs text-gray-600">{lastSale.branch.address}</div>}
                <div className="text-xs text-gray-600">
                  {lastSale.branch?.city && <span>{lastSale.branch.city}, </span>}
                  {lastSale.branch?.province && <span>{lastSale.branch.province}</span>}
                </div>
                <div className="text-xs text-gray-600">NTN: {lastSale.branch?.ntn} | STRN: {lastSale.branch?.strn}</div>
                <div className="text-xs text-gray-600">FBR Branch Code: {lastSale.branch?.fbr_branch_code}</div>
              </div>
              
              <div className="border-t border-b py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Invoice No:</span>
                  <span>{lastSale.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">USIN:</span>
                  <span>{lastSale.usin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(lastSale.invoice_date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Customer:</span>
                  <span>{lastSale.customer?.name || 'Walk-in Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Branch:</span>
                  <span>{lastSale.branch?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Device:</span>
                  <span>{lastSale.device?.name}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                <div className="space-y-1">
                  {lastSale.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product?.name} x {item.quantity}</span>
                      <span>${Number(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${Number(lastSale.total_sales_value).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Tax:</span>
                  <span>${Number(lastSale.total_tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-${Number(lastSale.total_discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${Number(lastSale.total_amount).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">FBR Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    lastSale.fbr_status === 'SUCCESS' 
                      ? 'bg-green-100 text-green-800' 
                      : lastSale.fbr_status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {lastSale.fbr_status}
                  </span>
                </div>
                {lastSale.fbr_invoice_no && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium">FBR Invoice:</span>
                    <span>{lastSale.fbr_invoice_no}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Print receipt functionality
                    window.print();
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default POS; 