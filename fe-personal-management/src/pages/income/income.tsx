import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PMService, { Income } from "../../services/pm.service";
import "./income.scss";

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

const IncomePage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [income, setIncome] = useState<Income[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
    loadIncome();
  }, [selectedMonth, selectedYear]);

  const loadUsers = async () => {
    try {
      const usersData = await PMService.getUsers();
      setUsers(usersData.map(user => user.name));
    } catch (error) {
      message.error("Error cargando usuarios");
    }
  };

  const loadIncome = async () => {
    try {
      let data = await PMService.getIncomes(selectedMonth, selectedYear);
      data = data.sort((a, b) => a.owner.localeCompare(b.owner));
      setIncome(data);
    } catch (error) {
      message.error("Error cargando ingresos");
    }
  };

  const handleSaveIncome = async (values: Omit<Income, "id">) => {
    try {
      if (editingIncome) {
        await PMService.updateIncome(editingIncome.id, values, selectedMonth, selectedYear);
        message.success("Ingreso actualizado");
      } else {
        await PMService.addIncome(values, selectedMonth, selectedYear);
        message.success("Ingreso agregado");
      }
      setIsModalOpen(false);
      loadIncome();
    } catch (error) {
      message.error("Error guardando ingreso");
    }
  };

  const handleDeleteIncome = async (id: string) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar este ingreso?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await PMService.deleteIncome(id);
          loadIncome();
          message.success("Ingreso eliminado");
        } catch (error) {
          message.error("Error eliminando ingreso");
        }
      },
    });
  };

  return (
    <div className="income">
      <div className="intro">
        <h1>Gestión de Ingresos</h1>
        <p>Administra los ingresos mensuales de cada usuario.</p>
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
          title: "Acciones",
          key: "actions",
          width:"100px",
          render: (_: any, record: Income) => (
            <>
              <Button icon={<EditOutlined />} onClick={() => { 
                setEditingIncome(record); 
                setIsModalOpen(true); 
                form.setFieldsValue(record); 
              }} />
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteIncome(record.id)} />
            </>
          ),
        },
      ]} dataSource={income} pagination={false} rowKey="id" />

      <Button type="primary" icon={<PlusOutlined />} onClick={() => { 
        setIsModalOpen(true); 
        setEditingIncome(null); 
        form.resetFields(); 
      }}>
        Agregar Ingreso
      </Button>

      {/* 🔹 Modal de Agregar/Editar Ingreso */}
      <Modal
        title={editingIncome ? "Editar Ingreso" : "Agregar Ingreso"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>Guardar</Button>,
        ]}
      >
        <Form form={form} onFinish={handleSaveIncome} layout="vertical">
          <Form.Item name="description" label="Descripción" rules={[{ required: true, message: "Ingresa una descripción" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="Monto (€)" rules={[{ required: true, message: "Ingresa un monto" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="owner" label="Usuario" rules={[{ required: true, message: "Selecciona un usuario" }]}>
            <Select options={users.map(user => ({ value: user, label: user }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IncomePage;
