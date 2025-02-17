const API_URL = process.env["REACT_APP_API_URL"];

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Savings {
    id: string;
    description: string;
    amount: number;
    account: string;
    owner: string;
    month: string;
    year: string;
}
export interface HistoricalData {
    month: string;
    year: string;
    value: number;
}
export interface FinancialSummary {
    income: number;
    expenses: number;
    savings: number;
    surplus: number;
}
export interface Income {
    id: string;
    description: string;
    amount: number;
    owner: string;
    month: string;
    year: string;
}
export interface Expense {
    id: string;
    description: string;
    amount: number;
    account: string;
    is_shared: boolean;
    sharedPercentages?: Record<string, number>;
    is_quota: boolean;
    current_quota?: number;
    total_quotas?: number;
    payer?: string;
    month: string;
    year: string;
}
export interface Distribution {
    id: string;
    account: string;
    month: string;
    year: string;
    [user: string]: number | string; // Permite añadir dinámicamente usuarios
}
const PMService = {
    importLastMonth: async (month: string, year: string) =>{
        const response = await fetch(`${API_URL}/api/distribution/import`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ month, year }),
        });
    
        if (!response.ok) {
            throw new Error("Error al importar datos del último mes");
        }
    
        return await response.json();
    },
    // 🔹 Obtener distribución de salarios por mes y año
    getSalaryDistribution: async (month: string, year: string): Promise<Distribution[]> => {
        const response = await fetch(`${API_URL}/api/distribution?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Error obteniendo distribución salarial");
        return response.json();
    },

    // 🔹 Guardar nueva distribución de salarios
    saveSalaryDistribution: async (data: Distribution): Promise<Distribution> => {
        const response = await fetch(`${API_URL}/api/distribution`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Error guardando distribución salarial");
        return response.json();
    },


    // 🔹 Usuarios
    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_URL}/api/users`);
        if (!response.ok) throw new Error("Error obteniendo usuarios");
        return response.json();
    },

    addUser: async (user: Omit<User, "id">): Promise<User> => {
        const response = await fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error("Error agregando usuario");
        return response.json();
    },

    updateUser: async (id: string, user: Omit<User, "id">): Promise<void> => {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error("Error actualizando usuario");
    },

    deleteUser: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/users/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Error eliminando usuario");
    },

    // 🔹 Ahorros
    getSavings: async (month: string, year: string): Promise<Savings[]> => {
        const response = await fetch(`${API_URL}/api/savings?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Error obteniendo ahorros");
        return response.json();
    },

    addSavings: async (savings: Omit<Savings, "id">): Promise<Savings> => {
        const response = await fetch(`${API_URL}/api/savings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savings),
        });
        if (!response.ok) throw new Error("Error agregando ahorro");
        return response.json();
    },

    updateSavings: async (id: string, savings: Omit<Savings, "id">): Promise<void> => {
        const response = await fetch(`${API_URL}/api/savings/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savings),
        });
        if (!response.ok) throw new Error("Error actualizando ahorro");
    },

    deleteSavings: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/savings/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Error eliminando ahorro");
    },

    getIncomes: async (month: string, year: string): Promise<Income[]> => {
        const response = await fetch(`${API_URL}/api/income?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Error obteniendo ingresos");
        return response.json();
    },

    addIncome: async (income: Omit<Income, "id">, month: string, year: string): Promise<Income> => {
        const response = await fetch(`${API_URL}/api/income`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...income, month, year }),
        });
        if (!response.ok) throw new Error("Error agregando ingreso");
        return response.json();
    },

    updateIncome: async (id: string, income: Omit<Income, "id">, month: string, year: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/income/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...income, month, year }),
        });
        if (!response.ok) throw new Error("Error actualizando ingreso");
    },

    deleteIncome: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/income/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Error eliminando ingreso");
    },
    getExpenses: async (month: string, year: string): Promise<Expense[]> => {
        const response = await fetch(`${API_URL}/api/expenses?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Error obteniendo gastos");
        return response.json();
    },

    addExpense: async (expense: Omit<Expense, "id">,month: string, year: string): Promise<Expense> => {
        if (!("payer" in expense)) {
            expense["payer"]="Compartido"
        }
        const response = await fetch(`${API_URL}/api/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({...expense, month, year}),
        });
        if (!response.ok) throw new Error("Error agregando gasto");
        return response.json();
    },

    updateExpense: async (id: string, expense: Omit<Expense, "id">,month: string, year: string): Promise<void> => {
        if (!("payer" in expense)) {
            expense["payer"]="Compartido"
        }
        const response = await fetch(`${API_URL}/api/expenses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({...expense, month, year}),
        });
        if (!response.ok) throw new Error("Error actualizando gasto");
    },

    deleteExpense: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/expenses/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Error eliminando gasto");
    },
    getFinancialSummary: async (month: string, year: string): Promise<FinancialSummary> => {
        const response = await fetch(`${API_URL}/api/financial/financial-summary?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Error obteniendo datos financieros");
        return response.json();
    },

    // 🔹 Obtener la evolución del excedente
    getSurplusHistory: async (): Promise<HistoricalData[]> => {
        const response = await fetch(`${API_URL}/api/financial/surplus-history`);
        if (!response.ok) throw new Error("Error obteniendo historial de excedentes");
        return response.json();
    },

    // 🔹 Obtener la evolución de los gastos
    getExpensesHistory: async (): Promise<HistoricalData[]> => {
        const response = await fetch(`${API_URL}/api/financial/expenses-history`);
        if (!response.ok) throw new Error("Error obteniendo historial de gastos");
        return response.json();
    },

    // 🔹 Obtener la evolución de los ingresos
    getIncomeHistory: async (): Promise<HistoricalData[]> => {
        const response = await fetch(`${API_URL}/api/financial/income-history`);
        if (!response.ok) throw new Error("Error obteniendo historial de ingresos");
        return response.json();
    },
};

export default PMService;

