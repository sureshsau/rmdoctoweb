'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthContext } from '@/state/AuthContext';
import { getDashboardPathForUser } from '@/lib/roleRoutes';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  usePathname();
  const { isAuthenticated, user, logout } = useAuthContext();

// no-op: menu is closed via click handlers
  
    const navigationItems = [
    { name: "Home", link: "/" },
    { name: "About Us", link: "/about" },
    { name: "Services", link: "/services" },
    // { name: "Medicine Store", link: "/medicine-store" },
    { name: "Lab Test", link: "/lab-test" },
    { name: "Contact", link: "/contact" },
  ];
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => getDashboardPathForUser(user);

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <nav className="fixed top-4 left-0 right-0 z-50 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 px-4 sm:px-6 lg:px-8 transition-all duration-300">
          <div className="flex justify-between items-center h-14 sm:h-16">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                RMDocto
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

           {/* Desktop Right Buttons */}
<div className="hidden md:flex items-center gap-3">
  {!isAuthenticated ? (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="text-sm font-semibold px-4 py-2.5 rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 transition-all"
      >
        Login
      </Link>
      <Link
        href="/auth/register"
        className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/25 transition-all"
      >
        Sign Up
      </Link>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        href={getDashboardLink()}
        className="text-sm font-semibold px-4 py-2.5 rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 transition-all"
      >
        Dashboard
      </Link>
      <button
        onClick={() => logout({ redirectTo: "/" })}
        className="text-sm font-semibold px-4 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all"
      >
        Logout
      </button>
    </div>
  )}
</div>





            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={closeMenu}
          ></div>
          
          {/* Mobile Menu */}
          <div className="absolute top-20 left-4 right-4 mx-auto max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="py-4">
              {/* Navigation Items */}
              <div className="space-y-1 px-4">
                {navigationItems.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.link}
                    onClick={closeMenu}
                    className="group block px-4 py-3 text-base font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all duration-200"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: isMenuOpen ? `slideInRight 0.3s ease-out ${index * 50}ms both` : 'none'
                    }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        {item.name}
                      </span>
                      <svg 
                        className="w-4 h-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>
              
              {/* Mobile Action Buttons */}
                  <div className="mt-6 px-4 space-y-3">
                    {!isAuthenticated ? (
                      <Link
                        href="/auth/login"
                        onClick={closeMenu}
                        className="block w-full text-center font-semibold px-4 py-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all"
                      >
                        Login / Sign Up
                      </Link>
                    ) : (
                      <>
                        <Link href={getDashboardLink()} onClick={closeMenu} className="block w-full text-center font-semibold px-4 py-3 rounded-xl text-teal-700 bg-teal-50 border border-teal-100">
                          Dashboard
                        </Link>
                        <button onClick={() => { closeMenu(); logout({ redirectTo: "/" }); }} className="block w-full text-center font-semibold px-4 py-3 rounded-xl text-red-600 bg-red-50 border border-red-100">
                          Logout
                        </button>
                      </>
                    )}
                  </div>


            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;