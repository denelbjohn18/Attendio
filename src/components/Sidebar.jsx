import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Camera,
    UserPlus,
    LayoutDashboard,
    Settings,
    Fingerprint
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Daily Log', path: '/', icon: Camera },
        { name: 'Registration', path: '/register', icon: UserPlus },
        { name: 'Records', path: '/records', icon: LayoutDashboard },
        { name: 'Configuration', path: '/config', icon: Settings },
    ];

    return (
        <aside className="w-64 h-screen bg-gray-900 text-gray-300 flex flex-col items-center py-8">
            <div className="flex items-center gap-3 mb-12">
                <div className="bg-emerald-500 p-2 rounded-lg text-white">
                    <Fingerprint size={28} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-widest">ATTENDIO</h1>
            </div>

            <nav className="w-full px-4 flex flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                    : 'hover:bg-gray-800 hover:text-white hover:scale-105'
                                }`
                            }
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="mt-auto px-6 py-4 w-full">
                <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-center border border-gray-700">
                    <p>Face Recognition</p>
                    <p className="text-emerald-500 font-semibold mt-1">System Active</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
