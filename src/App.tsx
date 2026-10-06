import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './paginas/Login';
import { SolicitudesUsuario } from './paginas/SolicitudesUsuario';
import { PerfilUsuario } from './paginas/PerfilUsuario';
import { SolicitudesAdmin } from './paginas/SolicitudesAdmin';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  ));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/solicitudes" element={<SolicitudesAdmin />} />
          <Route path="/solicitudes" element={<SolicitudesUsuario />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <button
          type="button"
          className="theme-toggle"
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-pressed={theme === 'light'}
          onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        </button>
      </>
    </BrowserRouter>
  );
}

export default App;