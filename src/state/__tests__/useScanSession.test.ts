import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useScanSession } from '@/state/useScanSession';

jest.mock('@/api/lotScanClient', () => ({
  createScan: jest.fn(),
  getScan: jest.fn(),
  updateItem: jest.fn(),
  bulkUpdateItems: jest.fn(),
  confirmScan: jest.fn(),
  discardScan: jest.fn(),
  LotScanApiError: class LotScanApiError extends Error {
    status: number;
    constructor(statusArg: number, message: string) {
      super(message);
      this.status = statusArg;
    }
  },
}));

import * as client from '@/api/lotScanClient';

const session = {
  sessionId: 'sess-1',
  status: 'in_review' as const,
  errorMessage: null,
  items: [
    { itemId: 'a', state: 'pending' as const, suggestedTitle: 'A', suggestedPlatform: null, suggestedVariant: null, suggestedPrice: null, confidence: null, finalCatalogGameId: null, finalTitle: null, finalPlatform: null, finalVariant: null, finalPrice: null, manuallyEntered: false },
    { itemId: 'b', state: 'corrected' as const, suggestedTitle: 'B', suggestedPlatform: null, suggestedVariant: null, suggestedPrice: null, confidence: null, finalCatalogGameId: null, finalTitle: 'B', finalPlatform: null, finalVariant: null, finalPrice: 5, manuallyEntered: false },
  ],
};

describe('useScanSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts a scan and loads the resulting session', async () => {
    (client.createScan as jest.Mock).mockResolvedValue({ sessionId: 'sess-1', status: 'processing' });
    (client.getScan as jest.Mock).mockResolvedValue({ ...session, status: 'in_review' });

    const { result } = await renderHook(() => useScanSession());
    await act(async () => {
      await result.current.startScan({ uri: 'file://x.jpg', type: 'image/jpeg', name: 'x.jpg' });
    });

    await waitFor(() => expect(result.current.session?.sessionId).toBe('sess-1'));
    expect(client.createScan).toHaveBeenCalledTimes(1);
  });

  // Documents the deliberate design: the client doesn't try to guess which items are
  // bulk-eligible -- it sends every item id and trusts the server-side scoping rule
  // (contracts/lot-scan-api.md) to leave corrected/excluded items untouched.
  it('bulkSetState sends every item id, including already-corrected ones', async () => {
    (client.createScan as jest.Mock).mockResolvedValue({ sessionId: 'sess-1', status: 'processing' });
    (client.getScan as jest.Mock).mockResolvedValue(session);
    (client.bulkUpdateItems as jest.Mock).mockResolvedValue(session.items);

    const { result } = await renderHook(() => useScanSession());
    await act(async () => {
      await result.current.startScan({ uri: 'file://x.jpg', type: 'image/jpeg', name: 'x.jpg' });
    });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      await result.current.bulkSetState('accepted');
    });

    expect(client.bulkUpdateItems).toHaveBeenCalledWith('sess-1', ['a', 'b'], 'accepted');
  });

  it('surfaces a failed session as an error instead of polling forever', async () => {
    (client.createScan as jest.Mock).mockResolvedValue({ sessionId: 'sess-1', status: 'processing' });
    (client.getScan as jest.Mock).mockResolvedValue({
      sessionId: 'sess-1',
      status: 'failed',
      errorMessage: 'AI vision call timed out.',
      items: [],
    });

    const { result } = await renderHook(() => useScanSession());
    await act(async () => {
      await result.current.startScan({ uri: 'file://x.jpg', type: 'image/jpeg', name: 'x.jpg' });
    });

    await waitFor(() => expect(result.current.error).toBe('AI vision call timed out.'));
  });
});
