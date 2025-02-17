import React, { useState, useEffect } from "react";
import { Pie, Line } from "react-chartjs-2";
import { Button, Select, message } from "antd";
import PMService, { FinancialSummary, HistoricalData } from "../../services/pm.service";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from "chart.js";
import "./home.scss";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const currentDate = new Date();
const nextMonthIndex = currentDate.getMonth() + 1;
const nextYear = nextMonthIndex === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const nextMonth = months[nextMonthIndex % 12]; // Usamos módulo para manejar diciembre -> enero

// Capitalizar la primera letra
const currentMonth = nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1);
const currentYear = nextYear.toString();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

const Home: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [finances, setFinances] = useState<FinancialSummary>({ income: 0, expenses: 0, savings: 0, surplus: 0 });
  const [surplusHistory, setSurplusHistory] = useState<HistoricalData[]>([]);
  const [expensesHistory, setExpensesHistory] = useState<HistoricalData[]>([]);
  const [incomeHistory, setIncomeHistory] = useState<HistoricalData[]>([]);
 // 🔹 Función para importar datos del último mes
 const handleImportLastMonth = async () => {
  try {
    const success = await PMService.importLastMonth(selectedMonth, selectedYear);
    if (success) {
        message.success("Datos importados correctamente");
  
        // 🔹 Recargar todos los datos del mes y año seleccionados
        fetchFinancialData();
        fetchHistoricalData();
    } else {
        message.error("Error al importar los datos");
    }
  } catch (error) {
    message.error(error.message);
  }
 
};
  useEffect(() => {
    fetchFinancialData();
    fetchHistoricalData();
  }, [selectedMonth, selectedYear]);

  
  const fetchFinancialData = async () => {
    try {
      const data = await PMService.getFinancialSummary(selectedMonth, selectedYear);
      setFinances(data);
    } catch (error) {
      message.error("Error cargando datos financieros");
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const surplus = await PMService.getSurplusHistory();
      const expenses = await PMService.getExpensesHistory();
      const income = await PMService.getIncomeHistory();
      setSurplusHistory(surplus);
      setExpensesHistory(expenses);
      setIncomeHistory(income);
    } catch (error) {
      message.error("Error obteniendo datos históricos");
    }
  };

  const formatChartData = (data: HistoricalData[], label: string, color: string) => ({
    labels: data.map((item) => `${item.month} ${item.year}`),
    datasets: [{ data: data.map((item) => item.value), label, fill: false,backgroundColor:color, borderColor:color, tension: 0.3, pointRadius: 5, pointHoverRadius: 7 }],
  });

  return (
    <div className="home">
      <div className="intro">
        <h1>Bienvenido a tu Gestor Financiero</h1>
        <p>Controla de manera sencilla tus ingresos, gastos y ahorros. Visualiza el estado de tus finanzas con gráficos interactivos y toma mejores decisiones.</p>
      </div>

      <div className="month-year-selector">
        <label>Selecciona un mes:</label>
        <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }} options={months.map((month) => ({ value: month, label: month }))} />
        <label>Selecciona un año:</label>
        <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }} options={years.map((year) => ({ value: year, label: year }))} />
        <Button type="primary" onClick={handleImportLastMonth}>Import Last Month</Button>

      </div>

      <div className="charts">
        <div className="row">
          <div className="chart large">
            <h3>Distribución Financiera ({selectedMonth} {selectedYear})</h3>
            <Pie data={{
              labels: ["Ingresos", "Gastos", "Ahorros", "Excedente"],
              datasets: [{ data: [finances.income, finances.expenses, finances.savings, finances.surplus], backgroundColor: ["#4CAF50", "#E74C3C", "#F39C12", "#3498DB"] }],
            }} />
          </div>
          <div className="chart">
            <h3>Evolución del Excedente</h3>
            <Line data={formatChartData(surplusHistory,"Excedentes","#3498DB")} />
          </div>
        </div>

        <div className="row">
          <div className="chart">
            <h3>Evolución de Gastos</h3>
            <Line data={formatChartData(expensesHistory,"Gastos","#E74C3C")} />
          </div>
          <div className="chart">
            <h3>Evolución de Ingresos</h3>
            <Line data={formatChartData(incomeHistory,"Ingresos","#4CAF50")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
