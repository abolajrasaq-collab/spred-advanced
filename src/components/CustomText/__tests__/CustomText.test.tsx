/**
 * CustomText Component Tests
 */

import React, { useState, useEffect } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomText from '../CustomText';

describe('CustomText Component', () => {
  it('should render text content correctly', () => {
    const { getByText } = render(<CustomText>Hello World</CustomText>);

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply custom fontSize', () => {
    const { getByText } = render(
      <CustomText fontSize={20}>Large Text</CustomText>,
    );

    const textElement = getByText('Large Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        fontSize: 20,
      }),
    );
  });

  it('should apply custom color', () => {
    const { getByText } = render(
      <CustomText color="#FF0000">Red Text</CustomText>,
    );

    const textElement = getByText('Red Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        color: '#FF0000',
      }),
    );
  });

  it('should apply fontWeight as string', () => {
    const { getByText } = render(
      <CustomText fontWeight="700">Bold Text</CustomText>,
    );

    const textElement = getByText('Bold Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        fontWeight: '700',
      }),
    );
  });

  it('should apply margin properties', () => {
    const { getByText } = render(
      <CustomText
        marginLeft={10}
        marginTop={15}
        marginRight={20}
        marginBottom={25}
      >
        Margin Text
      </CustomText>,
    );

    const textElement = getByText('Margin Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        marginLeft: 10,
        marginTop: 15,
        marginRight: 20,
        marginBottom: 25,
      }),
    );
  });

  it('should apply lineHeight', () => {
    const { getByText } = render(
      <CustomText lineHeight={24}>Line Height Text</CustomText>,
    );

    const textElement = getByText('Line Height Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        lineHeight: 24,
      }),
    );
  });

  it('should apply fontFamily', () => {
    const { getByText } = render(
      <CustomText fontFamily="Arial">Custom Font</CustomText>,
    );

    const textElement = getByText('Custom Font');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        fontFamily: 'Arial',
      }),
    );
  });

  it('should apply textAlign', () => {
    const { getByText } = render(
      <CustomText textAlign="center">Centered Text</CustomText>,
    );

    const textElement = getByText('Centered Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        textAlign: 'center',
      }),
    );
  });

  it('should apply numberOfLines', () => {
    const { getByText } = render(
      <CustomText numberOfLines={2}>
        This is a very long text that should be truncated to two lines only
      </CustomText>,
    );

    const textElement = getByText(/This is a very long text/);
    expect(textElement.props.numberOfLines).toBe(2);
  });

  it('should apply ellipsizeMode', () => {
    const { getByText } = render(
      <CustomText numberOfLines={1} ellipsizeMode="middle">
        This text will be truncated in the middle
      </CustomText>,
    );

    const textElement = getByText(/This text will be truncated/);
    expect(textElement.props.ellipsizeMode).toBe('middle');
  });

  it('should handle onPress callback', () => {
    const onPressMock = jest.fn();

    const { getByText } = render(
      <CustomText onPress={onPressMock}>Pressable Text</CustomText>,
    );

    const textElement = getByText('Pressable Text');
    fireEvent.press(textElement);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should merge custom style prop with computed styles', () => {
    const customStyle = {
      backgroundColor: '#F0F0F0',
      padding: 10,
    };

    const { getByText } = render(
      <CustomText style={customStyle} fontSize={16} color="#333">
        Styled Text
      </CustomText>,
    );

    const textElement = getByText('Styled Text');
    expect(textElement.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#F0F0F0',
        padding: 10,
        fontSize: 16,
        color: '#333',
      }),
    );
  });

  it('should handle nested text content', () => {
    const { getByText } = render(
      <CustomText>
        Hello <CustomText color="#FF0000">Red</CustomText> World
      </CustomText>,
    );

    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('Red')).toBeTruthy();
    expect(getByText('World')).toBeTruthy();
  });

  it('should render with minimal props', () => {
    const { getByText } = render(<CustomText>Simple Text</CustomText>);

    const textElement = getByText('Simple Text');
    expect(textElement).toBeTruthy();
  });

  it('should handle all fontWeight variants', () => {
    const fontWeights: Array<
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
      | 'normal'
      | 'bold'
    > = [
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      'normal',
      'bold',
    ];

    fontWeights.forEach(weight => {
      const { getByText } = render(
        <CustomText fontWeight={weight}>{weight} Weight</CustomText>,
      );

      const textElement = getByText(`${weight} Weight`);
      expect(textElement.props.style).toEqual(
        expect.objectContaining({
          fontWeight: weight,
        }),
      );
    });
  });

  it('should handle all textAlign variants', () => {
    const alignments: Array<'auto' | 'left' | 'right' | 'center' | 'justify'> =
      ['auto', 'left', 'right', 'center', 'justify'];

    alignments.forEach(align => {
      const { getByText } = render(
        <CustomText textAlign={align}>{align} Aligned</CustomText>,
      );

      const textElement = getByText(`${align} Aligned`);
      expect(textElement.props.style).toEqual(
        expect.objectContaining({
          textAlign: align,
        }),
      );
    });
  });

  it('should handle all ellipsizeMode variants', () => {
    const ellipsizeModes: Array<'head' | 'middle' | 'tail' | 'clip'> = [
      'head',
      'middle',
      'tail',
      'clip',
    ];

    ellipsizeModes.forEach(mode => {
      const { getByText } = render(
        <CustomText numberOfLines={1} ellipsizeMode={mode}>
          This text will be ellipsized with {mode} mode
        </CustomText>,
      );

      const textElement = getByText(/This text will be ellipsized/);
      expect(textElement.props.ellipsizeMode).toBe(mode);
    });
  });

  it('should prioritize custom style over computed styles', () => {
    const customStyle = {
      fontSize: 30, // Should override the fontSize prop
      color: '#00FF00', // Should override the color prop
    };

    const { getByText } = render(
      <CustomText style={customStyle} fontSize={16} color="#FF0000">
        Override Test
      </CustomText>,
    );

    const textElement = getByText('Override Test');
    const computedStyle = textElement.props.style;

    // Custom style should come last and override
    expect(computedStyle.fontSize).toBe(30);
    expect(computedStyle.color).toBe('#00FF00');
  });

  it('should render empty children gracefully', () => {
    const { getByTestId } = render(
      <CustomText testID="empty-text">{''}</CustomText>,
    );

    expect(getByTestId('empty-text')).toBeTruthy();
  });

  it('should handle React nodes as children', () => {
    const { getByText, getByTestId } = render(
      <CustomText>
        Text with{' '}
        <CustomText testID="nested-text" color="#FF0000">
          nested component
        </CustomText>
      </CustomText>,
    );

    expect(getByText('Text with')).toBeTruthy();
    expect(getByTestId('nested-text')).toBeTruthy();
    expect(getByText('nested component')).toBeTruthy();
  });
});
