import React from 'react';
import { Stack, Dropdown, IDropdownOption, PrimaryButton } from '@fluentui/react';
import { TIME_RANGES } from '../config/constants';

interface TimeRangeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onRefresh: () => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange, onRefresh }) => {
  const options: IDropdownOption[] = [
    { key: TIME_RANGES.SEVEN_DAYS, text: 'Last 7 Days' },
    { key: TIME_RANGES.THIRTY_DAYS, text: 'Last 30 Days' },
  ];

  return (
    <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
      <Dropdown
        selectedKey={value}
        options={options}
        onChange={(_, option) => option && onChange(option.key as number)}
        styles={{ root: { width: 150 } }}
      />
      <PrimaryButton
        text="Refresh"
        iconProps={{ iconName: 'Refresh' }}
        onClick={onRefresh}
      />
    </Stack>
  );
};

export default TimeRangeSelector;
