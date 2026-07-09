import React, { useState } from 'react';
import { AuditLog } from '../types';
import { FileText, Search, ShieldCheck } from 'lucide-react';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs by search term
  const filteredLogs = auditLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.actor.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      log.role.toLowerCase().includes(term) ||
      (log.reason && log.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans" id="audit-log-root">

      {/* Header Info */}
      <div className="bg-surface border border-border p-6 rounded-xl space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
          <FileText className="w-5.5 h-5.5 text-primary" /> Operations Audit Trail
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Search and verify immutable logs detailing database updates, schedule optimization approvals, and operator role changes.
        </p>
      </div>

      {/* Main logs display */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search audit trail by actor, role, action, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border text-xs rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[9px] text-gray-500 uppercase font-mono tracking-wider">
                <th className="py-2.5">Timestamp</th>
                <th className="py-2.5">Actor (Role)</th>
                <th className="py-2.5">Action Code</th>
                <th className="py-2.5">Target Entity</th>
                <th className="py-2.5">State Change (Before &rarr; After)</th>
                <th className="py-2.5">Reason Notes</th>
              </tr>
            </thead>
            <tbody className="text-[10px] divide-y divide-border/20">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-background/30 transition-colors">
                    <td className="py-3 text-gray-400 font-mono">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {log.actor} <span className="text-[9px] text-gray-500 font-mono font-normal block">({log.role})</span>
                    </td>
                    <td className="py-3 font-bold font-mono text-primary uppercase">
                      {log.action}
                    </td>
                    <td className="py-3 text-gray-300 font-medium">
                      {log.entity}
                    </td>
                    <td className="py-3 text-gray-400 leading-normal max-w-[180px] truncate">
                      {log.before_state && log.after_state ? (
                        <>
                          <span className="text-gray-500">{log.before_state}</span>
                          <span className="text-primary mx-1">&rarr;</span>
                          <span className="text-white">{log.after_state}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 font-mono">N/A</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-400 italic max-w-[120px] truncate">
                      {log.reason || 'None'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 italic">
                    No matching audit records located.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
