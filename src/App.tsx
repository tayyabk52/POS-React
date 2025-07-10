import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Branches from './pages/Branches';
import Devices from './pages/Devices';
import TaxRates from './pages/TaxRates';
import Users from './pages/Users';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/tax-rates" element={<TaxRates />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 