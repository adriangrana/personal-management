import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, Checkbox, Tag, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PMService, { Expense, User } from "../../services/pm.service";
import "./expenses.scss";

// 🔹 Obtener el mes y año actual
const currentDate = new Date();
// Obtener el mes actual (0-11) y calcular el siguiente mes
const nextMonthIndex = currentDate.getMonth() + 1;
const nextYear = nextMonthIndex === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const nextMonth = months[nextMonthIndex % 12]; // Usamos módulo para manejar diciembre -> enero

// Capitalizar la primera letra
const currentMonth = nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1);
const currentYear = nextYear.toString();

// 🔹 Lista de meses y años disponibles

const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

const ExpensesPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<{ name: string; color: string }[]>([]);
  const [sharedPercentages, setSharedPercentages] = useState<Record<string, number>>({});

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isQuota, setIsQuota] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadExpenses();
    loadUsers();
    loadAccounts();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = async () => {
    try {
      let data = await PMService.getExpenses(selectedMonth, selectedYear);
      data = data.sort((a, b) => a.account.localeCompare(b.account));
      setExpenses(data);
    } catch (error) {
      message.error("Error cargando gastos");
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
      { name: "BBVA Familiar", color: "#9bb1ff" },
      { name: "BBVA Mari", color: "#D9EAD3" },
      { name: "BBVA Adrián", color: "#99ccff" },
      { name: "Santander Mari", color: "#ff9999" },
      { name: "Santander Adrián", color: "#ff4d4d" },
      { name: "Santander Familiar", color: "#cc6666" },
      { name: "Pichincha Ahorro Mari", color: "#ffcc66" },
      { name: "Pichincha Ahorro Adrián", color: "#ff9933" },
      { name: "Olguita", color: "#008080" },
      { name: "Pichincha Familiar", color: "#ffb3b3" },
    ]);
  };
  const handleDeleteExpense = async (id: string) => {
    await PMService.deleteExpense(id);
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };
  const handleSaveExpense = async (values: Omit<Expense, "id">) => {
    const formattedValues = {
      ...values,
      is_quota: isQuota,
      is_shared: isShared,
      shared_users: isShared
        ? Object.entries(sharedPercentages).map(([user, percentage]) => ({
            user_id: user,
            share_percentage: percentage
          }))
        : undefined,
    };

    try {
      if (editingExpense) {
        await PMService.updateExpense(editingExpense.id, formattedValues, selectedMonth, selectedYear);
        message.success("Gasto actualizado");
      } else {
        await PMService.addExpense(formattedValues, selectedMonth, selectedYear);
        message.success("Gasto agregado");
      }
      setIsModalOpen(false);
      loadExpenses();
    } catch (error) {
      message.error("Error guardando gasto");
    }
  };

  // 🔹 Columnas de la tabla
  const columns = [
    { title: "Descripción", dataIndex: "description", key: "description" },
    { title: "(€)", dataIndex: "amount", key: "amount", render: (amount: number) => `€${amount.toLocaleString()}` },
    {
      title: "Cuenta",
      dataIndex: "account",
      key: "account",
      render: (account: string) => {
        const accountColor = accounts.find(acc => acc.name === account)?.color || "#000";
        return <Tag color={accountColor}>{account}</Tag>;
      }
    },
    {
      title: "Cuota",
      dataIndex: "is_quota",
      key: "is_quota",
      render: (isQuota: boolean, record: Expense) =>
        isQuota ? `${record.current_quota} de ${record.total_quotas}` : "No",
    },

    // 🔹 Agregar dinámicamente columnas con los montos de cada usuario
    ...users.map(user => ({
      title: `${user.name}`,
      key: `amount_${user.name}`,
      render: (_: any, record: Expense) => {
        if (!record.is_shared || !record.shared_users)  {
          if (record.payer === user.name) {
            return  `€${((record.amount)).toFixed(2)}` 
          } else return "-"
        } else {
          const userShare = record.shared_users.find(u => u.user_id === user.id);
          return userShare ? `€${((record.amount * userShare.share_percentage) / 100).toFixed(2)}` : "-";
        }
      }
    })),
    ,
    {
      title: "Acciones",
      key: "actions",
      width:"100px",
      render: (_: any, record: Expense) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => { setEditingExpense(record); setIsModalOpen(true); form.setFieldsValue(record); }} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteExpense(record.id)} />
        </>
      ),
    },
  ];

  return (
    <div className="expenses">
      <div className="intro">
        <h1>Gestión de Gastos</h1>
        <p>Administra los gastos mensuales, su distribución y cuentas de pago.</p>
      </div>

      <div className="month-year-selector">
        <label>Selecciona un mes:</label>
        <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }} options={months.map((month) => ({ value: month, label: month }))} />
        <label>Selecciona un año:</label>
        <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }} options={years.map((year) => ({ value: year, label: year }))} />
      </div>

      <Table columns={columns} dataSource={expenses} pagination={false} rowKey="id" />

      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setIsModalOpen(true);
        setEditingExpense(null);
        setIsQuota(false);
        setIsShared(false);
        setSharedPercentages({});
        form.resetFields();
      }}>
        Agregar Gasto
      </Button>
      {/* 🔹 Modal para agregar/editar gasto */}
      <Modal
        title={editingExpense ? "Editar Gasto" : "Agregar Gasto"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingExpense ? "Actualizar" : "Guardar"}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveExpense}>
          <Form.Item name="description" label="Descripción" rules={[{ required: true, message: "Ingrese la descripción" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="Monto (€)" rules={[{ required: true, message: "Ingrese el monto" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="account" label="Cuenta de Pago" rules={[{ required: true, message: "Seleccione la cuenta de pago" }]}>
            <Select options={accounts.map(acc => ({ value: acc.name, label: acc.name }))} />
          </Form.Item>
          <Form.Item name="is_quota" valuePropName="checked">
            <Checkbox onChange={(e) => setIsQuota(e.target.checked)}>¿Es una cuota?</Checkbox>
          </Form.Item>
          {isQuota && (
            <>
              <Form.Item name="current_quota" label="Cuota actual">
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item name="total_quotas" label="Total de cuotas">
                <InputNumber min={1} />
              </Form.Item>
            </>
          )}
           <Form.Item name="is_shared" valuePropName="checked">
            <Checkbox onChange={(e) => setIsShared(e.target.checked)}>¿Gasto Compartido?</Checkbox>
          </Form.Item>

          {!isShared && (
            <Form.Item name="payer" label="Pagador">
              <Select options={users.map(user => ({ value: user.name, label: user.name }))} />
            </Form.Item>
          )}

          {isShared && users.map(user => (
            <Form.Item key={user.id} label={`Porcentaje ${user.name}`}>
              <InputNumber min={0} max={100} defaultValue={0} onChange={(value) => setSharedPercentages(prev => ({ ...prev, [user.id]: value || 0 }))} />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
