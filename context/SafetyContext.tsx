import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type RiskLevel = "low" | "medium" | "high";

export interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  category: "theft" | "assault" | "vandalism" | "fire" | "flood" | "other";
  timestamp: number;
  status: "pending" | "verified";
  reporterId: string;
}

export interface DisasterAlert {
  id: string;
  type: "flood" | "earthquake" | "storm" | "fire" | "tornado";
  title: string;
  description: string;
  severity: "watch" | "warning" | "emergency";
  area: string;
  timestamp: number;
}

export interface SafetyZone {
  id: string;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskLevel: RiskLevel;
  radius: number;
}

export interface SOSAlert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  active: boolean;
}

interface SafetyContextType {
  incidents: Incident[];
  disasters: DisasterAlert[];
  safetyZones: SafetyZone[];
  currentRisk: RiskLevel;
  currentRiskScore: number;
  sosActive: boolean;
  escortActive: boolean;
  reportIncident: (data: Omit<Incident, "id" | "timestamp" | "status">) => Promise<void>;
  triggerSOS: (lat: number, lng: number, userId: string) => Promise<void>;
  cancelSOS: () => void;
  startEscort: () => void;
  stopEscort: () => void;
  refreshData: () => void;
}

const SafetyContext = createContext<SafetyContextType | null>(null);

const INCIDENTS_KEY = "buzalert_incidents";

const MOCK_ZONES: SafetyZone[] = [
  { id: "z1", latitude: 40.7128, longitude: -74.006, riskScore: 78, riskLevel: "high", radius: 500 },
  { id: "z2", latitude: 40.7168, longitude: -74.001, riskScore: 45, riskLevel: "medium", radius: 400 },
  { id: "z3", latitude: 40.7088, longitude: -74.012, riskScore: 20, riskLevel: "low", radius: 600 },
  { id: "z4", latitude: 40.7208, longitude: -73.998, riskScore: 62, riskLevel: "medium", radius: 350 },
];

const MOCK_DISASTERS: DisasterAlert[] = [
  {
    id: "d1",
    type: "storm",
    title: "Severe Thunderstorm Warning",
    description: "Heavy rainfall expected with winds up to 60mph. Seek shelter immediately.",
    severity: "warning",
    area: "Metro Area",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "d2",
    type: "flood",
    title: "Flash Flood Watch",
    description: "Low-lying areas at risk of flash flooding through tonight.",
    severity: "watch",
    area: "River Districts",
    timestamp: Date.now() - 7200000,
  },
];

export function SafetyProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sosActive, setSosActive] = useState(false);
  const [escortActive, setEscortActive] = useState(false);
  const [currentRisk] = useState<RiskLevel>("medium");
  const [currentRiskScore] = useState(55);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const stored = await AsyncStorage.getItem(INCIDENTS_KEY);
      if (stored) setIncidents(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const saveIncidents = async (list: Incident[]) => {
    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(list));
    setIncidents(list);
  };

  const reportIncident = useCallback(async (data: Omit<Incident, "id" | "timestamp" | "status">) => {
    const newIncident: Incident = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      status: "pending",
    };
    const updated = [newIncident, ...incidents];
    await saveIncidents(updated);
  }, [incidents]);

  const triggerSOS = useCallback(async (_lat: number, _lng: number, _userId: string) => {
    setSosActive(true);
  }, []);

  const cancelSOS = useCallback(() => {
    setSosActive(false);
  }, []);

  const startEscort = useCallback(() => setEscortActive(true), []);
  const stopEscort = useCallback(() => setEscortActive(false), []);

  const refreshData = useCallback(() => {
    loadIncidents();
  }, []);

  return (
    <SafetyContext.Provider
      value={{
        incidents,
        disasters: MOCK_DISASTERS,
        safetyZones: MOCK_ZONES,
        currentRisk,
        currentRiskScore,
        sosActive,
        escortActive,
        reportIncident,
        triggerSOS,
        cancelSOS,
        startEscort,
        stopEscort,
        refreshData,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error("useSafety must be used inside SafetyProvider");
  return ctx;
}
