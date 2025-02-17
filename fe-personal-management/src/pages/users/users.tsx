import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PMService, { User } from "../../services/pm.service";
import "./users.scss";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 🔹 Cargar usuarios al inicio
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await PMService.getUsers();
      setUsers(data);
    } catch (error) {
      message.error("Error cargando usuarios");
    }
  };

  // 🔹 Mostrar modal para agregar usuario
  const showAddModal = () => {
    setEditingUser(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 🔹 Mostrar modal para editar usuario
  const showEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalVisible(true);
    form.setFieldsValue(user);
  };

  // 🔹 Guardar usuario (Nuevo o Editado)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await PMService.updateUser(editingUser.id, values);
        message.success("Usuario actualizado");
      } else {
        await PMService.addUser(values);
        message.success("Usuario agregado");
      }
      setIsModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error("Error guardando usuario");
    }
  };

  // 🔹 Eliminar usuario
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar este usuario?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await PMService.deleteUser(id);
          loadUsers();
          message.success("Usuario eliminado");
        } catch (error) {
          message.error("Error eliminando usuario");
        }
      },
    });
  };

  // 🔹 Columnas de la tabla
  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "Correo Electrónico", dataIndex: "email", key: "email" },
    {
      title: "Acciones",
      key: "actions",
      width:"100px",
      render: (_: any, record: User) => (
        <div className="actions">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <div className="intro">
        <h1>Gestión de Usuarios</h1>
        <p>Administra los ingresos mensuales de cada usuario.</p>
      </div>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
        Agregar Usuario
      </Button>
      <br />
      <Table columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 5 }} />

      {/* 🔹 Modal para agregar/editar usuario */}
      <Modal
        title={editingUser ? "Editar Usuario" : "Agregar Usuario"}
        visible={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "El nombre es obligatorio" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Correo Electrónico" rules={[{ required: true, message: "El correo es obligatorio" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
