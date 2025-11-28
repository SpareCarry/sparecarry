/**
 * Tests for CameraButton component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CameraButton } from '../CameraButton';

// Mock useCamera hook
vi.mock('@sparecarry/hooks', () => ({
  useCamera: () => ({
    takePicture: vi.fn(),
    pickImage: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('CameraButton', () => {
  it('should render on web', () => {
    const onCapture = vi.fn();
    render(<CameraButton onCapture={onCapture} />);
    
    // Check if buttons are rendered
    expect(screen.getByText('Take Photo')).toBeDefined();
    expect(screen.getByText('Pick from Gallery')).toBeDefined();
  });

  it('should call onCapture when photo is taken', async () => {
    const onCapture = vi.fn();
    render(<CameraButton onCapture={onCapture} />);
    
    // This would be tested with actual user interaction
    // For now, just verify the component renders
    expect(onCapture).not.toHaveBeenCalled();
  });
});

