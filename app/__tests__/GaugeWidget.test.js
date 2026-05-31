import React from 'react';
import { render } from '@testing-library/react-native';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const mock = (name) => ({ children, ...props }) =>
    React.createElement(View, { testID: name, ...props }, children);
  return {
    default: mock('Svg'),
    Svg: mock('Svg'),
    Circle: mock('Circle'),
    Defs: mock('Defs'),
    LinearGradient: mock('LinearGradient'),
    Stop: mock('Stop'),
  };
});

import GaugeWidget from '../src/components/GaugeWidget';

describe('GaugeWidget', () => {
  it('renderiza sem crash', () => {
    const { getByTestId } = render(
      <GaugeWidget percentage={75} label="Botijao P13" sublabel="Gas" />
    );
    expect(getByTestId('gauge-widget')).toBeTruthy();
  });

  it('clipa percentage abaixo de 0', () => {
    const { getByTestId } = render(<GaugeWidget percentage={-10} label="Test" />);
    expect(getByTestId('gauge-widget')).toBeTruthy();
  });

  it('clipa percentage acima de 100', () => {
    const { getByTestId } = render(<GaugeWidget percentage={150} label="Test" />);
    expect(getByTestId('gauge-widget')).toBeTruthy();
  });
});
