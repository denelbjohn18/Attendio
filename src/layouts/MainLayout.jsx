import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-gray-800">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full h-full relative">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
