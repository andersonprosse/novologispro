// ============================================================================
// ARQUIVO: src/api/base44Client.js (COM LOGIN REAL)
// ============================================================================

// 1. ENDEREÇO DA API
export const API_BASE_URL = "https://logispro.sti-ia.org/api";

// 2. FUNÇÃO DE CONEXÃO (Mantida igual)
export async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    // DEBUG: Avisa que vai tentar conectar
    console.log(`[DEBUG] Tentando conectar em: ${url}`);

    const defaultOptions = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        
        console.log(`[DEBUG] Status da resposta para ${endpoint}:`, response.status);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        // console.log(`[DEBUG] Conteúdo recebido de ${endpoint}:`, text); // Descomente se precisar debugar muito

        return text ? JSON.parse(text) : [];
        
    } catch (error) {
        console.error(`[ERRO CRÍTICO] Falha na requisição para ${endpoint}:`, error);
        return []; 
    }
}

// 3. HANDLER DE ENTIDADES (Mantido igual)
const createEntityHandler = (phpFile) => ({
    findMany: async () => {
        const data = await request(phpFile);
        return Array.isArray(data) ? data : [];
    },
    findUnique: async ({ where }) => {
        const list = await request(phpFile);
        return Array.isArray(list) ? list.find(i => i.id === where.id) : null;
    },
    create: async (data) => {
        return await request(phpFile, { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
        return await request(`${phpFile}?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
        return await request(`${phpFile}?id=${id}`, { method: 'DELETE' });
    }
});

// 4. O OBJETO BASE44 COMPLETO (Aqui está a mudança!)
export const base44 = {
    // --- ÁREA DE AUTENTICAÇÃO ATUALIZADA ---
    auth: {
        // Nova função que conecta no seu login.php
        login: async (email, password) => {
            try {
                // Usa a URL base + login.php
                const response = await fetch(`${API_BASE_URL}/login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Repassa o erro que veio do PHP (ex: "Senha incorreta")
                    throw new Error(data.message || 'Erro ao fazer login');
                }

                return data.user; // Sucesso! Retorna os dados do usuário
            } catch (error) {
                throw error;
            }
        },

        // Mantidos por compatibilidade (caso algum componente antigo use)
        me: async () => ({ 
            id: 'admin', 
            name: "Admin LogisPro", 
            email: "admin@logispro.sti-ia.org",
            app_role: 'admin' 
        }),
        signOut: () => console.log("Sair")
    },

    // --- ENTIDADES (Mantidas) ---
    entities: {
        Vehicle:     createEntityHandler('vehicles.php'),
        VehicleType: createEntityHandler('vehicle_types.php'),
        AppUser:     createEntityHandler('app_users.php'),
        Order:       createEntityHandler('orders.php'),
        Warehouse:   createEntityHandler('warehouses.php')
    },
    
    integrations: {
        Core: {
            UploadFile: async () => ({ file_url: "https://placehold.co/600x400" })
        }
    }
};