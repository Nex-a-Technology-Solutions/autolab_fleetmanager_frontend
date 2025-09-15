import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Fleet from "./Fleet";

import Checkout from "./Checkout";

import Checkin from "./Checkin";

import Search from "./Search";

import Summary from "./Summary";

import Quoting from "./Quoting";

import Admin from "./Admin";

import Calendar from "./Calendar";

import AcceptQuote from "./AcceptQuote";

import WashCheck from "./WashCheck";

import DrivingCheck from "./DrivingCheck";

import DataSeeder from "./DataSeeder";

import EmbedQuote from "./EmbedQuote";

import EmbedGuide from "./EmbedGuide";

import Integrations from "./Integrations";

import ServiceDepartment from "./ServiceDepartment";

import GpsTracking from "./GpsTracking";

import Reservations from "./Reservations";

import Clients from "./Clients";

import GpsSync from "./GpsSync";

import Login from "./Login";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Fleet: Fleet,
    
    Checkout: Checkout,
    
    Checkin: Checkin,
    
    Search: Search,
    
    Summary: Summary,
    
    Quoting: Quoting,
    
    Admin: Admin,
    
    Calendar: Calendar,
    
    AcceptQuote: AcceptQuote,
    
    WashCheck: WashCheck,
    
    DrivingCheck: DrivingCheck,
    
    DataSeeder: DataSeeder,
    
    EmbedQuote: EmbedQuote,
    
    EmbedGuide: EmbedGuide,
    
    Integrations: Integrations,
    
    ServiceDepartment: ServiceDepartment,
    
    GpsTracking: GpsTracking,
    
    Reservations: Reservations,
    
    Clients: Clients,
    
    GpsSync: GpsSync,
    
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
// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    const isLoginPage = location.pathname.toLowerCase() === "/login";

    const content = (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Fleet" element={<Fleet />} />
            <Route path="/Checkout" element={<Checkout />} />
            <Route path="/Checkin" element={<Checkin />} />
            <Route path="/Search" element={<Search />} />
            <Route path="/Summary" element={<Summary />} />
            <Route path="/Quoting" element={<Quoting />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/Calendar" element={<Calendar />} />
            <Route path="/AcceptQuote" element={<AcceptQuote />} />
            <Route path="/WashCheck" element={<WashCheck />} />
            <Route path="/DrivingCheck" element={<DrivingCheck />} />
            <Route path="/DataSeeder" element={<DataSeeder />} />
            <Route path="/EmbedQuote" element={<EmbedQuote />} />
            <Route path="/EmbedGuide" element={<EmbedGuide />} />
            <Route path="/Integrations" element={<Integrations />} />
            <Route path="/ServiceDepartment" element={<ServiceDepartment />} />
            <Route path="/GpsTracking" element={<GpsTracking />} />
            <Route path="/Reservations" element={<Reservations />} />
            <Route path="/Clients" element={<Clients />} />
            <Route path="/GpsSync" element={<GpsSync />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    );

    // If login page → return only content
    if (isLoginPage) {
        return content;
    }

    // For all other pages → wrap with Layout
    return (
        <Layout currentPageName={currentPage}>
            {content}
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
