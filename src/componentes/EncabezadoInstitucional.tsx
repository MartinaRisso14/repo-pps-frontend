import type { ReactNode } from 'react';
import logoConcordia from '../assets/logo2.png';

interface EncabezadoInstitucionalProps {
  acciones?: ReactNode;
  className?: string;
}

export const EncabezadoInstitucional = ({
  acciones,
  className = '',
}: EncabezadoInstitucionalProps) => (
  <header className={`institutional-header ${className}`.trim()}>
    <div className="institutional-header-brand">
      <img
        className="institutional-header-logo"
        src={logoConcordia}
        alt="Municipalidad de Concordia"
      />
      <div className="institutional-header-title">
        SISTEMA DE LEGAJO ÚNICO
      </div>
    </div>
    {acciones && <nav className="institutional-header-actions">{acciones}</nav>}
  </header>
);
