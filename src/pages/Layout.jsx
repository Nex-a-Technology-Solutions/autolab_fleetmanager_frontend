import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AISearch from "@/components/layout/AISearch";
import NotificationBell from "@/components/layout/NotificationBell";
import { User, ThemeSettings, NavigationSettings } from "@/api/entities";
import {
  LayoutDashboard, Car as CarIcon, LogOut, LogIn, Search, Calendar, Settings,
  FileCheck, FileBarChart, FileCode, Zap, Wrench, Map, Bookmark, Users, 
  Building // Added Building icon for fallback
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import djangoClient from '@/api/djangoClient';
import { Loader2 } from 'lucide-react';

// Define a map for icon components
const iconComponents = {
  LayoutDashboard, CarIcon, LogOut, LogIn, Search, Calendar, Settings,
  FileCheck, FileBarChart, FileCode, Zap, Wrench, Map, Bookmark, Users, Building
};

const defaultNavItems = [
    { id: 'dashboard', title: 'Dashboard', url: '/Dashboard', icon: 'LayoutDashboard', order: 0, isVisible: true, section: 'operations' },
    { id: 'fleet', title: 'Fleet Management', url: '/Fleet', icon: 'CarIcon', order: 1, isVisible: true, section: 'operations' },
    { id: 'calendar', title: 'Fleet Calendar', url: '/Calendar', icon: 'Calendar', order: 2, isVisible: true, section: 'operations' },
    { id: 'summary', title: 'Summary', url: '/Summary', icon: 'FileCheck', order: 3, isVisible: true, section: 'operations' },
    { id: 'quoting', title: 'Quoting', url: '/Quoting', icon: 'FileBarChart', order: 4, isVisible: true, section: 'operations' },
    { id: 'reservations', title: 'Reservations', url: '/Reservations', icon: 'Bookmark', order: 5, isVisible: true, section: 'operations' },
    { id: 'clients', title: 'Client Management', url: '/Clients', icon: 'Users', order: 6, isVisible: true, section: 'operations' },
    { id: 'checkout', title: 'Checkout Process', url: '/Checkout', icon: 'LogOut', order: 7, isVisible: true, section: 'operations' },
    { id: 'checkin', title: 'Check-in Process', url: '/Checkin', icon: 'LogIn', order: 8, isVisible: true, section: 'operations' },
    { id: 'service', title: 'Service Department', url: '/ServiceDepartment', icon: 'Wrench', order: 9, isVisible: true, section: 'operations', requiredRole: 'operations' },
    { id: 'search', title: 'Vehicle Search', url: '/Search', icon: 'Search', order: 10, isVisible: true, section: 'operations' },
    { id: 'gpstracking', title: 'GPS Tracking', url: '/GpsTracking', icon: 'Map', order: 11, isVisible: true, section: 'operations' },
    
    { id: 'admin', title: 'System Configuration', url: '/Admin', icon: 'Settings', order: 0, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'integrations', title: 'Business Integrations', url: '/Integrations', icon: 'Zap', order: 1, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'gpssync', title: 'GPS Data Sync', url: '/GpsSync', icon: 'Map', order: 2, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'dataseeder', title: 'Dev Reference', url: '/DataSeeder', icon: 'FileCode', order: 3, isVisible: true, section: 'admin', requiredRole: 'admin' }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [theme, setTheme] = React.useState({
    primary_color: '#1C2945', 
    accent_color: '#CE202E', 
    primary_light: '#2A3B5C',
    accent_light: '#E63946', 
    primary_dark: '#141F35',
    font_family: 'Inter', 
    font_size: 14,
    organization_name: '',
    logo: null
  });
  const [navItems, setNavItems] = React.useState(defaultNavItems);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to get full media URL
  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://autolab-fleetmanager-backend-api.onrender.com/${path}`;
  };

  // Helper function to get avatar URL with fallback
  const getAvatarUrl = (user) => {
    if (user?.profile_image) {
      return getMediaUrl(user.profile_image);
    }
    return null; // Will show initials instead
  };

  // Helper function to get organization logo
  const getOrganizationLogo = (themeData) => {
    if (themeData?.logo || themeData?.organization_logo) {
      return getMediaUrl(themeData.logo || themeData.organization_logo);
    }
    return null;
  };

  // Helper function to get organization name
  const getOrganizationName = (user, themeData) => {
    return themeData?.organization_name || 
           user?.organization_name || 
           'Fleet Management System';
  };

  React.useEffect(() => {
    let mounted = true;
    let authCheckInterval;

    const loadInitialData = async () => {
        try {
            if (!djangoClient.hasToken()) {
                throw new Error('No token found');
            }

            // Try to get cached profile first
            const cachedProfile = djangoClient.getCachedProfile();
            if (cachedProfile) {
                setCurrentUser(cachedProfile);
            }

            // Verify token and get fresh profile
            const isValid = await djangoClient.verifyToken();
            if (!isValid) {
                throw new Error('Invalid token');
            }

            const userProfile = await djangoClient.getUserProfile();
            if (!mounted) return;
            
            setCurrentUser(userProfile);

            // Load settings
            try {
                // Load settings with separate error handling
                const [themeResponse, navResponse] = await Promise.all([
                    djangoClient.get('/system/settings/theme/'),
                    djangoClient.get('/system/settings/navigation/')
                ]);

                if (mounted) {
                    // Handle theme settings - now includes organization info
                    if (themeResponse?.data && themeResponse.data.length > 0) {
                        const themeData = themeResponse.data[0];
                        setTheme(prev => ({
                            ...prev,
                            ...themeData,
                            // Ensure we have computed colors for the UI
                            primary_light: prev.primary_light,
                            accent_light: prev.accent_light, 
                            primary_dark: prev.primary_dark,
                            font_size: prev.font_size
                        }));
                    }

                    // Handle navigation settings
                    if (navResponse?.data && navResponse.data.length > 0) {
                        const allItems = defaultNavItems.map(defaultItem => {
                            const savedItem = navResponse.data[0].nav_items.find(item => item.id === defaultItem.id);
                            return savedItem ? { ...defaultItem, ...savedItem, icon: defaultItem.icon, section: defaultItem.section } : defaultItem;
                        });
                        setNavItems(allItems);
                    } else {
                        // Format the payload correctly for the API
                        const payload = {
                            organization: userProfile.organization,
                            nav_items: defaultNavItems.map(({ id, title, url, order, isVisible, section }) => ({
                                id,
                                title,
                                url,
                                order,
                                is_visible: isVisible,
                                section
                            }))
                        };

                        try {
                            await djangoClient.post('/system/settings/navigation/', payload);
                            setNavItems(defaultNavItems);
                        } catch (error) {
                            console.error('Failed to create navigation settings:', error.response?.data || error);
                            setNavItems(defaultNavItems);
                        }
                    }
                }
            } catch (settingsError) {
                console.warn('Failed to load settings, using defaults:', settingsError);
                // Continue with default values
            }
        } catch (error) {
            console.error('Authentication/loading error:', error);
            if (mounted) {
                djangoClient.logout();
                navigate('/login', { replace: true });
            }
        } finally {
            if (mounted) {
                setIsLoadingUser(false);
            }
        }
    };

    // Initial load
    loadInitialData();

    // Set up periodic check every 5 minutes
    authCheckInterval = setInterval(() => {
        if (!isLoadingUser) {
            loadInitialData();
        }
    }, 5 * 60 * 1000);

    return () => {
        mounted = false;
        clearInterval(authCheckInterval);
    };
}, [navigate]);

  // Filter nav items based on user role and visibility settings
  const getVisibleItems = (section) => {
    return navItems
      .filter(item => {
        if (item.section !== section || !item.isVisible) return false;
        if (!item.requiredRole) return true;
        if (item.requiredRole === 'admin') return ['owner', 'admin'].includes(currentUser?.role);
        if (item.requiredRole === 'operations') return ['owner', 'admin', 'manager', 'employee'].includes(currentUser?.role);
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  const visibleMainItems = getVisibleItems('operations');
  const visibleAdminItems = getVisibleItems('admin');

  const allNavItems = [...visibleMainItems, ...visibleAdminItems];
  const currentPage = allNavItems.find(item => createPageUrl(item.url.substring(1)) === location.pathname) || { title: currentPageName || "Page" };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'employee': return 'Employee';
      case 'driver': return 'Driver';
      case 'viewer': return 'Viewer';
      default: return 'User';
    }
  };

  const getRoleInitials = (user) => {
    if (user?.role === 'admin') return 'AD';
    if (user?.role === 'owner') return 'OW';
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (user?.first_name || user?.last_name) {
      const first = user?.first_name?.[0] || '';
      const last = user?.last_name?.[0] || '';
      return (first + last).toUpperCase() || 'U';
    }
    return 'U';
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const NavMenuList = ({ items }) => {
      return (
          <SidebarMenu>
              {items.map((item) => {
                  const IconComponent = iconComponents[item.icon] || LayoutDashboard;
                  return (
                      <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                              asChild
                              className={`hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl mb-1 font-medium ${
                                  createPageUrl(item.url.substring(1)) === location.pathname
                                      ? 'text-white shadow-lg hover:text-white'
                                      : 'text-slate-700'
                              }`}
                              style={createPageUrl(item.url.substring(1)) === location.pathname ? {
                                  background: 'linear-gradient(135deg, var(--wwfh-red), var(--wwfh-red-light))'
                              } : {}}
                          >
                              <Link to={createPageUrl(item.url.substring(1))} className="flex items-center gap-3 px-3 py-3">
                                  <IconComponent className="w-5 h-5" />
                                  <span>{item.title}</span>
                              </Link>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  )
              })}
          </SidebarMenu>
      )
  }
  
  const fontFamilies = {
    Inter: "'Inter', sans-serif",
    Roboto: "'Roboto', sans-serif",
    Lato: "'Lato', sans-serif",
    Poppins: "'Poppins', sans-serif",
    'system-ui': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  };

  // Get the organization name and logo
  const organizationName = getOrganizationName(currentUser, theme);
  const organizationLogo = getOrganizationLogo(theme);
  const userAvatarUrl = getAvatarUrl(currentUser);

  return (
    <SidebarProvider>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
            
            :root {
                --primary-color: ${theme.primary_color};
                --accent-color: ${theme.accent_color};
                --primary-light: ${theme.primary_light};
                --accent-light: ${theme.accent_light};
                --primary-dark: ${theme.primary_dark};
                --wwfh-red: #CE202E;
                --wwfh-red-light: #E63946;
            }

            body {
                font-family: ${fontFamilies[theme.font_family] || fontFamilies.Inter};
                font-size: ${theme.font_size || 14}px;
            }
        `}</style>

        <div className="flex flex-col h-screen">
          <div className="flex flex-1 overflow-hidden">
            <Sidebar className="w-64 bg-white border-r border-slate-200">
              <SidebarContent className="p-4">
                <SidebarHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {organizationLogo ? (
                        <img 
                          src={organizationLogo} 
                          alt={`${organizationName} Logo`}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ${organizationLogo ? 'hidden' : 'flex'}`}
                        style={{display: organizationLogo ? 'none' : 'flex'}}
                      >
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-lg font-semibold text-slate-800 truncate">
                        {organizationName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <NotificationBell />
                      <div className="relative">
                        {userAvatarUrl ? (
                          <img 
                            src={userAvatarUrl} 
                            alt="User Avatar" 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-semibold text-sm ${userAvatarUrl ? 'hidden' : 'flex'}`}
                          style={{display: userAvatarUrl ? 'none' : 'flex'}}
                        >
                          {getRoleInitials(currentUser)}
                        </div>
                        <div className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                </SidebarHeader>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Operations
                  </div>
                  <NavMenuList items={visibleMainItems} />
                </div>
                
                {['owner', 'admin'].includes(currentUser.role) && visibleAdminItems.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Admin
                    </div>
                    <NavMenuList items={visibleAdminItems} />
                  </div>
                )}

                <div className="mt-6">
                  <Link to="/login" onClick={() => djangoClient.logout()} className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl font-medium">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </Link>
                </div>
              </SidebarContent>
            </Sidebar>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <button className="p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-all duration-200 lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>
                  <div className="relative hidden lg:block">
                    <AISearch />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex items-center gap-2">
                    <button className="p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-all duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.403 1.403A2 2 0 0116 21H8a2 2 0 01-1.597-.724L5.999 17h5m4-10H5l1.403-1.403A2 2 0 018 3h8a2 2 0 011.597.724L18.001 7z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-all duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18m-7 5h7" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    {userAvatarUrl ? (
                      <img 
                        src={userAvatarUrl} 
                        alt="User Avatar" 
                        className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-blue-300 transition-all duration-200 cursor-pointer"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-blue-300 transition-all duration-200 cursor-pointer ${userAvatarUrl ? 'hidden' : 'flex'}`}
                      style={{display: userAvatarUrl ? 'none' : 'flex'}}
                    >
                      {getRoleInitials(currentUser)}
                    </div>
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-auto">
                <h1 className="text-2xl font-semibold text-slate-800 mb-4">
                  {currentPage.title}
                </h1>

                {children}
              </div>
            </div>
          </div>
        </div>
    </SidebarProvider>
  );
}