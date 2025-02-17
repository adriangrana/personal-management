import React from 'react';
import './header.scss'
import { Link } from 'react-router-dom';

const Header = () => {
    return <div className="header">
        <h1 className="logo">Gestor Financiero</h1>
        <div className="links">
            <Link to="/">Inicio</Link>
            <Link to="/ingresos">Ingresos</Link>
            <Link to="/gastos">Gastos</Link>
            <Link to="/ahorros">Ahorros</Link>
            <Link to="/distribucion">Distribución</Link>
            <Link to="/users">Usuarios</Link>
        </div>
    </div>
}

export default Header;