// ==============================================================================
// ClinicFlow — Notification Dropdown Component
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink, Calendar, FileText, Info } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatRelativeDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string, link: string | null) => {
    await markAsRead(id);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('appointment')) return <Calendar className="w-4 h-4 text-sky-600" />;
    if (type.includes('record')) return <FileText className="w-4 h-4 text-emerald-600" />;
    return <Info className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
              {unreadCount > 0 && (
                <span className="bg-sky-100 text-sky-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-sky-600 hover:text-sky-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                  className={`p-3.5 flex gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 h-8 w-8 flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 self-center shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
