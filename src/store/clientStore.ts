/**
 * IRM Sentinel — Client (Tenant) Store
 *
 * Each GRC engagement maps to a client within an industry vertical.
 * A consulting firm might serve:
 *   Banking → JPMorgan, Goldman Sachs, Wells Fargo
 *   Healthcare → Mayo Clinic, Kaiser Permanente, HCA Healthcare
 *   Manufacturing → Toyota, Boeing, Caterpillar
 *
 * The client store works alongside the industry store:
 *   industryStore  → which vertical (frameworks, risk categories, tone)
 *   clientStore    → which client (isolated data, branding, entity names)
 */

import { create } from 'zustand';
import { type IndustryId } from '../config/industries';

const STORAGE_KEY = 'irm-client';

// ============================================================================
// TYPES
// ============================================================================

export interface Client {
  id: string;
  name: string;
  shortName: string;
  industryId: IndustryId;
  /** Optional logo URL or initials color */
  color: string;
  /** Date added */
  createdAt: string;
}

interface ClientState {
  /** All registered clients across industries */
  clients: Client[];

  /** Currently active client ID (null = no client selected) */
  activeClientId: string | null;

  /** Convenience getter */
  activeClient: Client | null;

  /** Set the active client */
  setActiveClient: (clientId: string) => void;

  /** Add a new client */
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => string;

  /** Remove a client */
  removeClient: (clientId: string) => void;

  /** Get clients filtered by industry */
  getClientsByIndustry: (industryId: IndustryId) => Client[];
}

// ============================================================================
// SAMPLE CLIENTS (pre-seeded for demos)
// ============================================================================

const SAMPLE_CLIENTS: Client[] = [
  // Banking
  { id: 'cli-bank-001', name: 'Meridian National Bank', shortName: 'Meridian', industryId: 'banking', color: '#0097A7', createdAt: '2025-01-15' },
  { id: 'cli-bank-002', name: 'Atlas Federal Credit Union', shortName: 'Atlas FCU', industryId: 'banking', color: '#1565C0', createdAt: '2025-02-20' },
  { id: 'cli-bank-003', name: 'Pinnacle Trust Corp', shortName: 'Pinnacle', industryId: 'banking', color: '#2E7D32', createdAt: '2025-03-10' },

  // Healthcare
  { id: 'cli-health-001', name: 'Evergreen Health System', shortName: 'Evergreen', industryId: 'healthcare', color: '#C62828', createdAt: '2025-01-22' },
  { id: 'cli-health-002', name: 'Pacific Coast Medical Group', shortName: 'Pacific Coast', industryId: 'healthcare', color: '#6A1B9A', createdAt: '2025-02-18' },
  { id: 'cli-health-003', name: 'Summit Regional Hospital', shortName: 'Summit', industryId: 'healthcare', color: '#00838F', createdAt: '2025-04-05' },

  // Technology
  { id: 'cli-tech-001', name: 'NovaByte Technologies', shortName: 'NovaByte', industryId: 'technology', color: '#E65100', createdAt: '2025-01-30' },
  { id: 'cli-tech-002', name: 'Stratos Cloud Platform', shortName: 'Stratos', industryId: 'technology', color: '#4527A0', createdAt: '2025-03-01' },
  { id: 'cli-tech-003', name: 'Helix AI Labs', shortName: 'Helix AI', industryId: 'technology', color: '#1B5E20', createdAt: '2025-03-22' },

  // Energy
  { id: 'cli-energy-001', name: 'Crestline Energy Partners', shortName: 'Crestline', industryId: 'energy', color: '#F57F17', createdAt: '2025-02-01' },
  { id: 'cli-energy-002', name: 'Horizon Power & Gas', shortName: 'Horizon P&G', industryId: 'energy', color: '#BF360C', createdAt: '2025-02-28' },
  { id: 'cli-energy-003', name: 'Redwood Renewables Inc', shortName: 'Redwood', industryId: 'energy', color: '#33691E', createdAt: '2025-04-12' },

  // Manufacturing
  { id: 'cli-mfg-001', name: 'Ironbridge Manufacturing Co', shortName: 'Ironbridge', industryId: 'manufacturing', color: '#37474F', createdAt: '2025-01-10' },
  { id: 'cli-mfg-002', name: 'Precision Dynamics Group', shortName: 'PDG', industryId: 'manufacturing', color: '#4E342E', createdAt: '2025-03-15' },
  { id: 'cli-mfg-003', name: 'TerraForge Industries', shortName: 'TerraForge', industryId: 'manufacturing', color: '#263238', createdAt: '2025-04-01' },
];

// ============================================================================
// PERSISTENCE
// ============================================================================

function loadPersisted(): { clients: Client[]; activeClientId: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        clients: parsed.clients || SAMPLE_CLIENTS,
        activeClientId: parsed.activeClientId || null,
      };
    }
  } catch {
    // Ignore
  }
  return { clients: SAMPLE_CLIENTS, activeClientId: null };
}

function persist(clients: Client[], activeClientId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, activeClientId }));
  } catch {
    // Ignore quota errors
  }
}

// ============================================================================
// STORE
// ============================================================================

const initial = loadPersisted();

export const useClientStore = create<ClientState>((set, get) => ({
  clients: initial.clients,
  activeClientId: initial.activeClientId,
  activeClient: initial.activeClientId
    ? initial.clients.find(c => c.id === initial.activeClientId) || null
    : null,

  setActiveClient: (clientId: string) => {
    const { clients } = get();
    const client = clients.find(c => c.id === clientId) || null;
    persist(clients, clientId);
    set({ activeClientId: clientId, activeClient: client });
  },

  addClient: (data) => {
    const id = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newClient: Client = {
      ...data,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const { clients, activeClientId } = get();
    const updated = [...clients, newClient];
    persist(updated, activeClientId);
    set({ clients: updated });
    return id;
  },

  removeClient: (clientId: string) => {
    const { clients, activeClientId } = get();
    const updated = clients.filter(c => c.id !== clientId);
    const newActiveId = activeClientId === clientId ? null : activeClientId;
    const newActive = newActiveId ? updated.find(c => c.id === newActiveId) || null : null;
    persist(updated, newActiveId);
    set({ clients: updated, activeClientId: newActiveId, activeClient: newActive });
  },

  getClientsByIndustry: (industryId: IndustryId) => {
    return get().clients.filter(c => c.industryId === industryId);
  },
}));
