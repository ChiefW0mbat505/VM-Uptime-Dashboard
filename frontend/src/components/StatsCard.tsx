import React from 'react';
import { Stack, Text, Card } from '@fluentui/react';
import type { ComplianceStats } from '../types';
import { format } from 'date-fns';

interface StatsCardProps {
  stats: ComplianceStats;
}

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const complianceRate = stats.totalVMs > 0
    ? ((stats.compliantVMs / (stats.totalVMs - stats.excludedVMs)) * 100).toFixed(1)
    : '0.0';

  return (
    <Stack horizontal tokens={{ childrenGap: 20 }} wrap>
      <Card styles={{ root: { flex: 1, minWidth: 200, padding: 20 } }}>
        <Text variant="large" block>Total VMs</Text>
        <Text variant="xxLarge" block styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>
          {stats.totalVMs}
        </Text>
      </Card>

      <Card styles={{ root: { flex: 1, minWidth: 200, padding: 20 } }}>
        <Text variant="large" block>Compliant</Text>
        <Text variant="xxLarge" block styles={{ root: { fontWeight: 600, color: '#107c10' } }}>
          {stats.compliantVMs}
        </Text>
      </Card>

      <Card styles={{ root: { flex: 1, minWidth: 200, padding: 20 } }}>
        <Text variant="large" block>Non-Compliant</Text>
        <Text variant="xxLarge" block styles={{ root: { fontWeight: 600, color: '#d13438' } }}>
          {stats.nonCompliantVMs}
        </Text>
      </Card>

      <Card styles={{ root: { flex: 1, minWidth: 200, padding: 20 } }}>
        <Text variant="large" block>Excluded</Text>
        <Text variant="xxLarge" block styles={{ root: { fontWeight: 600, color: '#605e5c' } }}>
          {stats.excludedVMs}
        </Text>
      </Card>

      <Card styles={{ root: { flex: 1, minWidth: 200, padding: 20 } }}>
        <Text variant="large" block>Compliance Rate</Text>
        <Text variant="xxLarge" block styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>
          {complianceRate}%
        </Text>
        <Text variant="small" block styles={{ root: { color: '#605e5c' } }}>
          Last scan: {format(new Date(stats.lastScanTime), 'MMM dd, HH:mm')}
        </Text>
      </Card>
    </Stack>
  );
};

export default StatsCard;
