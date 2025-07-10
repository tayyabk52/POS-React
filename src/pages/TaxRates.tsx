import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, Save, X } from 'lucide-react';
import { apiService, TaxRate } from '../services/api';
import Modal from '../components/Modal';

const TaxRates: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    code: ''
  });

  useEffect(() => {
    const fetchTaxRates = async () => {
      try {
        setLoading(true);
        const data = await apiService.getTaxRates();
        setTaxRates(data);
        setError(null);
      } catch (err) {
        setError('Failed to load tax rates');
        console.error('Error fetching tax rates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxRates();
  }, []);

  const handleAddTaxRate = () => {
    setEditingTaxRate(null);
    setFormData({
      name: '',
      rate: '',
      code: ''
    });
    setShowModal(true);
  };

  const handleEditTaxRate = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    setFormData({
      name: taxRate.name,
      rate: taxRate.rate.toString(),
      code: taxRate.code || ''
    });
    setShowModal(true);
  };

  const handleDeleteTaxRate = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this tax rate?')) {
      try {
        await apiService.deleteTaxRate(id);
        setTaxRates(taxRates.filter(t => t.id !== id));
      } catch (err) {
        console.error('Error deleting tax rate:', err);
        alert('Failed to delete tax rate');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taxRateData = {
        name: formData.name,
        rate: parseFloat(formData.rate),
        code: formData.code || undefined
      };

      if (editingTaxRate) {
        const updatedTaxRate = await apiService.updateTaxRate(editingTaxRate.id, taxRateData);
        setTaxRates(taxRates.map(t => t.id === editingTaxRate.id ? updatedTaxRate : t));
      } else {
        const newTaxRate = await apiService.createTaxRate(taxRateData);
        setTaxRates([...taxRates, newTaxRate]);
      }

      setShowModal(false);
      setEditingTaxRate(null);
    } catch (err) {
      console.error('Error saving tax rate:', err);
      alert('Failed to save tax rate');
    }
  };

  const filteredTaxRates = taxRates.filter(taxRate =>
    taxRate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taxRate.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading tax rates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Rates</h1>
            <p className="text-gray-600">Manage tax rates and FBR SRO schedules</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Tax Rate
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Rates</h1>
          <p className="text-gray-600">Manage tax rates and FBR SRO schedules</p>
        </div>
        <button 
          onClick={handleAddTaxRate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Tax Rate
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tax rates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SRO Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTaxRates.map((taxRate) => (
                <tr key={taxRate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{taxRate.name}</div>
                      <div className="text-sm text-gray-500">ID: {taxRate.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {taxRate.rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {taxRate.code || 'No SRO Code'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditTaxRate(taxRate)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTaxRate(taxRate.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Rate Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTaxRate ? 'Edit Tax Rate' : 'Add Tax Rate'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Rate, Zero Rate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="17.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FBR SRO Code
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="FBR SRO Schedule code"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingTaxRate ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxRates; 