'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Search } from 'lucide-react';
import { Input } from '@/components/common/input';
import { topNavIcons } from '@/components/home/data';
import { cn } from '@/utils/cn';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState('Rahul');
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [citySearch, setCitySearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = window.localStorage.getItem('wrectifai_user');

    if (!storedUser) {
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as { name?: string };
      if (parsed.name?.trim()) {
        setUserName(parsed.name.trim().split(' ')[0]);
      }
    } catch {
      // Keep the default display name if local storage contains invalid JSON.
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const filteredCities = CITIES.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleLogout = () => {
    window.localStorage.removeItem('wrectifai_token');
    window.localStorage.removeItem('wrectifai_user');
    window.dispatchEvent(new Event('wrectifai-auth-changed'));
    window.location.replace('/login');
  };

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

        <div className="relative ml-[5px]" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="flex h-9 lg:h-10 shrink-0 items-center gap-2 rounded-full border border-[#dbe6ff] bg-white p-0.5 lg:py-1 lg:pl-1.5 lg:pr-3"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt={userName}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full object-cover"
            />
            <span className="hidden text-[13px] font-semibold text-[#17307a] lg:block">
              Hi, {userName}
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 text-[#17307a] transition-transform lg:block',
                isProfileOpen && 'rotate-180'
              )}
            />
          </button>

          {isProfileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-[190px] rounded-xl border border-[#e4ecff] bg-white p-2 shadow-[0_14px_34px_rgba(23,48,122,0.14)]"
            >
              <div className="border-b border-[#eef3ff] px-2.5 py-2">
                <p className="text-[11px] font-medium text-[#7182ad]">Signed in as</p>
                <p className="mt-0.5 truncate text-[13px] font-bold text-[#17307a]">
                  {userName}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="mt-2 flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] font-semibold text-[#c22535] transition-colors hover:bg-[#fff2f4]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
