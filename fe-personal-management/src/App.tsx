import React from 'react';
import { Layout } from 'antd';
import './App.scss';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/footer/footer';
import Header from './components/header/header';

import './layout.scss'
import HomePage from './pages/home/home';
import IncomePage from './pages/income/income';
import ExpensesPage from './pages/expenses/expenses';
import SavingPage from './pages/savings/savings';
import DistributionPage from './pages/distribution/distribution';
import UsersPage from './pages/users/users';
const { Content } = Layout;


const items = new Array(5).fill(null).map((_, index) => ({
  key: String(index + 1),
  label: `nav ${index + 1}`,
}));

const AppPage: React.FC = () => {

  return (
    <Router>
      <Header />
      <Content className='content'>
        <div className='content__routes'>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="ingresos" element={<IncomePage />} />
            <Route path="gastos" element={<ExpensesPage />} />
            <Route path="ahorros" element={<SavingPage />} />
            <Route path="distribucion" element={<DistributionPage />} />
            <Route path="users" element={<UsersPage />} />
          </Routes>
        </div>
      </Content>
      <Footer />
    </Router>
  );
};

export default AppPage;