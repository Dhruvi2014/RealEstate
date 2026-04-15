import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(8px)", "blur(12px)"]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/properties', label: 'Properties' },
    { path: '/ai-hub', label: 'AI Property Hub' },
    { path: '/emi-calculator', label: 'EMI Calculator' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ backgroundColor: `rgba(255, 255, 255, ${bgOpacity.get()})`, backdropFilter: backdropBlur }}
      className="sticky top-0 z-50 border-b border-[#E6D5C3]"
    >
      <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
          <img src="/logo.png" alt="BuildEstate" className="h-9 w-auto" />
          <span className="font-fraunces text-2xl font-bold text-[#111827]">BuildEstate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-manrope text-sm transition-colors ${
                isActive(link.path)
                  ? 'text-[#D4755B] font-semibold'
                  : 'text-[#374151] hover:text-[#D4755B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4 relative">
          {isAuthenticated && user ? (
            <>
              {user.role?.toLowerCase() === 'agent' && (
                <Link
                  to="/add-property"
                  className="bg-[#D4755B] text-white font-manrope font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#B86851] transition-all hover:shadow-lg"
                >
                  + List Property
                </Link>
              )}
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border border-[#E6D5C3]">
                    <span className="font-syne font-bold text-[#D4755B] text-base uppercase">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-material-icons text-gray-500 text-sm">
                    {isProfileOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="mt-1 inline-block px-2 py-0.5 bg-[#D4755B]/10 text-[#D4755B] text-[10px] font-bold rounded uppercase tracking-wider">
                        {user.role || 'Buyer'}
                      </div>
                    </div>
                    
                    <div className="py-2">
                      {user.role?.toLowerCase() === 'agent' ? (
                        <>
                          <a
                            href="http://localhost:5174/login"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4755B] transition-colors"
                          >
                            Agent Dashboard
                          </a>
                        </>
                      ) : (
                        <Link
                          to="/my-appointments"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4755B] transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Appointments
                        </Link>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
                      >
                        <span className="font-material-icons text-[18px]">logout</span>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-[#D4755B] text-white font-manrope font-bold px-6 py-2 rounded-lg hover:bg-[#B86851] transition-all hover:shadow-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-[#374151] hover:text-[#D4755B] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="font-material-icons text-2xl">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-[#E6D5C3] shadow-lg py-4 px-8 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-manrope text-lg py-2 transition-colors ${
                isActive(link.path)
                  ? 'text-[#D4755B] font-semibold'
                  : 'text-[#374151] hover:text-[#D4755B]'
              }`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 my-2 pt-4 flex flex-col gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="font-manrope text-sm text-[#374151]">
                  Signed in as <span className="font-semibold">{user.name}</span>
                </span>
                {user.role?.toLowerCase() === 'agent' && (
                  <>
                    <a
                      href="http://localhost:5174/login"
                      className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors py-2"
                    >
                      Agent Dashboard
                    </a>
                  </>
                )}
                {user.role?.toLowerCase() !== 'agent' && (
                  <Link
                    to="/my-appointments"
                    className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors py-2"
                    onClick={closeMobileMenu}
                  >
                    My Appointments
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors py-2 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#D4755B] text-white font-manrope font-bold px-6 py-3 rounded-lg hover:bg-[#B86851] transition-all hover:shadow-lg text-center"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;