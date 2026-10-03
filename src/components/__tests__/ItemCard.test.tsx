import { fireEvent, render, screen } from '@testing-library/react-native';

import { ItemCard } from '@/components/ItemCard';
import type { ScannedItem } from '@/api/types';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const baseItem: ScannedItem = {
  itemId: 'item-1',
  state: 'pending',
  suggestedTitle: 'Chrono Trigger',
  suggestedPlatform: 'SNES',
  suggestedVariant: null,
  suggestedPrice: 25,
  confidence: 0.9,
  finalCatalogGameId: null,
  finalTitle: null,
  finalPlatform: null,
  finalVariant: null,
  finalPrice: null,
  manuallyEntered: false,
};

describe('ItemCard', () => {
  it('shows the suggested title', async () => {
    await render(<ItemCard item={baseItem} sessionId="s1" onPatch={jest.fn()} />);
    expect(screen.getByText('Chrono Trigger')).toBeTruthy();
  });

  it('shows a low-confidence badge below the default threshold', async () => {
    await render(<ItemCard item={{ ...baseItem, confidence: 0.55 }} sessionId="s1" onPatch={jest.fn()} />);
    expect(screen.getByText('needs a look')).toBeTruthy();
  });

  it('does not show a low-confidence badge at or above the threshold', async () => {
    await render(<ItemCard item={{ ...baseItem, confidence: 0.9 }} sessionId="s1" onPatch={jest.fn()} />);
    expect(screen.queryByText('needs a look')).toBeNull();
  });

  it('patches state=accepted when Accept is pressed', async () => {
    const onPatch = jest.fn();
    await render(<ItemCard item={baseItem} sessionId="s1" onPatch={onPatch} />);
    fireEvent.press(screen.getByText('Accept'));
    expect(onPatch).toHaveBeenCalledWith('item-1', { state: 'accepted' });
  });

  it('patches state=excluded when Exclude is pressed', async () => {
    const onPatch = jest.fn();
    await render(<ItemCard item={baseItem} sessionId="s1" onPatch={onPatch} />);
    fireEvent.press(screen.getByText('Exclude'));
    expect(onPatch).toHaveBeenCalledWith('item-1', { state: 'excluded' });
  });

  it('offers "Include again" instead of Accept/Correct/Exclude once excluded', async () => {
    await render(<ItemCard item={{ ...baseItem, state: 'excluded' }} sessionId="s1" onPatch={jest.fn()} />);
    expect(screen.getByText('Include again')).toBeTruthy();
    expect(screen.queryByText('Accept')).toBeNull();
  });
});
