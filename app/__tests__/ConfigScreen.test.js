/**
 * Testes de interface - ConfigScreen
 * Usa @testing-library/react-native
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock dos servicos Firebase antes de importar a tela
jest.mock('../src/services/firebase', () => ({
  setActiveProfile: jest.fn(() => Promise.resolve()),
  setAlertThreshold: jest.fn(() => Promise.resolve()),
  sendTareCommand: jest.fn(() => Promise.resolve()),
}));

import ConfigScreen from '../src/screens/ConfigScreen';

describe('ConfigScreen', () => {
  it('renderiza os 4 perfis de recipiente', () => {
    const { getByTestId } = render(<ConfigScreen />);
    expect(getByTestId('profile-0')).toBeTruthy();
    expect(getByTestId('profile-1')).toBeTruthy();
    expect(getByTestId('profile-2')).toBeTruthy();
    expect(getByTestId('profile-3')).toBeTruthy();
  });

  it('input de limiar aceita texto numerico', () => {
    const { getByTestId } = render(<ConfigScreen />);
    const input = getByTestId('threshold-input');
    fireEvent.changeText(input, '20');
    expect(input.props.value).toBe('20');
  });

  it('botao salvar esta presente e clicavel', () => {
    const { getByTestId } = render(<ConfigScreen />);
    const btn = getByTestId('save-button');
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
  });

  it('botao de tara esta presente', () => {
    const { getByTestId } = render(<ConfigScreen />);
    expect(getByTestId('tare-button')).toBeTruthy();
  });
});
