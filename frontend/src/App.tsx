import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { DashboardPage, NeuralNetworkPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="neural" element={<NeuralNetworkPage />} />
          <Route path="nodes" element={<DashboardPage />} />
          <Route path="metrics" element={<DashboardPage />} />
          <Route path="storage" element={<DashboardPage />} />
          <Route path="terminal" element={<DashboardPage />} />
          <Route path="settings" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
