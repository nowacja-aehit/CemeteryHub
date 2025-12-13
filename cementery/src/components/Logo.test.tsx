import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';
import { describe, it, expect } from 'vitest';

describe('Logo', () => {
  it('renders the logo text correctly', () => {
    render(<Logo />);
    expect(screen.getByText('CemeteryHub')).toBeInTheDocument();
    expect(screen.getByText('System Zarządzania Cmentarzem')).toBeInTheDocument();
  });

  it('renders the logo image', () => {
    render(<Logo />);
    const img = screen.getByAltText('CemeteryHub Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon_white.png');
  });
});
