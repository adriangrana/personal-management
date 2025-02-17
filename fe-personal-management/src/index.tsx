import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss'
import LayoutPage from './layout';
import "antd/dist/reset.css";

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LayoutPage />
    </React.StrictMode>
  );
}
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}

