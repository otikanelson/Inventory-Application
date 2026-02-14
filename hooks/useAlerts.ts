import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface AlertAction {
  type: string;
  label: string;
  description: string;
  icon: string;
  urgent: boolean;
}

export interface Alert {
  alertId: string;
  productId: string;
  productName: string;
  category?: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: "expired" | "critical" | "high" | "early" | "normal";
  priority: number;
  color: string;
  actions: AlertAction[];
  imageUrl?: string;
  barcode?: string;
}

export interface AlertSummary {
  total: number;
  expired: number;
  critical: number;
  high: number;
  early: number;
  totalValue: number;
  urgentActions: number;
}

export interface AlertThresholds {
  critical: number;
  highUrgency: number;
  earlyWarning: number;
}

export interface AlertSettings {
  thresholds: AlertThresholds;
  notificationPreferences?: {
    enablePush: boolean;
    enableEmail: boolean;
    dailySummary: boolean;
    summaryTime: string;
  };
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/alerts`;

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);

      // The backend returns { success: true, data: { alerts: [], summary: {}, thresholds: {} } }
      const backendData = response.data.data;
      const rawAlerts = backendData.alerts || [];

      const processed = rawAlerts.map((item: any) => ({
        ...item,
        // BACKEND MAPPING:
        // Backend uses 'level', frontend uses 'alertLevel'
        alertLevel: item.level || "normal",
        // Backend uses 'daysLeft', frontend uses 'daysUntilExpiry'
        daysUntilExpiry: item.daysLeft !== undefined ? item.daysLeft : null,
        // Ensure alertId exists
        alertId: item.alertId || item._id,
      }));

      setAlerts(processed);
      setSummary(backendData.summary);
    } catch (err) {
      console.error("Fetch Alerts Error:", err);
      setError("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (err) {
      console.error("Settings Fetch Error:", err);
    }
  }, [API_URL]);

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      const response = await axios.put(`${API_URL}/settings`, newSettings);
      if (response.data.success) {
        setSettings(response.data.data);
        // Refresh alerts immediately so new thresholds take effect
        await fetchAlerts();
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error("Update Settings Error:", err);
      return { success: false };
    }
  };

  const acknowledgeAlert = async (alertId: string, action: string) => {
    try {
      const response = await axios.post(`${API_URL}/acknowledge`, {
        alertId,
        action,
      });
      if (response.data.success) {
        setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false };
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
  }, [fetchAlerts, fetchSettings]);

  return {
    alerts,
    summary,
    settings,
    loading,
    error,
    refresh: fetchAlerts,
    updateSettings,
    acknowledgeAlert,
  };
};
