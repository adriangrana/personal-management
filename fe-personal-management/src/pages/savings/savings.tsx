import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PMService, { Savings } from "../../services/pm.service";
import "./savings.scss";

// 🔹 Obtener el mes y año actual
const currentDate = new Date();
const nextMonthIndex = currentDate.getMonth() + 1;
const nextYear = nextMonthIndex === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const nextMonth = months[nextMonthIndex % 12]; // Usamos módulo para manejar diciembre -> enero

// Capitalizar la primera letra
const currentMonth = nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1);
const currentYear = nextYear.toString();

const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

const SavingsPage: React.FC = () => {
  // 🔹 Estado para la selección de mes y año
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<{ name: string; color: string }[]>([]);
  // 🔹 Estado para el modal de agregar/editar ahorros
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);
  const [form] = Form.useForm();

  // 🔹 Cargar ahorros y usuarios
  useEffect(() => {
    loadUsers();
    loadSavings();
    loadAccounts();
  }, [selectedMonth, selectedYear]);
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
  const loadUsers = async () => {
    try {
      const usersData = await PMService.getUsers();
      setUsers(usersData.map(user => user.name));
    } catch (error) {
      message.error("Error cargando usuarios");
    }
  };

  const loadSavings = async () => {
    try {
      let data = await PMService.getSavings(selectedMonth, selectedYear);
      data = data.sort((a, b) => a.owner.localeCompare(b.owner));
      setSavings(data);
    } catch (error) {
      message.error("Error cargando ahorros");
    }
  };

  // 🔹 Guardar ahorro (Nuevo o Editado)
  const handleSaveSavings = async (values: Omit<Savings, "id">) => {
    try {
      if (editingSaving) {
        await PMService.updateSavings(editingSaving.id, { ...values, month: selectedMonth, year: selectedYear });
        message.success("Ahorro actualizado");
      } else {
        await PMService.addSavings({ ...values, month: selectedMonth, year: selectedYear });
        message.success("Ahorro agregado");
      }
      setIsModalOpen(false);
      loadSavings();
    } catch (error) {
      message.error("Error guardando ahorro");
    }
  };

  // 🔹 Eliminar ahorro
  const handleDeleteSavings = async (id: string) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar este ahorro?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await PMService.deleteSavings(id);
          loadSavings();
          message.success("Ahorro eliminado");
        } catch (error) {
          message.error("Error eliminando ahorro");
        }
      },
    });
  };

  return (
    <div className="savings">
      <div className="intro">
        <h1>Gestión de Ahorros</h1>
        <p>Administra los ahorros mensuales de cada usuario.</p>
      </div>

      <div className="month-year-selector">
        <label>Selecciona un mes:</label>
        <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }} options={months.map((month) => ({ value: month, label: month }))} />
        <label>Selecciona un año:</label>
        <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }} options={years.map((year) => ({ value: year, label: year }))} />
      </div>

      <Table columns={[
        { title: "Usuario", dataIndex: "owner", key: "owner" },
        { title: "Descripción", dataIndex: "description", key: "description" },
        { title: "Monto (€)", dataIndex: "amount", key: "amount", render: (amount: number) => `€${amount.toLocaleString()}` },
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
          title: "Acciones",
          key: "actions",
          width: "120px",
          render: (_: any, record: Savings) => (
            <>
              <Button icon={<EditOutlined />} onClick={() => {
                setEditingSaving(record);
                setIsModalOpen(true);
                form.setFieldsValue(record);
              }} />
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteSavings(record.id)} />
            </>
          ),
        },
      ]} dataSource={savings} pagination={false} rowKey="id" />

      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setIsModalOpen(true);
        setEditingSaving(null);
        form.resetFields();
      }}>
        Agregar Ahorro
      </Button>

      {/* 🔹 Modal de Agregar/Editar Ahorro */}
      <Modal
        title={editingSaving ? "Editar Ahorro" : "Agregar Ahorro"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>Guardar</Button>,
        ]}
      >
        <Form form={form} onFinish={handleSaveSavings} layout="vertical">
          <Form.Item name="description" label="Descripción" rules={[{ required: true, message: "Ingresa una descripción" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="Monto (€)" rules={[{ required: true, message: "Ingresa un monto" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="account" label="Cuenta de Pago" rules={[{ required: true, message: "Seleccione la cuenta de pago" }]}>
            <Select options={accounts.map(acc => ({ value: acc.name, label: acc.name }))} />
          </Form.Item>
          <Form.Item name="owner" label="Usuario" rules={[{ required: true, message: "Selecciona un usuario" }]}>
            <Select options={users.map(user => ({ value: user, label: user }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SavingsPage;
