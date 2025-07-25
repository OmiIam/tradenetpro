'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

// Sample data for charts - in production, this would come from your API
const userGrowthData = [
  { month: 'Jan', users: 1200, active: 980, new: 230 },
  { month: 'Feb', users: 1450, active: 1180, new: 250 },
  { month: 'Mar', users: 1680, active: 1350, new: 230 },
  { month: 'Apr', users: 1920, active: 1580, new: 240 },
  { month: 'May', users: 2180, active: 1820, new: 260 },
  { month: 'Jun', users: 2450, active: 2050, new: 270 }
];

const transactionVolumeData = [
  { day: 'Mon', volume: 45000, transactions: 150 },
  { day: 'Tue', volume: 52000, transactions: 180 },
  { day: 'Wed', volume: 48000, transactions: 165 },
  { day: 'Thu', volume: 61000, transactions: 200 },
  { day: 'Fri', volume: 55000, transactions: 185 },
  { day: 'Sat', volume: 38000, transactions: 120 },
  { day: 'Sun', volume: 32000, transactions: 95 }
];

const userActivityData = [
  { hour: '00', active: 45 },
  { hour: '04', active: 28 },
  { hour: '08', active: 156 },
  { hour: '12', active: 289 },
  { hour: '16', active: 234 },
  { hour: '20', active: 178 }
];

const transactionTypesData = [
  { name: 'Deposits', value: 45, color: '#10B981' },
  { name: 'Withdrawals', value: 30, color: '#F59E0B' },
  { name: 'Trades', value: 20, color: '#3B82F6' },
  { name: 'Transfers', value: 5, color: '#8B5CF6' }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-sm">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.dataKey}:
            </span>
            {' '}
            {typeof entry.value === 'number' && entry.value > 1000 
              ? entry.value.toLocaleString() 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface AnalyticsChartsProps {
  className?: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-8 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ResponsiveGrid cols={{ base: 1, lg: 2 }} gap="xl">
          {/* User Growth Chart */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>User Growth Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#userGradient)"
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#activeGradient)"
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Volume Chart */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Weekly Transaction Volume</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="volume" 
                      fill="#8B5CF6" 
                      name="Volume ($)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveGrid cols={{ base: 1, lg: 2 }} gap="xl">
          {/* User Activity Heatmap */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Daily User Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Types Distribution */}
          <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Transaction Types</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {transactionTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ color: '#9CA3AF' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>
      </motion.div>

      {/* Performance Metrics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Key Performance Indicators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-3xl font-bold text-blue-400 mb-2">98.5%</div>
                <div className="text-sm text-slate-400">System Uptime</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-3xl font-bold text-green-400 mb-2">1.2s</div>
                <div className="text-sm text-slate-400">Avg Response Time</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-3xl font-bold text-purple-400 mb-2">99.2%</div>
                <div className="text-sm text-slate-400">Transaction Success</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-3xl font-bold text-amber-400 mb-2">4.8/5</div>
                <div className="text-sm text-slate-400">User Satisfaction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsCharts;