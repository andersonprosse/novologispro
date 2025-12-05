import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Vehicles from "./Vehicles";

import Warehouses from "./Warehouses";

import Orders from "./Orders";

import Driver from "./Driver";

import Home from "./Home";

import AdminUsers from "./AdminUsers";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Vehicles: Vehicles,
    
    Warehouses: Warehouses,
    
    Orders: Orders,
    
    Driver: Driver,
    
    Home: Home,
    
    AdminUsers: AdminUsers,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Vehicles" element={<Vehicles />} />
                
                <Route path="/Warehouses" element={<Warehouses />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/Driver" element={<Driver />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}