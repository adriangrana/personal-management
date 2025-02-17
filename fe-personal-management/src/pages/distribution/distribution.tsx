import React, { useState, useEffect } from "react";
import { Table, Select, message } from "antd";
import PMService, { Distribution, User } from "../../services/pm.service";
import "./distribution.scss";

const SalaryDistributionPage: React.FC = () => {
    // 🔹 Estado para la selección de mes y año
    const currentDate = new Date();
    const nextMonthIndex = currentDate.getMonth() + 1;
    const nextYear = nextMonthIndex === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const nextMonth = months[nextMonthIndex % 12]; // Usamos módulo para manejar diciembre -> enero

    // Capitalizar la primera letra
    const currentMonth = nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1);
    const currentYear = nextYear.toString();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
    const [selectedYear, setSelectedYear] = useState<string>(currentYear);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [accounts, setAccounts] = useState<{ name: string; color: string, className: string }[]>([]);

    // 🔹 Cargar datos
    useEffect(() => {
        loadDistribution();
        loadUsers();
        loadAccounts();
    }, [selectedMonth, selectedYear]);

    const loadDistribution = async () => {
        try {
            let data = await PMService.getSalaryDistribution(selectedMonth, selectedYear);
            data = data.sort((a, b) => {
                // Función que asigna prioridad especial a "Total", "Devoluciones" y "Excedentes"
                // 0 => cuentas normales (alfabéticas)
                // 1 => "Total"
                // 2 => "Devoluciones"
                // 3 => "Excedentes"
                function getPriority(account) {
                    if (account === "Total") return 1;
                    if (account === "Devoluciones") return 2;
                    if (account === "Excedentes") return 3;
                    return 0;
                }

                const rankA = getPriority(a.account);
                const rankB = getPriority(b.account);

                // 1) Si ambos son cuentas normales, orden alfabético
                if (rankA === 0 && rankB === 0) {
                    return a.account.localeCompare(b.account);
                }

                // 2) Si uno es normal y el otro es especial, primero va el normal
                if (rankA === 0 && rankB !== 0) return -1;
                if (rankA !== 0 && rankB === 0) return 1;

                // 3) Ambos son especiales => comparar por prioridad
                return rankA - rankB;
            });
            setDistributions(data);
        } catch (error) {
            message.error("Error cargando la distribución salarial");
        }
    };

    const loadUsers = async () => {
        try {
            const usersData = await PMService.getUsers();
            setUsers(usersData);
        } catch (error) {
            message.error("Error cargando usuarios");
        }
    };

    const loadAccounts = async () => {
        setAccounts([
            { name: "BBVA Familiar", color: "#9bb1ff", className: "bbva-familiar" },
            { name: "BBVA Mari", color: "#99ccff", className: "bbva-mari" },
            { name: "BBVA Adrián", color: "#99ccff", className: "bbva-adrian" },
            { name: "Santander Mari", color: "#ff9999", className: "santander-mari" },
            { name: "Santander Adrián", color: "#ff4d4d", className: "santander-adrian" },
            { name: "Santander Familiar", color: "#cc6666", className: "santander-familiar" },
            { name: "Pichincha Ahorro Mari", color: "#ffcc66", className: "pichincha-ahorro-mari" },
            { name: "Pichincha Ahorro Adrián", color: "#ff9933", className: "pichincha-ahorro-adrian" },
            { name: "Olguita", color: "#008080", className: "olguita" },
            { name: "Pichincha Familiar", color: "#ffb3b3", className: "pichincha-familiar" },
            { name: "Total", color: "#EA9999", className: "total" },
            { name: "Excedentes", color: "#ffb3b3", className: "excedente" },
        ]);
    };

    // 🔹 Calcular totales dinámicos
    const totalUsers: Record<string, number> = users.reduce((acc, user) => {
        acc[user.name] = distributions.reduce((sum, dist) => sum + (dist[user.name] || 0), 0);
        return acc;
    }, {} as Record<string, number>);

    // 🔹 Calcular excedentes (simulación)
    const excedenteUsers = users.reduce((acc, user) => {
        acc[user.name] = 50;
        return acc;
    }, {} as Record<string, number>);

    // 🔹 Columnas de la tabla (Generadas dinámicamente)
    const columns = [
        {
            title: "DEPÓSITOS",
            dataIndex: "account",
            key: "account",
            render: (account: string) => <strong>{account}</strong>,
        },
        ...users.map((user) => ({
            title: `${user.name}`,
            dataIndex: user.name,
            key: user.name,
            render: (value: number) => `${(value || 0).toLocaleString()}`,
        })),
        {
            title: "Total (€)",
            key: "total",
            render: (_: any, record: Distribution) =>
                `€${users.reduce((sum, user) => sum + (Number(record[user.name].replace("€", '')) || 0), 0).toLocaleString()}`,
        },
    ];

    return (
        <div className="salary-distribution">
            <div className="intro">
                <h1>Distribución del Salario</h1>
                <p>Administra la distribución del salario entre los diferentes usuarios y cuentas.</p>
            </div>

            <div className="month-year-selector">
                <label>Selecciona un mes:</label>
                <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }} options={months.map((month) => ({ value: month, label: month }))} />
                <label>Selecciona un año:</label>
                <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }} options={years.map((year) => ({ value: year, label: year }))} />
            </div>

            <Table
                columns={columns}
                dataSource={[
                    ...distributions.map((dist) => ({
                        ...dist["values"],
                        account: dist["account"],
                        // Esto esparce los valores correctamente
                        rowColor: accounts.find((acc) => acc.name === dist.account)?.className || "",
                    })),
                    /*  { key: "total", account: "Total", ...totalUsers },
                     { key: "excedente", account: "Excedentes", ...excedenteUsers, rowColor: "excedente" }, */
                ]}
                rowClassName={(record: any) => `row-${record.rowColor}`}
                pagination={false}
                rowKey="id"
            />
        </div>
    );
};

export default SalaryDistributionPage;
