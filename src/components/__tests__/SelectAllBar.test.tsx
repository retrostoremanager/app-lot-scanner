import { fireEvent, render, screen } from '@testing-library/react-native';

import { SelectAllBar } from '@/components/SelectAllBar';

describe('SelectAllBar', () => {
  it('shows the accepted/total count', async () => {
    await render(<SelectAllBar acceptedCount={2} totalCount={5} onSelectAll={jest.fn()} onDeselectAll={jest.fn()} />);
    expect(screen.getByText('2 / 5 accepted')).toBeTruthy();
  });

  it('calls onSelectAll when "Select all" is pressed', async () => {
    const onSelectAll = jest.fn();
    await render(<SelectAllBar acceptedCount={0} totalCount={5} onSelectAll={onSelectAll} onDeselectAll={jest.fn()} />);
    fireEvent.press(screen.getByText('Select all'));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDeselectAll when "Deselect all" is pressed', async () => {
    const onDeselectAll = jest.fn();
    await render(<SelectAllBar acceptedCount={5} totalCount={5} onSelectAll={jest.fn()} onDeselectAll={onDeselectAll} />);
    fireEvent.press(screen.getByText('Deselect all'));
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });
});
