import React, { useEffect, useState } from 'react';
import { apiService, Branch, Device } from '../services/api';

const Settings: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [saleTypeCode, setSaleTypeCode] = useState('');
  const [form, setForm] = useState({
    ntn: '',
    strn: '',
    saleTypeCode: '',
    fbrBranchCode: '',
    fbrPosReg: ''
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const branchesData = await apiService.getBranches();
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setSelectedBranch(branchesData[0]);
      }
      const devicesData = await apiService.getDevices();
      setDevices(devicesData);
      if (devicesData.length > 0) {
        setSelectedDevice(devicesData[0]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedDevice) {
      setForm({
        ntn: selectedBranch.ntn || '',
        strn: selectedBranch.strn || '',
        saleTypeCode: selectedBranch.sale_type_code || '',
        fbrBranchCode: selectedBranch.fbr_branch_code || '',
        fbrPosReg: selectedDevice.fbr_pos_reg || ''
      });
      setSaleTypeCode(selectedBranch.sale_type_code || '');
    }
  }, [selectedBranch, selectedDevice]);

  const handleSave = async () => {
    if (!selectedBranch || !selectedDevice) return;
    try {
      const branchPayload = {
        name: selectedBranch.name,
        address: selectedBranch.address,
        city: selectedBranch.city,
        province: selectedBranch.province,
        ntn: form.ntn,
        strn: form.strn,
        fbr_branch_code: form.fbrBranchCode,
        sale_type_code: form.saleTypeCode,
      };
      await apiService.updateBranch(selectedBranch.id, branchPayload);

      const devicePayload = {
        ...selectedDevice,
        fbr_pos_reg: form.fbrPosReg,
      };
      const devicePayloadAny = devicePayload as any;
      delete devicePayloadAny.id;
      delete devicePayloadAny.created_at;
      delete devicePayloadAny.branch;
      await apiService.updateDevice(selectedDevice.id, devicePayload);

      setSaleTypeCode(form.saleTypeCode);
      setStatus('Settings saved successfully!');
    } catch (err) {
      setStatus('Failed to save settings.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <select
            value={selectedBranch?.id || ''}
            onChange={e => setSelectedBranch(branches.find(b => b.id === parseInt(e.target.value)) || null)}
            className="w-full border rounded px-2 py-1"
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
          <select
            value={selectedDevice?.id || ''}
            onChange={e => setSelectedDevice(devices.find(d => d.id === parseInt(e.target.value)) || null)}
            className="w-full border rounded px-2 py-1"
          >
            {devices.map(device => (
              <option key={device.id} value={device.id}>{device.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seller NTN</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={form.ntn} onChange={e => setForm(f => ({...f, ntn: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seller STRN</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={form.strn} onChange={e => setForm(f => ({...f, strn: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Type Code</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={form.saleTypeCode} onChange={e => setForm(f => ({...f, saleTypeCode: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FBR Branch Code</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={form.fbrBranchCode} onChange={e => setForm(f => ({...f, fbrBranchCode: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FBR POS Reg</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={form.fbrPosReg} onChange={e => setForm(f => ({...f, fbrPosReg: e.target.value}))} />
        </div>
        <div className="flex justify-end pt-4">
          <button className="px-6 py-2 rounded bg-primary-600 text-white hover:bg-primary-700" onClick={handleSave}>Save</button>
        </div>
        {status && <div className="mt-2 text-center text-sm text-green-600">{status}</div>}
      </div>
    </div>
  );
};

export default Settings; 