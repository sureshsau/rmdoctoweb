'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
 const [isLoggedIn, setIsLoggedIn] = useState(false);
const [role, setRole] = useState<string | null>(null);

useEffect(() => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    const parsedUser = JSON.parse(user);
    setIsLoggedIn(true);
    setRole(parsedUser.role); // doctor, admin, user, etc.
  }
}, []);
  
  const navigationItems = [
    { name: "Home", link: "/" },
    { name: "About Us", link: "/about" },
    { name: "Services", link: "/services" },
    { name: "Doctors", link: "/doctor" },
    { name: "Lab Test", link: "/lab-test" },
    { name: "Contact", link: "/contact" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };


  const getDashboardLink = () => {
  if (!role) return "/dashboard";

  switch (role) {
    case "doctor":
      return "/doctor/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "hms":
      return "/hms/dashboard";
    default:
      return "/user/dashboard"; // normal users
  }
};

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
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-full shadow-2xl px-4 sm:px-6 lg:px-8 transition-all duration-300">
          <div className="flex justify-between items-center h-14 sm:h-16">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                RMDocto
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-6 ">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/70 px-3 py-2 rounded-full transition"
                >
                  {item.name}
                </Link>
              ))}
            </div>

           {/* Desktop Right Buttons */}
<div className="hidden lg:flex items-center gap-4">

  {/* Show Book Appointment only for visitors + normal users */}
  {(!isLoggedIn || role === "user") && (
    <Link
      href="/book-appointment"
      className="text-sm font-semibold px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-cyan-600 to-blue-600 backdrop-blur-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
    >
      Book Appointment
    </Link>
  )}

  {/* If not logged in → show login/signup */}
  {!isLoggedIn ? (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/login"
        className="text-sm font-semibold px-4 py-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 transition-all"
      >
        Login
      </Link>

      <Link
        href="/auth/register"
        className="text-sm font-semibold px-4 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all"
      >
        Sign Up
      </Link>
    </div>
  ) : (
    <div className="flex items-center gap-4">

      {/* Dashboard (role based) */}
      <Link
        href={getDashboardLink()}
        className="text-sm font-semibold px-4 py-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 transition-all"
      >
        Dashboard
      </Link>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsLoggedIn(false);
          setRole(null);
        }}
        className="text-sm font-semibold px-4 py-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-all"
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
                    className="group block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/70 hover:translate-x-2 rounded-lg transition-all duration-300 ease-out transform hover:shadow-md hover:scale-105 active:scale-95 active:bg-blue-100/80"
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
                    {/* Book Appointment */}
                    <Link
                      href="/#"
                      className="block w-full text-center font-semibold px-4 py-3 rounded-lg 
                                text-white bg-cyan-600 
                                hover:bg-cyan-700 hover:shadow-lg 
                                transition-all duration-300 
                                hover:scale-105 active:scale-95 transform hover:-translate-y-1"
                    >
                      Book Appointment
                    </Link>

                    {/* Login / Sign Up */}
                    <Link
                      href="/auth"
                      onClick={closeMenu}
                      className="block w-full text-center font-semibold px-4 py-3 rounded-lg 
             text-white 
             bg-gradient-to-r from-rose-500 to-red-600
             hover:from-red-600 hover:to-rose-600
             hover:shadow-lg 
             transition-all duration-300 
             hover:scale-105 active:scale-95 
             transform hover:-translate-y-1"
                    >
                      Login / Sign Up
                    </Link>
                  </div>


            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;