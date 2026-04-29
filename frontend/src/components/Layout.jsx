import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LogOut, HeartPulse, Settings as SettingsIcon, ChevronDown, User, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function Layout({ children, stage = "adult" }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const onLogout = () => { logout(); nav("/login"); };

  const home = user?.role === "parent" ? "/parent/dashboard" : "/adult/dashboard";
  const initial = (user?.email || "?").charAt(0).toUpperCase();
  const roleLabel = user?.role === "parent" ? "Parent account" : "Adult account";

  return (
    <div data-stage={stage} className="min-h-screen" style={{ background: "var(--s-bg, var(--bg))" }}>
      <header className="border-b border-[var(--border)] bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={home} className="flex items-center gap-2.5" data-testid="nav-home-link">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
              <HeartPulse className="text-white" size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-tight">Lifelong Health</div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-[var(--text-2)]">Companion · India</div>
            </div>
          </Link>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="account-menu-trigger" className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 border border-[var(--border)] bg-white hover:bg-[var(--surface)] transition-colors">
                  <span className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>{initial}</span>
                  <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">{user.email}</span>
                  <ChevronDown size={14} className="text-[var(--text-2)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl border-[var(--border)] shadow-lg">
                <div className="px-3 py-3 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>{initial}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user.email}</div>
                    <div className="text-[11px] text-[var(--text-2)] uppercase tracking-[0.14em] flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={11} /> {roleLabel}
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-2)]">My account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={home} data-testid="account-dashboard-link" className="cursor-pointer">
                    <User size={14} className="mr-2" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" data-testid="account-settings-link" className="cursor-pointer">
                    <SettingsIcon size={14} className="mr-2" /> Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} data-testid="account-logout-item" className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                  <LogOut size={14} className="mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
      <footer className="max-w-7xl mx-auto px-6 py-8 text-xs text-[var(--text-2)]">
        Educational content only. Not a substitute for medical advice.
      </footer>
    </div>
  );
}
