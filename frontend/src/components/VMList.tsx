import React from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  SelectionMode,
  Stack,
  Icon,
  Text,
  IconButton,
  TooltipHost,
  TextField,
  Checkbox,
} from '@fluentui/react';
import type { VirtualMachine } from '../types';
import { REQUIRED_EXTENSIONS } from '../config/constants';
import { format } from 'date-fns';

interface VMListProps {
  vms: VirtualMachine[];
  onUpdate: () => void;
}

const VMList: React.FC<VMListProps> = ({ vms, onUpdate }) => {
  const [editingComment, setEditingComment] = React.useState<string | null>(null);
  const [commentValue, setCommentValue] = React.useState('');

  const handleSaveComment = async (vmId: string) => {
    // This will be implemented with the API service
    setEditingComment(null);
    onUpdate();
  };

  const handleToggleExclusion = async (vmId: string, excluded: boolean) => {
    // This will be implemented with the API service
    onUpdate();
  };

  const columns: IColumn[] = [
    {
      key: 'status',
      name: '',
      minWidth: 30,
      maxWidth: 30,
      onRender: (item: VirtualMachine) => {
        if (item.excluded) {
          return (
            <TooltipHost content="Excluded from monitoring">
              <Icon iconName="StatusCircleBlock" styles={{ root: { color: '#605e5c', fontSize: 16 } }} />
            </TooltipHost>
          );
        }
        return item.isCompliant ? (
          <TooltipHost content="Compliant">
            <Icon iconName="StatusCircleCheckmark" styles={{ root: { color: '#107c10', fontSize: 16 } }} />
          </TooltipHost>
        ) : (
          <TooltipHost content="Non-compliant">
            <Icon iconName="StatusCircleErrorX" styles={{ root: { color: '#d13438', fontSize: 16 } }} />
          </TooltipHost>
        );
      },
    },
    {
      key: 'name',
      name: 'VM Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    {
      key: 'resourceGroup',
      name: 'Resource Group',
      fieldName: 'resourceGroup',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'subscription',
      name: 'Subscription',
      fieldName: 'subscriptionName',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'osType',
      name: 'OS',
      fieldName: 'osType',
      minWidth: 80,
      maxWidth: 80,
    },
    {
      key: 'powerState',
      name: 'Power State',
      fieldName: 'powerState',
      minWidth: 100,
      maxWidth: 100,
    },
    {
      key: 'missingExtensions',
      name: 'Missing Extensions',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      onRender: (item: VirtualMachine) => {
        if (item.excluded) return <Text styles={{ root: { color: '#605e5c' } }}>Excluded</Text>;
        if (item.missingExtensions.length === 0) {
          return <Text styles={{ root: { color: '#107c10' } }}>All present</Text>;
        }
        return (
          <TooltipHost content={item.missingExtensions.join(', ')}>
            <Text styles={{ root: { color: '#d13438' } }}>
              {item.missingExtensions.length} missing
            </Text>
          </TooltipHost>
        );
      },
    },
    {
      key: 'lastChecked',
      name: 'Last Checked',
      minWidth: 120,
      maxWidth: 150,
      onRender: (item: VirtualMachine) => (
        <Text>{format(new Date(item.lastChecked), 'MMM dd, HH:mm')}</Text>
      ),
    },
    {
      key: 'comment',
      name: 'Comment',
      minWidth: 200,
      isResizable: true,
      onRender: (item: VirtualMachine) => {
        if (editingComment === item.id) {
          return (
            <Stack horizontal tokens={{ childrenGap: 5 }}>
              <TextField
                value={commentValue}
                onChange={(_, newValue) => setCommentValue(newValue || '')}
                styles={{ root: { width: 150 } }}
              />
              <IconButton
                iconProps={{ iconName: 'CheckMark' }}
                onClick={() => handleSaveComment(item.id)}
              />
              <IconButton
                iconProps={{ iconName: 'Cancel' }}
                onClick={() => setEditingComment(null)}
              />
            </Stack>
          );
        }
        return (
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Text>{item.comment || 'No comment'}</Text>
            <IconButton
              iconProps={{ iconName: 'Edit' }}
              onClick={() => {
                setEditingComment(item.id);
                setCommentValue(item.comment || '');
              }}
            />
          </Stack>
        );
      },
    },
    {
      key: 'excluded',
      name: 'Excluded',
      minWidth: 80,
      maxWidth: 80,
      onRender: (item: VirtualMachine) => (
        <Checkbox
          checked={item.excluded}
          onChange={(_, checked) => handleToggleExclusion(item.id, checked || false)}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <Text variant="xLarge">Virtual Machines ({vms.length})</Text>
      <DetailsList
        items={vms}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        isHeaderVisible={true}
      />
    </Stack>
  );
};

export default VMList;
