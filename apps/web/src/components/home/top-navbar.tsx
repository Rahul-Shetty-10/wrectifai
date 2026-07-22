'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/common/input';
import { topNavIcons } from '@/components/home/data';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/auth-context';

const CITIES = [
  'Hyderabad',
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi'
];

export function TopNavbar() {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [citySearch, setCitySearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Authentication context
  const { user, logout } = useAuth();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const filteredCities = CITIES.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:gap-6">
      
      {/* Left Section: Mobile Menu & Location Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#dbe6ff] bg-white text-[#1a56db] shadow-sm lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {/* Location Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setCitySearch(''); // Reset search on toggle
            }}
            className="flex h-10 shrink-0 items-center gap-[10px] rounded-lg border border-[#dbe6ff] bg-white px-3.5 text-[13px] font-semibold text-[#17307a] hover:bg-[#fcfdff] transition-all shadow-sm focus:outline-none focus:ring-0 focus:border-[#dbe6ff] focus-visible:outline-none focus-visible:ring-0 active:border-[#dbe6ff] active:ring-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] text-[#17307a] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s-6-4.35-6-11a6 6 0 1 1 12 0c0 6.65-6 11-6 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>{selectedCity}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#17307a] shrink-0 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[165px] rounded-xl border border-[#e4ecff] bg-white p-2.5 shadow-[0_12px_30px_rgba(23,48,122,0.12)]">
              {/* Search input bar - rounded-lg matches cities tiles */}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8ea0c7]" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search your city..."
                  className="h-[36px] w-full rounded-lg border border-[#7fa5f7] bg-white pl-9 pr-3 text-[12.5px] text-[#17307a] placeholder-[#8ea0c7] outline-none transition-all focus:border-[#4d82f3] focus:ring-1 focus:ring-[#4d82f3]"
                  autoFocus
                />
              </div>

              {/* City options list - constrained to show exactly 5 options at a time */}
              <div className="max-h-[175px] overflow-y-auto pr-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-100 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "flex h-[34px] w-full items-center rounded-lg px-2.5 text-left text-[13px] font-semibold transition-colors",
                        city === selectedCity 
                          ? "bg-[#1a56db] text-white" 
                          : "text-[#17307a] hover:bg-[#f2f6ff]"
                      )}
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="py-3 text-center text-[11px] font-normal text-[#17307a]">
                    No cities found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Search input form */}
      <form className="relative w-full order-3 lg:order-none lg:flex-1 lg:max-w-[420px] lg:mx-auto" onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7aa5]" />
        <Input
          value={query}
          onChange={(event) => {
            const newQuery = event.target.value;
            setQuery(newQuery);
            window.dispatchEvent(
              new CustomEvent('dashboard-search', {
                detail: newQuery.trim(),
              })
            );
          }}
          className="h-10 rounded-lg pl-11 pr-4 w-full"
          placeholder="Search for services, parts, garages..."
          aria-label="Search for services, parts, garages"
        />
      </form>

      {/* Right Section: Notifications, Chat, Favorites, Profile */}
      <div className="flex items-center gap-[7px] sm:gap-[12px] shrink-0 ml-auto lg:ml-0">
        {topNavIcons.map(({ icon: Icon, badge, label }) => (
          <div
            key={label}
            aria-label={label}
            className={cn(
              "relative h-9 w-9 lg:h-10 lg:w-10 shrink-0 flex items-center justify-center rounded-full bg-white text-[#17307a] shadow-sm ring-1 ring-[#e5ecfb]",
              label !== 'Notifications' ? "hidden lg:flex" : "flex"
            )}
          >
            <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
            {badge ? (
              <span className="absolute right-0 top-0 lg:right-1 flex h-4 lg:h-5 min-w-4 lg:min-w-5 items-center justify-center rounded-full bg-[#ff2f44] px-1 text-[9px] lg:text-[9.5px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </div>
        ))}

        {user ? (
          <div className="relative group ml-[5px]">
            <button className="flex h-9 lg:h-10 shrink-0 items-center gap-2 rounded-full border border-[#dbe6ff] bg-white p-0.5 lg:py-1 lg:pl-1.5 lg:pr-3 hover:bg-[#fcfdff] transition-all shadow-sm focus:outline-none">
              <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-[#1a56db] text-white font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden text-[13px] font-semibold text-[#17307a] lg:block">Hi, {user.name}</span>
              <ChevronDown className="hidden h-4 w-4 text-[#17307a] lg:block group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute right-0 top-full pt-2 w-48 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <div className="bg-white border border-[#e4ecff] rounded-xl shadow-lg p-1.5">
                <div className="px-3 py-2 text-xs text-[#8ea0c7] border-b border-[#f2f6ff] mb-1">
                  Role: <span className="font-semibold text-[#1a56db] capitalize">{user.roles.join(', ')}</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="ml-[5px] flex h-9 lg:h-10 shrink-0 items-center justify-center rounded-full border border-[#1a56db] bg-[#1a56db] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1546b5] transition-all focus:outline-none"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}

