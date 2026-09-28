import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './paginas/Login';
import { RecuperarPassword } from './paginas/RecuperarPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        
        {/* Cualquier otra ruta redirige a /login por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;