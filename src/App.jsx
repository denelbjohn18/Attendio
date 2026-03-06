import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DailyLog from './pages/DailyLog';
import Registration from './pages/Registration';
import Records from './pages/Records';
import Configuration from './pages/Configuration';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DailyLog />} />
          <Route path="register" element={<Registration />} />
          <Route path="records" element={<Records />} />
          <Route path="config" element={<Configuration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
