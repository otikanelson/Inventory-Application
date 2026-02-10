export const dashboardTourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to InventEase! 👋',
    description: 'Let me show you around! This quick tour will help you understand all the powerful features at your fingertips.',
    targetPosition: { x: 20, y: 100, width: 200, height: 60 },
    tooltipPosition: 'bottom' as const,
    icon: 'rocket-outline' as const,
  },
  {
    id: 'stats',
    title: 'Inventory Overview',
    description: 'See your total inventory, items expiring soon, and low stock alerts at a glance. These stats update in real-time!',
    targetPosition: { x: 20, y: 200, width: 350, height: 120 },
    tooltipPosition: 'bottom' as const,
    icon: 'stats-chart-outline' as const,
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Insights 🤖',
    description: 'Our AI analyzes your inventory and provides smart recommendations. Tap to see urgent items that need your attention!',
    targetPosition: { x: 20, y: 340, width: 350, height: 60 },
    tooltipPosition: 'bottom' as const,
    icon: 'bulb-outline' as const,
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Access the most common tasks instantly: Scan products, search inventory, add items manually, or view statistics.',
    targetPosition: { x: 20, y: 480, width: 350, height: 140 },
    tooltipPosition: 'bottom' as const,
    icon: 'flash-outline' as const,
  },
  {
    id: 'fefo',
    title: 'FEFO Priority',
    description: 'First Expired, First Out! See which products are expiring soon so you can sell them first and reduce waste.',
    targetPosition: { x: 20, y: 640, width: 350, height: 100 },
    tooltipPosition: 'bottom' as const,
    icon: 'time-outline' as const,
  },
  {
    id: 'tabs',
    title: 'Activity Tabs',
    description: 'Switch between Recently Stocked and Recently Sold items. Track your inventory movements easily!',
    targetPosition: { x: 20, y: 760, width: 350, height: 50 },
    tooltipPosition: 'top' as const,
    icon: 'swap-horizontal-outline' as const,
  },
  {
    id: 'scanner-tab',
    title: 'Scanner Tab',
    description: 'Tap here to quickly scan product barcodes. It\'s 10x faster than manual entry!',
    targetPosition: { x: 80, y: 750, width: 60, height: 60 },
    tooltipPosition: 'top' as const,
    icon: 'scan-outline' as const,
  },
  {
    id: 'inventory-tab',
    title: 'Inventory Tab',
    description: 'Browse your complete product catalog, search, filter by category, and view detailed information.',
    targetPosition: { x: 160, y: 750, width: 60, height: 60 },
    tooltipPosition: 'top' as const,
    icon: 'cube-outline' as const,
  },
  {
    id: 'fefo-tab',
    title: 'FEFO Tab',
    description: 'View all expiring products sorted by date. Get AI-powered discount recommendations to move items faster!',
    targetPosition: { x: 240, y: 750, width: 60, height: 60 },
    tooltipPosition: 'top' as const,
    icon: 'trending-down-outline' as const,
  },
  {
    id: 'add-products-tab',
    title: 'Add Products',
    description: 'Manually add new products to your inventory. Perfect for items without barcodes!',
    targetPosition: { x: 320, y: 750, width: 60, height: 60 },
    tooltipPosition: 'top' as const,
    icon: 'add-circle-outline' as const,
  },
  {
    id: 'notifications',
    title: 'Alerts & Notifications',
    description: 'Get notified about expiring products, low stock, and important updates. Never miss a critical alert!',
    targetPosition: { x: 300, y: 100, width: 44, height: 44 },
    tooltipPosition: 'bottom' as const,
    icon: 'notifications-outline' as const,
  },
  {
    id: 'settings',
    title: 'Settings & Admin',
    description: 'Access app settings, admin dashboard, dark mode, and more. Customize InventEase to fit your needs!',
    targetPosition: { x: 354, y: 100, width: 44, height: 44 },
    tooltipPosition: 'bottom' as const,
    icon: 'settings-outline' as const,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'That\'s it! You now know all the key features. Start by scanning your first product or adding items manually. Happy inventory managing!',
    targetPosition: { x: 20, y: 400, width: 350, height: 100 },
    tooltipPosition: 'bottom' as const,
    icon: 'checkmark-circle-outline' as const,
  },
];

// Adjusted positions for actual screen layout
// These will need to be measured dynamically in production
export const getAdjustedTourSteps = (screenHeight: number) => {
  // Adjust positions based on actual screen height
  const isSmallScreen = screenHeight < 700;
  const scale = isSmallScreen ? 0.85 : 1;

  return dashboardTourSteps.map(step => ({
    ...step,
    targetPosition: {
      ...step.targetPosition,
      y: step.targetPosition.y * scale,
    },
  }));
};
