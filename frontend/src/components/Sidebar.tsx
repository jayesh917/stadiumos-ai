import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Activity,
  Users,
  AlertOctagon,
  Cpu,
  Bell,
  BarChart3,
  FileText,
  Settings,
  Wifi,
  WifiOff,
  UserCheck
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onUserRoleChange: (role: User['role']) => void;
  wsConnected: boolean;
  activeIncidentCount: number;
  criticalZoneCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserRoleChange,
  wsConnected,
  activeIncidentCount,
  criticalZoneCount
}) => {
  const menuItems = [
    { id: 'command-center', name: 'Command Center', icon: LayoutDashboard, badge: criticalZoneCount > 0 ? criticalZoneCount : undefined, badgeColor: 'bg-status-red text-white animate-pulse' },
    { id: 'tournaments', name: 'Tournaments', icon: Trophy },
    { id: 'scheduler', name: 'Smart Scheduler', icon: Calendar },
    { id: 'live-operations', name: 'Live Operations', icon: Activity },
    { id: 'crowd-intelligence', name: 'Crowd Intel', icon: Users, badge: criticalZoneCount > 0 ? 'Alert' : undefined, badgeColor: 'bg-status-amber text-black' },
    { id: 'incidents', name: 'Incidents', icon: AlertOctagon, badge: activeIncidentCount > 0 ? activeIncidentCount : undefined, badgeColor: 'bg-status-red text-white' },
    { id: 'ai-copilot', name: 'AI Copilot', icon: Cpu, glow: true },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'audit-log', name: 'Audit Log', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col justify-between relative z-25">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-dark to-primary flex items-center justify-center font-bold text-black font-sans text-lg tracking-wider shadow-lg shadow-primary/20">
            S
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white font-sans uppercase">StadiumOS</h1>
            <p className="text-[9px] text-primary font-mono tracking-widest uppercase">AI Command Center</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider font-sans transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-black font-extrabold shadow-md shadow-primary/20'
                    : 'text-gray-400 hover:bg-surface-light hover:text-white'
                } ${item.glow && !isActive ? 'border border-primary/20 text-primary animate-pulse' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Role Selector */}
      <div className="p-4 border-t border-border space-y-3 bg-background/50">
        {/* Role Switcher */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-1.5">
            <UserCheck className="w-3 h-3 text-primary" /> Active Operator Role
          </label>
          <select
            value={currentUser.role}
            onChange={(e) => onUserRoleChange(e.target.value as User['role'])}
            className="w-full bg-surface-light border border-border text-[10px] text-white rounded px-2.5 py-1.5 outline-none font-semibold tracking-wide cursor-pointer focus:border-primary transition-colors"
          >
            <option value="Organizer">Organizer (Full Control)</option>
            <option value="Operations Manager">Operations Manager</option>
            <option value="Security Officer">Security Officer</option>
            <option value="Medical Coordinator">Medical Coordinator</option>
          </select>
        </div>

        {/* WebSocket Connection Status indicator */}
        <div className="flex items-center justify-between pt-1 text-[9px] font-mono tracking-widest text-gray-500 uppercase">
          <span>System Status:</span>
          {wsConnected ? (
            <span className="flex items-center gap-1 text-status-green font-bold">
              <Wifi className="w-3.5 h-3.5" /> ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-status-red font-bold">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" /> OFFLINE
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
