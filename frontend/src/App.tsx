import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import Layout from './components/layout/Layout';

import Overview from './pages/Overview';
import SalesAnalysis from './pages/SalesAnalysis';
import ProductAnalysis from './pages/ProductAnalysis';
import CustomerAnalysis from './pages/CustomerAnalysis';
import RegionalAnalysis from './pages/RegionalAnalysis';
import DataExplorer from './pages/DataExplorer';
import DataQuality from './pages/DataQuality';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export const App: React.FC = () => {
  return (
    <FilterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="sales" element={<SalesAnalysis />} />
            <Route path="products" element={<ProductAnalysis />} />
            <Route path="customers" element={<CustomerAnalysis />} />
            <Route path="regions" element={<RegionalAnalysis />} />
            <Route path="explorer" element={<DataExplorer />} />
            <Route path="quality" element={<DataQuality />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FilterProvider>
  );
};

export default App;
