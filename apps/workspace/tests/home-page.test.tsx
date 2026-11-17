import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/v2-workspace', () => ({ ReviewDashboard: () => <p>Live runner</p> }))

import Page from '../app/page'

describe('V3 workspace homepage', () => {
  it('preserves the interactive illustration and links to live Forge workflows', () => {
    render(<Page />)
    expect(screen.getByRole('link', { name: 'Open Forge integrations' })).toHaveAttribute('href', '/atlassian')
    expect(screen.getByText(/interactive example.*not a live review/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Safe change' }))
    expect(screen.getByText('VERIFIED WITHIN SCOPE')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show test code' }))
    expect(screen.getByText(/def test_discount_boundary/)).toBeInTheDocument()
  })
})
