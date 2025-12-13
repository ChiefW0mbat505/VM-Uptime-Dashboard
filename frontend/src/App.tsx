import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Stack, Text } from '@fluentui/react';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <Stack styles={{ root: { minHeight: '100vh', backgroundColor: '#faf9f8' } }}>
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        styles={{
          root: {
            backgroundColor: '#0078d4',
            color: 'white',
            padding: '15px 30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Text variant="xLarge" styles={{ root: { color: 'white', fontWeight: 600 } }}>
          VM-Extension-Monitor
        </Text>
        <Text styles={{ root: { color: 'white' } }}>CloudOps Team</Text>
      </Stack>

      <Stack styles={{ root: { flex: 1 } }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Stack>
    </Stack>
  );
};

export default App;
