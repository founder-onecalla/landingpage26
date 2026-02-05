import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConciergeIntake } from './pages/ConciergeIntake';
import { ConciergeDetails } from './pages/ConciergeDetails';
import { Verify } from './pages/Verify';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Primary routes */}
        <Route path="/" element={<ConciergeIntake />} />
        <Route path="/details" element={<ConciergeDetails />} />
        <Route path="/verify" element={<Verify />} />

        {/* Legacy routes for existing email links */}
        <Route path="/concierge-intake" element={<ConciergeIntake />} />
        <Route path="/concierge-intake/details" element={<ConciergeDetails />} />
        <Route path="/intake" element={<ConciergeDetails />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
