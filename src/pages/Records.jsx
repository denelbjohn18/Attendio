import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Search, Filter, Edit2, Trash2, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusRing = ({ percentage }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = (p) => {
        if (p >= 90) return '#10b981'; // emerald-500
        if (p >= 75) return '#f59e0b'; // amber-500
        return '#ef4444'; // red-500
    };

    return (
        <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="transform -rotate-90 w-10 h-10">
                <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-100"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={getColor(percentage)}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-gray-700">{percentage}%</span>
        </div>
    );
};

const Records = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // In a real app, this would be a proper join view in Supabase checking attendance per subject
            // Here we mock the aggregated view to match the requested UI

            const { data: students, error: sErr } = await supabase.from('students').select('*');
            const { data: attendance, error: aErr } = await supabase.from('attendance').select('*');

            if (sErr || aErr) throw new Error("Failed to fetch data");

            // Mock aggregated data for the table
            const aggregatedLogs = students.map(student => {
                const studentLogs = attendance.filter(a => a.student_id === student.id);
                const presentCount = studentLogs.filter(a => a.status === 'Present').length;
                // Mock a total classes count to calculate percentage
                const totalClasses = presentCount > 0 ? presentCount + Math.floor(Math.random() * 3) : 10;
                const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);

                let status = 'Good';
                if (percentage < 75) status = 'Warning';
                if (percentage < 60) status = 'Critical';

                return {
                    id: student.id,
                    name: student.name,
                    enrollmentNo: student.enrollment_no,
                    avatar: student.avatar_url,
                    percentage: percentage,
                    status: status,
                    recentDate: studentLogs.length > 0 ? studentLogs[studentLogs.length - 1].date : 'No records'
                };
            });

            setLogs(aggregatedLogs);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate overall health (average percentage)
    const averageAttendance = logs.length > 0
        ? Math.round(logs.reduce((acc, curr) => acc + curr.percentage, 0) / logs.length)
        : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Records Dashboard</h1>
                    <p className="text-gray-500 mt-2">Manage student attendance logs and analytical data.</p>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 font-medium text-sm">Overall Batch Health</h3>
                        <p className="text-4xl font-black mt-2 text-gray-900">{averageAttendance}%</p>
                    </div>
                    <div className="w-20 h-20">
                        <StatusRing percentage={averageAttendance} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2 flex items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-gray-500 font-medium text-sm mb-4">Quick Filters</h3>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div className="relative min-w-[150px]">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Good">Good {">"}75%</option>
                                    <option value="Warning">Warning {"<"}75%</option>
                                    <option value="Critical">Critical {"<"}60%</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Seen</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading records...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No records found matching criteria.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={log.avatar || 'https://via.placeholder.com/40'}
                                                    alt=""
                                                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                />
                                                <span className="font-medium text-gray-900">{log.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-600 px-3 py-1 bg-gray-100 rounded-md text-sm font-mono border border-gray-200">
                                                {log.enrollmentNo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {log.recentDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusRing percentage={log.percentage} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Record">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Record">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Records;
