import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ADMIN_TOUR_KEY = '@inventease_admin_tour_completed';

interface AdminTourContextType {
  isTourActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const AdminTourContext = createContext<AdminTourContextType | undefined>(undefined);

export const useAdminTour = () => {
  const context = useContext(AdminTourContext);
  if (!context) {
    throw new Error('useAdminTour must be used within AdminTourProvider');
  }
  return context;
};

// Admin tour steps with screen navigation and precise coordinates
export const adminTourSteps = [
  { id: 0, screen: '/admin/sales', title: 'Welcome Admin!', description: 'Let me show you the admin features and security settings.', highlight: { x: 0, y: 100, width: 350, height: 80 } },
  { id: 1, screen: '/admin/sales', title: 'Sales Dashboard', description: 'Process sales with FEFO logic and track revenue.', highlight: { x: 0, y: 90, width: 350, height: 400 } },
  { id: 2, screen: '/admin/inventory', title: 'Inventory Management', description: 'View all products, edit details, and manage stock.', highlight: { x: -20, y: 700, width: 390, height: 400 } },
  { id: 3, screen: '/admin/scan', title: 'Admin Scanner', description: 'Quick access to scan and add products to inventory.', highlight: { x: 40, y: 300, width: 300, height: 400 } },
  { id: 4, screen: '/admin/stats', title: 'Analytics & Insights', description: 'View sales trends, predictions, and performance metrics.', highlight: { x: 20, y: 180, width: 390, height: 450 } },
  { id: 5, screen: '/admin/settings', title: 'Security & PIN', description: 'Set up your admin PIN to protect sensitive features. Enable auto-logout for extra security.', highlight: { x: 20, y: 200, width: 390, height: 300 } },
  { id: 6, screen: '/admin/settings', title: 'Staff Management', description: 'Add staff members with limited access. Each staff gets their own PIN and can manage inventory without accessing admin settings.', highlight: { x: 20, y: 520, width: 390, height: 250 } },
  { id: 7, screen: '/admin/settings', title: 'Alert Thresholds & Categories', description: 'Configure global alert thresholds and manage product categories with custom settings.', highlight: { x: 20, y: 790, width: 390, height: 350 } },
  { id: 8, screen: '/admin/sales', title: 'You\'re All Set!', description: 'Your inventory is secure with PIN protection. Manage your team and inventory like a pro!', highlight: { x: 20, y: 140, width: 350, height: 80 } },
];

export const AdminTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if tour was completed
  useEffect(() => {
    checkTourStatus();
  }, []);

  // Auto-start tour if not completed (when entering admin for first time)
  useEffect(() => {
    if (hasCompletedTour === false && pathname === '/admin/sales') {
      const timer = setTimeout(() => {
        startTour();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, pathname]);

  // Navigate to correct screen when step changes
  useEffect(() => {
    if (isTourActive && currentStep < adminTourSteps.length) {
      const targetScreen = adminTourSteps[currentStep].screen;
      if (pathname !== targetScreen) {
        router.push(targetScreen as any);
      }
    }
  }, [currentStep, isTourActive]);

  const checkTourStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ADMIN_TOUR_KEY);
      setHasCompletedTour(completed === 'true');
    } catch (error) {
      console.error('Error checking admin tour status:', error);
      setHasCompletedTour(false);
    }
  };

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
    router.push('/admin/sales');
  };

  const nextStep = () => {
    if (currentStep < adminTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = async () => {
    try {
      await AsyncStorage.setItem(ADMIN_TOUR_KEY, 'true');
      setHasCompletedTour(true);
      setIsTourActive(false);
      setCurrentStep(0);
      router.push('/admin/sales');
    } catch (error) {
      console.error('Error completing admin tour:', error);
    }
  };

  const resetTour = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_TOUR_KEY);
      setHasCompletedTour(false);
      setIsTourActive(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error resetting admin tour:', error);
    }
  };

  return (
    <AdminTourContext.Provider
      value={{
        isTourActive,
        currentStep,
        startTour,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        resetTour,
      }}
    >
      {children}
    </AdminTourContext.Provider>
  );
};
