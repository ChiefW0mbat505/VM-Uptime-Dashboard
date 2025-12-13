import React, { useEffect, useState } from 'react';
import { Stack, Text, Spinner, MessageBar, MessageBarType } from '@fluentui/react';
import { vmService, complianceService } from '../services/api';
import type { VirtualMachine, ComplianceStats } from '../types';
import VMList from '../components/VMList';
import StatsCard from '../components/StatsCard';
import TimeRangeSelector from '../components/TimeRangeSelector';
import { TIME_RANGES } from '../config/constants';

const Dashboard: React.FC = () => {
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [timeRange, setTimeRange] = useState<number>(TIME_RANGES.SEVEN_DAYS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vmsData, statsData] = await Promise.all([
        vmService.getVirtualMachines(timeRange),
        complianceService.getStats(timeRange),
      ]);
      setVms(vmsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { minHeight: '400px' } }}>
        <Spinner label="Loading dashboard..." size={3} />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xxLarge">VM-Extension-Monitor Dashboard</Text>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} onRefresh={handleRefresh} />
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {stats && <StatsCard stats={stats} />}

      <VMList vms={vms} onUpdate={loadData} />
    </Stack>
  );
};

export default Dashboard;
