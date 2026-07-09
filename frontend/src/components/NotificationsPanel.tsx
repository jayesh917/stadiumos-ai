import React from 'react';
import { Notification } from '../types';
import { Bell, Smartphone, Mail, Send, BellRing } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: Notification[];
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications }) => {
  const getChannelIcon = (chan: string) => {
    switch (chan) {
      case 'SMS': return Smartphone;
      case 'Email': return Mail;
      case 'Push':
      case 'In-App':
      default:
        return BellRing;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans select-none" id="notifications-root">
      
      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <Bell className="w-5.5 h-5.5 text-primary" /> Operator Notifications Panel
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Monitor outgoing team messages, SMS alerts to security units, email logs, and mobile push notifications pushed to spectators during delays.
        </p>
      </div>

      {/* Notifications listing card */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 font-mono uppercase border-b border-border/40 pb-2">
          Outgoing Telemetry Messages Log ({notifications.length})
        </h3>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {notifications.length > 0 ? (
            notifications.map(n => {
              const ChanIcon = getChannelIcon(n.channel);
              return (
                <div key={n.id} className="p-3.5 bg-background border border-border/80 rounded-lg flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border/60 flex items-center justify-center mt-0.5">
                      <ChanIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                        Channel: {n.channel} • To: {n.recipient}
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{n.message}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <span className="text-[8px] text-gray-500 font-mono block">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      n.status === 'Sent' ? 'bg-status-blue/10 text-status-blue' :
                      n.status === 'Delivered' ? 'bg-status-green/10 text-status-green' :
                      'bg-status-red/10 text-status-red'
                    }`}>
                      {n.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-500 italic py-12 text-center">No notifications broadcasted.</p>
          )}
        </div>
      </div>

    </div>
  );
};
