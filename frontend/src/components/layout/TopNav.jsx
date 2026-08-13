import React, { useState } from "react";
import { Search, Bell, Calendar, Globe, Menu, X, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "../../utils/api";

export default function TopNav({
  onOpenMobileNav = () => {},
  globalQuery = "",
  setGlobalQuery = () => {},
  onGlobalSearch = () => {},
  notifications = [],
  loadNotifications = () => {},
  dismissingIds = new Set(),
  handleDismissNotification = () => {}
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastError, setToastError] = useState("");

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      
      {/* Search Input & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open Mobile Navigation"
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={onGlobalSearch} className="relative hidden sm:block w-72 md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search Cases, FIRs, Officers, Sections... (Press Enter)"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium shadow-2xs transition-all"
          />
        </form>
      </div>

      {/* Top Header Right Indicators */}
      <div className="flex items-center gap-3">
        {/* Calendar Info */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <Calendar className="h-3 w-3 text-slate-400" />
          <span>{todayDate}</span>
        </div>

        {/* AI Engine Online Pill */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="hidden sm:inline uppercase">AI Engine Online</span>
        </div>

        {/* Notification Bell Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="System Notifications"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all relative cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-3.5 min-w-3.5 px-1 rounded-full bg-rose-600 text-white text-[8.5px] font-mono font-bold flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-tight">System Alerts</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.markAllNotificationsRead();
                          loadNotifications();
                        } catch (err) {
                          setToastError("Failed to mark notifications as read.");
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Mark All Read
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {toastError && (
                  <div className="bg-rose-50 border-b border-rose-100 px-3 py-1 text-[10px] font-bold text-rose-600 flex justify-between">
                    <span>{toastError}</span>
                    <button onClick={() => setToastError("")}>✕</button>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-[11px]">
                      <p className="font-semibold text-slate-700">No active alerts</p>
                      <p className="text-[10px] text-slate-400">All system events caught up.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isDismissing = dismissingIds.has(n.id);
                      const isUnread = !n.is_read && !n.read;
                      return (
                        <div
                          key={n.id}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <span className="font-bold text-slate-900 text-[11px] leading-tight flex-1">{n.title}</span>
                            <button
                              type="button"
                              disabled={isDismissing}
                              onClick={(e) => handleDismissNotification(e, n.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                            >
                              {isDismissing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
