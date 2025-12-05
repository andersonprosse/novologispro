// ============================================================================
// ARQUIVO: src/api/base44Client.js (VERSÃO DE DEBUG)
// ============================================================================

// 1. ENDEREÇO DA API
export const API_BASE_URL = "https://logispro.sti-ia.org/api";

// 2. FUNÇÃO DE CONEXÃO
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
        
        // DEBUG: Mostra o status da resposta (200 é OK, 404 é não encontrado, 500 é erro)
        console.log(`[DEBUG] Status da resposta para ${endpoint}:`, response.status);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        
        // DEBUG: Mostra exatamente o que o PHP devolveu (Se for HTML, tem erro na URL)
        console.log(`[DEBUG] Conteúdo recebido de ${endpoint}:`, text);

        return text ? JSON.parse(text) : [];
        
    } catch (error) {
        console.error(`[ERRO CRÍTICO] Falha na requisição para ${endpoint}:`, error);
        return []; // Retorna array vazio para não travar a tela
    }
}

// 3. HANDLER DE ENTIDADES
const createEntityHandler = (phpFile) => ({
    findMany: async () => {
        const data = await request(phpFile);
        // DEBUG: Verifica se o dado final é um array
        console.log(`[DEBUG] Dados processados para ${phpFile}:`, Array.isArray(data) ? "É Array (OK)" : "NÃO É Array (ERRO)");
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

// 4. O OBJETO BASE44 COMPLETO
export const base44 = {
    auth: {
        me: async () => ({ 
            id: 'admin', 
            name: "Admin LogisPro", 
            email: "admin@logispro.sti-ia.org",
            app_role: 'admin' 
        }),
        signOut: () => console.log("Sair")
    },
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