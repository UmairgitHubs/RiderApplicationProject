import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../services/api';

export interface WorkingArea {
  id: string;
  city: string;
  state: string;
  zipCodes: string[];
  status: 'Active' | 'Inactive';
  assignedBy: string;
  assignedDate: string;
}

export interface CoverageStats {
  activeAreas: number;
  totalZipCodes: number;
}

// Mock data for now as backend doesn't support granulaz zones yet
const MOCK_AREAS: WorkingArea[] = [
  {
    id: '1',
    city: 'New York',
    state: 'NY',
    zipCodes: ['10001', '10002', '10003', '10004'],
    status: 'Active',
    assignedBy: 'Manhattan Hub',
    assignedDate: 'Jan 15, 2025',
  },
  {
    id: '2',
    city: 'Brooklyn',
    state: 'NY',
    zipCodes: ['11201', '11205', '11206'],
    status: 'Active',
    assignedBy: 'Brooklyn Hub',
    assignedDate: 'Jan 15, 2025',
  },
];

export const useWorkingAreas = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile().then((res: any) => res.data?.profile),
  });
  
  // In a real app, we would fetch this from an API endpoint like /rider/zones
  // For now we simulate an API call that returns mock data based on the rider's hub
  const { data: areas, isLoading } = useQuery({
    queryKey: ['workingAreas'],
    queryFn: async (): Promise<WorkingArea[]> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_AREAS;
    },
  });

  const stats: CoverageStats = {
    activeAreas: areas?.filter(a => a.status === 'Active').length || 0,
    totalZipCodes: areas?.reduce((acc, curr) => acc + curr.zipCodes.length, 0) || 0,
  };

  return {
    areas: areas || [],
    stats,
    hubManager: 'Hub Manager', // Placeholder
    isLoading,
  };
};
