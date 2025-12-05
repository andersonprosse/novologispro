import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

// --- IMPORTAÇÕES NECESSÁRIAS ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// CRIAÇÃO DO CLIENTE (Instância do Gerenciador de Dados)
const queryClient = new QueryClient(); 
// CÓDIGO CORRIGIDO (REMOVENDO O STRICT MODE)
ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <App /> 
    </QueryClientProvider>
);