'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import GlobalSearch from '@/components/ui/GlobalSearch';
import PageTransition from '@/components/ui/PageTransition';
import Tooltip from '@/components/ui/Tooltip';
import {
  Home,
  Calendar,
  Users,
  FileText,
  Pill,
  TestTube,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Activity,
  Briefcase,
  ClipboardList,
  BarChart3,
  UserCog,
  Mail,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  CreditCard,
  TrendingUp,
  Clock,
  Hospital,
  Bed,
  UserPlus,
  Building,
  Package,
  AlertTriangle,
  Sparkles,
  Search,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  roles: string[];
  submenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    icon: Home,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: Calendar,
    label: 'Appointments',
    href: '/dashboard/appointments',
    roles: ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: ClipboardList,
    label: 'My Schedule',
    roles: ['DOCTOR'],
    submenu: [
      {
        label: 'View Schedule',
        href: '/dashboard/doctor/schedule',
        icon: Calendar,
      },
      {
        label: 'Manage Availability',
        href: '/dashboard/doctor/availability',
        icon: Clock,
      },
      {
        label: 'Schedule Management',
        href: '/dashboard/doctor/schedule-management',
        icon: Calendar,
      },
    ],
  },
  {
    icon: Users,
    label: 'Patients',
    href: '/dashboard/reception/patients',
    roles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: Activity,
    label: 'Doctors',
    href: '/dashboard/reception/doctors',
    roles: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: FileText,
    label: 'Medical Records',
    href: '/dashboard/medical-records',
    roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: Pill,
    label: 'Prescriptions',
    href: '/dashboard/prescriptions',
    roles: ['PATIENT', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: TestTube,
    label: 'Laboratory',
    roles: ['LAB_TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'],
    submenu: [
      {
        label: 'Dashboard',
        href: '/dashboard/laboratory',
        icon: Home,
      },
      {
        label: 'Pending Tests',
        href: '/dashboard/laboratory/pending',
        icon: Clock,
      },
      {
        label: 'New Test Order',
        href: '/dashboard/laboratory/new',
        icon: Plus,
      },
    ],
  },
  {
    icon: TestTube,
    label: 'Lab Tests',
    href: '/dashboard/lab-tests',
    roles: ['PATIENT', 'DOCTOR'],
  },
  {
    icon: Hospital,
    label: 'IPD Management',
    roles: ['ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE'],
    submenu: [
      {
        label: 'Dashboard',
        href: '/dashboard/ipd',
        icon: Home,
      },
      {
        label: 'Admit Patient',
        href: '/dashboard/ipd/admit',
        icon: UserPlus,
      },
      {
        label: 'Bed Management',
        href: '/dashboard/ipd/beds',
        icon: Bed,
      },
      {
        label: 'Ward Management',
        href: '/dashboard/ipd/wards',
        icon: Building,
      },
    ],
  },
  {
    icon: Briefcase,
    label: 'Pharmacy',
    roles: ['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'],
    submenu: [
      {
        label: 'Manage Inventory',
        href: '/dashboard/pharmacy/inventory',
        icon: Package,
      },
      {
        label: 'Low Stock Items',
        href: '/dashboard/pharmacy/low-stock',
        icon: AlertTriangle,
      },
      {
        label: 'Expiring Items',
        href: '/dashboard/pharmacy/expiring',
        icon: Clock,
      },
    ],
  },
  {
    icon: DollarSign,
    label: 'Billing',
    roles: ['ACCOUNTANT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
    submenu: [
      {
        label: 'Dashboard',
        href: '/dashboard/billing',
        icon: Home,
      },
      {
        label: 'Generate Bill',
        href: '/dashboard/billing/generate',
        icon: Plus,
      },
      {
        label: 'All Bills',
        href: '/dashboard/billing/bills',
        icon: List,
      },
      {
        label: 'Collect Payment',
        href: '/dashboard/billing/payment',
        icon: CreditCard,
      },
      {
        label: 'Reports',
        href: '/dashboard/billing/reports',
        icon: TrendingUp,
      },
    ],
  },
  {
    icon: ClipboardList,
    label: 'Inventory',
    href: '/dashboard/pharmacy/inventory',
    roles: ['LAB_TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: BarChart3,
    label: 'Reports',
    href: '/dashboard/reports',
    roles: ['DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: UserCog,
    label: 'User Management',
    href: '/dashboard/admin/users',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: Mail,
    label: 'Email Test',
    href: '/dashboard/admin/email-test',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: UserCog,
    label: 'Staff Management',
    href: '/dashboard/staff',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/dashboard/settings',
    roles: ['PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  // Get the role-specific dashboard route
  const userDashboardRoute = user ? getDashboardRoute(user.role) : '/dashboard';

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === userDashboardRoute;
    }
    return pathname?.startsWith(href);
  };

  // Get effective href for menu item (replace generic /dashboard with role-specific route)
  const getMenuHref = (item: MenuItem): string => {
    if (item.href === '/dashboard' && user) {
      return userDashboardRoute;
    }
    return item.href || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        {/* Gradient background with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl" />
        
        <div className="relative flex flex-col grow pt-6 pb-4 overflow-y-auto">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center shrink-0 px-6"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Activity className="w-7 h-7 text-white" />
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediCare
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Hospital CRM</p>
              </div>
            </div>
          </motion.div>

          {/* User info - Modern Card Design */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 mx-4"
          >
            <div className="bg-gray-800/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <User className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {user?.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-3 space-y-1">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              
              // Handle items with submenu
              if (item.submenu) {
                const isExpanded = expandedMenus.includes(item.label);
                const hasActiveSubmenu = item.submenu.some((sub) => pathname.startsWith(sub.href));
                
                return (
                  <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                  >
                    <motion.button
                      onClick={() => toggleMenu(item.label)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full group flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                        ${
                          hasActiveSubmenu
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={`mr-3 shrink-0 h-5 w-5 ${
                            hasActiveSubmenu ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                        />
                        {item.label}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1 ml-12 space-y-1 overflow-hidden"
                        >
                          {item.submenu.map((subItem, subIndex) => {
                            const SubIcon = subItem.icon;
                            const active = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                            
                            return (
                              <motion.div
                                key={subItem.href}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.05 }}
                              >
                                <Link
                                  href={subItem.href}
                                  className={`
                                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                    ${
                                      active
                                        ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                                    }
                                  `}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      className={`mr-2 shrink-0 h-4 w-4 ${
                                        active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                      }`}
                                    />
                                  )}
                                  {subItem.label}
                                </Link>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
              
              // Handle regular menu items
              const active = isActive(item.href!);
              const effectiveHref = getMenuHref(item);
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                >
                  <Link
                    href={effectiveHref}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                        ${
                          active
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md'
                        }
                      `}
                    >
                      <Icon
                        className={`mr-3 shrink-0 h-5 w-5 ${
                          active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      />
                      {item.label}
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-white"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Logout button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-3 pb-2"
          >
            <motion.button
              onClick={handleLogout}
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full group flex items-center px-4 py-3 text-sm font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-md transition-all duration-200"
            >
              <LogOut className="mr-3 shrink-0 h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              Logout
            </motion.button>
          </motion.div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">MediCare</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 dark:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* User info */}
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">{user?.role.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-5 px-2 space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  
                  // Handle items with submenu
                  if (item.submenu) {
                    const isExpanded = expandedMenus.includes(item.label);
                    const hasActiveSubmenu = item.submenu.some((sub) => pathname.startsWith(sub.href));
                    
                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={`
                            w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                            ${
                              hasActiveSubmenu
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={`mr-3 shrink-0 h-5 w-5 ${
                                hasActiveSubmenu ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                              }`}
                            />
                            {item.label}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-1 ml-9 space-y-1">
                            {item.submenu.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const active = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                              
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`
                                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                    ${
                                      active
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                                  `}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      className={`mr-2 shrink-0 h-4 w-4 ${
                                        active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                                      }`}
                                    />
                                  )}
                                  {subItem.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Handle regular menu items
                  const active = isActive(item.href!);
                  const effectiveHref = getMenuHref(item);
                  
                  return (
                    <Link
                      key={item.href}
                      href={effectiveHref}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                        ${
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon
                        className={`mr-3 shrink-0 h-5 w-5 ${
                          active ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout button */}
              <div className="px-2 pb-4 mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 shrink-0 h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Top bar with glassmorphism */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 flex h-20 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-colors duration-300"
        >
          <button
            type="button"
            className="px-4 border-r border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1">
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent"
              >
                {getPageTitle(pathname, user?.role)}
              </motion.h1>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
              >
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </motion.p>
            </div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="ml-4 flex items-center gap-3"
            >
              {/* Global Search Button */}
              <Tooltip content="Search (Ctrl+K)" position="bottom">
                <motion.button
                  onClick={() => setSearchOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              </Tooltip>

              {/* Notifications */}
              <Tooltip content="Notifications" position="bottom">
                <div>
                  <NotificationDropdown />
                </div>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip content="Toggle theme" position="bottom">
                <div>
                  <ThemeToggle />
                </div>
              </Tooltip>

              {/* User Avatar */}
              <Tooltip content={`${user?.firstName} ${user?.lastName}`} position="bottom">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md cursor-pointer border-2 border-white dark:border-gray-700"
                >
                  <User className="w-6 h-6 text-white" />
                </motion.div>
              </Tooltip>
            </motion.div>
          </div>
        </motion.div>

        {/* Page content with animation */}
        <main className="flex-1">
          <PageTransition>
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case 'PATIENT':
      return '/dashboard/patient';
    case 'DOCTOR':
      return '/dashboard/doctor';
    case 'NURSE':
      return '/dashboard/ipd'; // Nurses manage IPD patients
    case 'RECEPTIONIST':
      return '/dashboard/reception';
    case 'LAB_TECHNICIAN':
      return '/dashboard/laboratory';
    case 'PHARMACIST':
      return '/dashboard/pharmacy';
    case 'ACCOUNTANT':
      return '/dashboard/billing';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/dashboard/admin';
    default:
      return '/dashboard';
  }
}

function getPageTitle(pathname: string | null, role?: string): string {
  if (!pathname) return 'Dashboard';

  if (pathname === '/dashboard' || pathname === getDashboardRoute(role || '')) {
    return 'Dashboard';
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    const title = segments[segments.length - 1]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return title;
  }

  return 'Dashboard';
}
