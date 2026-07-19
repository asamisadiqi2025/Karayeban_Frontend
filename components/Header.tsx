"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, User, Key } from "lucide-react";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 px-6 flex items-center justify-between">

          {/* Right: User Profile */}
      
      <div className="hidden md:block text-left">
        <p className="text-sm font-bold text-gray-900">احمد؛ خوش آمدید</p>
        <p className="text-xs text-gray-500">پنج شنبه، ۱۸ سرطان ۱۴۰۵</p>
      </div>

   

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی پیشرفته..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100/50 transition-all search-focus"
          />
          <Search
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

         {/* Left: Date & Welcome */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              A
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight">احمد</p>
              <p className="text-xs text-gray-500 leading-tight">مهندس نرم‌افزار</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 hidden sm:block transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">احمد</p>
                <p className="text-xs text-gray-500">خوش آمدید</p>
              </div>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={16} className="text-gray-400" />
                <span>پروفایل</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Key size={16} className="text-gray-400" />
                <span>تغییر رمز عبور</span>
              </a>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>خروج از حساب</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Notification */}
        <button className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      </div>
    </header>
  );
}