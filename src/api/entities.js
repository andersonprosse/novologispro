import { request } from './base44Client'; // Importamos nossa função criada acima

// Função que cria os "superpoderes" (CRUD) para cada entidade automaticamente
const createEntityHandler = (phpFile) => ({
    // 1. Listar (Busca todos os itens)
    // O site antigo chama algo como .findMany() ou .getAll()
    findMany: async () => {
        return await request(phpFile);
    },
    
    // 2. Buscar um (Pelo ID)
    findUnique: async ({ where }) => {
        // Assume que o sistema passa { where: { id: "123" } }
        // Como nosso PHP simples lista tudo, vamos filtrar no JS por enquanto
        const all = await request(phpFile);
        return all.find(item => item.id === where.id);
    },

    // 3. Atualizar
    update: async ({ where, data }) => {
        return await request(`${phpFile}?id=${where.id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // 4. Criar (Se precisar no futuro)
    create: async ({ data }) => {
        return await request(phpFile, {
            method: 'POST', // Você precisará adicionar lógica de POST no PHP depois
            body: JSON.stringify(data)
        });
    },

    // 5. Deletar (Se precisar no futuro)
    delete: async ({ where }) => {
        return await request(`${phpFile}?id=${where.id}`, {
            method: 'DELETE' // Você precisará adicionar lógica de DELETE no PHP depois
        });
    }
});

// --- AQUI CONECTAMOS AS TABELAS AOS ARQUIVOS PHP ---

export const Vehicle = createEntityHandler('vehicles.php');
export const Warehouse = createEntityHandler('warehouses.php');
export const Order = createEntityHandler('orders.php');
export const AppUser = createEntityHandler('app_users.php'); // Lembre de criar app_users.php
export const VehicleType = createEntityHandler('vehicle_types.php'); // Lembre de criar vehicle_types.php

// Autenticação Fictícia (para não travar o app)
export const User = {
    me: async () => ({ id: 1, name: "Usuário HostGator", email: "admin@hostgator" })
};