import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './paginas/Login';
import { RecuperarPassword } from './paginas/RecuperarPassword';
import { RestablecerPassword } from './paginas/RestablecerPassword';
import { SolicitudesUsuario } from './paginas/SolicitudesUsuario';
import { PerfilUsuario } from './paginas/PerfilUsuario';
import { SolicitudesAdmin } from './paginas/SolicitudesAdmin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/admin/solicitudes" element={<SolicitudesAdmin />} />
        <Route path="/solicitudes" element={<SolicitudesUsuario />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;