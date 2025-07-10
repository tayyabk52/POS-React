import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Loader2, Eye, ChevronDown, ChevronRight, Receipt, QrCode, FileText, User, Building, Smartphone } from 'lucide-react';
import { apiService, Sale } from '../services/api';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSales();
        setSales(data);
        setError(null);
      } catch (err) {
        setError('Failed to load sales');
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const toggleSaleDetails = (saleId: number) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading sales...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">View sales history and reports</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-600">View sales history and reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${sales
                  .filter(sale => new Date(sale.invoice_date).toDateString() === new Date().toDateString())
                  .reduce((sum, sale) => sum + Number(sale.total_amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sales.filter(sale => new Date(sale.invoice_date).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{sales.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sales History</h3>
        </div>
        <div className="overflow-x-auto">
          {sales.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No sales found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <div key={sale.id} className="p-6">
                  {/* Sale Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleSaleDetails(sale.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {expandedSale === sale.id ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{sale.invoice_no}</h4>
                        <p className="text-sm text-gray-500">{formatDate(sale.invoice_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${Number(sale.total_amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sale.total_qty} items
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(sale.fbr_status)}`}>
                        {sale.fbr_status}
                      </span>
                    </div>
                  </div>

                  {/* Sale Details (Expandable) */}
                  {expandedSale === sale.id && (
                    <div className="mt-4 space-y-6 border-t pt-4">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Sale Information</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Invoice No:</span>
                              <span className="font-medium">{sale.invoice_no}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">USIN:</span>
                              <span className="font-medium">{sale.usin}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Invoice Type:</span>
                              <span className="font-medium">{sale.invoice_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sale Type Code:</span>
                              <span className="font-medium">{sale.sale_type_code}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium">{formatDate(sale.invoice_date)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Customer & Branch</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Customer:</span>
                              <span className="font-medium">{sale.customer?.name || 'Walk-in Customer'}</span>
                            </div>
                            {sale.customer?.ntn && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Customer NTN:</span>
                                <span className="font-medium">{sale.customer.ntn}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Branch:</span>
                              <span className="font-medium">{sale.branch?.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Smartphone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Device:</span>
                              <span className="font-medium">{sale.device?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tax & Financial Details */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Financial Details</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-600">Subtotal</p>
                            <p className="font-medium">${Number(sale.total_sales_value).toFixed(2)}</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-blue-600">Total Tax</p>
                            <p className="font-medium text-blue-700">${Number(sale.total_tax).toFixed(2)}</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-red-600">Discount</p>
                            <p className="font-medium text-red-700">-${Number(sale.total_discount).toFixed(2)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-green-600">Total Amount</p>
                            <p className="font-medium text-green-700">${Number(sale.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      {sale.items && sale.items.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Items</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales Tax</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Further Tax</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CVT</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">WH Tax 1</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">WH Tax 2</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sale.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">
                                      <div>
                                        <p className="font-medium">{item.product?.name}</p>
                                        <p className="text-xs text-gray-500">Code: {item.product?.code}</p>
                                        {item.hs_code && (
                                          <p className="text-xs text-gray-500">HS: {item.hs_code}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm">${Number(item.unit_price).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm">${Number(item.value_excl_tax).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-blue-600">${Number(item.sales_tax).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-blue-600">${Number(item.further_tax).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-blue-600">${Number(item.c_v_t).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-blue-600">${Number(item.w_h_tax_1).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-blue-600">${Number(item.w_h_tax_2).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-red-600">-${Number(item.discount).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm font-medium">${Number(item.line_total).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Payments */}
                      {sale.payments && sale.payments.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Payments</h5>
                          <div className="space-y-2">
                            {sale.payments.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  <span className="capitalize font-medium">{payment.method}</span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FBR Information */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">FBR Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">FBR Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(sale.fbr_status)}`}>
                                {sale.fbr_status}
                              </span>
                            </div>
                            {sale.fbr_invoice_no && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">FBR Invoice No:</span>
                                <span className="font-medium">{sale.fbr_invoice_no}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sync Attempts:</span>
                              <span className="font-medium">{sale.sync_attempts}</span>
                            </div>
                            {sale.last_synced_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Last Synced:</span>
                                <span className="font-medium">{formatDate(sale.last_synced_at)}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seller NTN:</span>
                              <span className="font-medium">{sale.seller_ntn}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seller STRN:</span>
                              <span className="font-medium">{sale.seller_strn}</span>
                            </div>
                            {sale.buyer_ntn && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Buyer NTN:</span>
                                <span className="font-medium">{sale.buyer_ntn}</span>
                              </div>
                            )}
                            {sale.buyer_name && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Buyer Name:</span>
                                <span className="font-medium">{sale.buyer_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales; 