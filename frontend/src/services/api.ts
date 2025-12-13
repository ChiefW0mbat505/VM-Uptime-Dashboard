import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import type {
  VirtualMachine,
  ResourceGroup,
  ComplianceStats,
  Exclusion,
  ScanResult
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const vmService = {
  async getVirtualMachines(timeRange?: number): Promise<VirtualMachine[]> {
    const params = timeRange ? { timeRange } : {};
    const response = await api.get<VirtualMachine[]>('/vms', { params });
    return response.data;
  },

  async getVirtualMachine(vmId: string): Promise<VirtualMachine> {
    const response = await api.get<VirtualMachine>(`/vms/${encodeURIComponent(vmId)}`);
    return response.data;
  },

  async updateVMComment(vmId: string, comment: string): Promise<void> {
    await api.patch(`/vms/${encodeURIComponent(vmId)}/comment`, { comment });
  },
};

export const resourceGroupService = {
  async getResourceGroups(timeRange?: number): Promise<ResourceGroup[]> {
    const params = timeRange ? { timeRange } : {};
    const response = await api.get<ResourceGroup[]>('/resource-groups', { params });
    return response.data;
  },

  async updateResourceGroupComment(rgId: string, comment: string): Promise<void> {
    await api.patch(`/resource-groups/${encodeURIComponent(rgId)}/comment`, { comment });
  },
};

export const exclusionService = {
  async getExclusions(): Promise<Exclusion[]> {
    const response = await api.get<Exclusion[]>('/exclusions');
    return response.data;
  },

  async addExclusion(exclusion: Omit<Exclusion, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Exclusion> {
    const response = await api.post<Exclusion>('/exclusions', exclusion);
    return response.data;
  },

  async removeExclusion(exclusionId: string): Promise<void> {
    await api.delete(`/exclusions/${exclusionId}`);
  },

  async updateExclusion(exclusionId: string, comment: string): Promise<Exclusion> {
    const response = await api.patch<Exclusion>(`/exclusions/${exclusionId}`, { comment });
    return response.data;
  },
};

export const complianceService = {
  async getStats(timeRange?: number): Promise<ComplianceStats> {
    const params = timeRange ? { timeRange } : {};
    const response = await api.get<ComplianceStats>('/compliance/stats', { params });
    return response.data;
  },
};

export const scanService = {
  async triggerScan(): Promise<ScanResult> {
    const response = await api.post<ScanResult>('/scan/trigger');
    return response.data;
  },

  async getScanStatus(scanId: string): Promise<ScanResult> {
    const response = await api.get<ScanResult>(`/scan/${scanId}`);
    return response.data;
  },

  async getLatestScan(): Promise<ScanResult> {
    const response = await api.get<ScanResult>('/scan/latest');
    return response.data;
  },
};

export default api;
