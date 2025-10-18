/**
 * Enhanced Button Component Tests
 */

import React from 'react';
import { render, fireEvent } from '../../../utils/testUtils';
import EnhancedButton from '../EnhancedButton';

describe('EnhancedButton', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(<EnhancedButton {...defaultProps} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <EnhancedButton {...defaultProps} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <EnhancedButton {...defaultProps} onPress={mockOnPress} disabled />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <EnhancedButton {...defaultProps} onPress={mockOnPress} loading />
    );
    
    fireEvent.press(getByText('Loading...'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <EnhancedButton {...defaultProps} loading />
    );
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders custom loading text', () => {
    const { getByText } = render(
      <EnhancedButton {...defaultProps} loading loadingText="Please wait..." />
    );
    expect(getByText('Please wait...')).toBeTruthy();
  });

  it('applies correct styles for different variants', () => {
    const { getByText: getPrimary } = render(
      <EnhancedButton {...defaultProps} variant="primary" />
    );
    const { getByText: getSecondary } = render(
      <EnhancedButton {...defaultProps} variant="secondary" />
    );
    const { getByText: getOutline } = render(
      <EnhancedButton {...defaultProps} variant="outline" />
    );
    const { getByText: getGhost } = render(
      <EnhancedButton {...defaultProps} variant="ghost" />
    );
    const { getByText: getDanger } = render(
      <EnhancedButton {...defaultProps} variant="danger" />
    );

    expect(getPrimary('Test Button')).toBeTruthy();
    expect(getSecondary('Test Button')).toBeTruthy();
    expect(getOutline('Test Button')).toBeTruthy();
    expect(getGhost('Test Button')).toBeTruthy();
    expect(getDanger('Test Button')).toBeTruthy();
  });

  it('applies correct styles for different sizes', () => {
    const { getByText: getSmall } = render(
      <EnhancedButton {...defaultProps} size="small" />
    );
    const { getByText: getMedium } = render(
      <EnhancedButton {...defaultProps} size="medium" />
    );
    const { getByText: getLarge } = render(
      <EnhancedButton {...defaultProps} size="large" />
    );

    expect(getSmall('Test Button')).toBeTruthy();
    expect(getMedium('Test Button')).toBeTruthy();
    expect(getLarge('Test Button')).toBeTruthy();
  });

  it('renders with full width when specified', () => {
    const { getByText } = render(
      <EnhancedButton {...defaultProps} fullWidth />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByLabelText } = render(<EnhancedButton {...defaultProps} />);
    const button = getByLabelText('Test Button');
    expect(button).toBeTruthy();
  });

  it('has correct accessibility state when disabled', () => {
    const { getByLabelText } = render(
      <EnhancedButton {...defaultProps} disabled />
    );
    const button = getByLabelText('Test Button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('has correct accessibility state when loading', () => {
    const { getByLabelText } = render(
      <EnhancedButton {...defaultProps} loading />
    );
    const button = getByLabelText('Test Button');
    expect(button.props.accessibilityState.busy).toBe(true);
  });
});
