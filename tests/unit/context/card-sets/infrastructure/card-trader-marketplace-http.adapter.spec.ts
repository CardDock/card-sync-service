import { CardTraderMarketplaceHttpAdapter } from '../../../../../src/context/card-sets/infrastructure/card-trader-marketplace-http.adapter';
import { CardTraderUnavailableError } from '../../../../../src/context/card-sets/application/errors/card-sets.errors';

describe('CardTraderMarketplaceHttpAdapter', () => {
  const originalFetch = global.fetch;
  const originalToken = process.env.CARDTRADER_API_TOKEN;

  beforeEach(() => {
    process.env.CARDTRADER_API_TOKEN = 'test-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalToken === undefined) {
      delete process.env.CARDTRADER_API_TOKEN;
    } else {
      process.env.CARDTRADER_API_TOKEN = originalToken;
    }
    jest.restoreAllMocks();
  });

  it('requests marketplace products by blueprint id', async () => {
    const response = [{ price: 1 }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(response),
    });

    await expect(
      new CardTraderMarketplaceHttpAdapter().findMarketplaceProducts(380475),
    ).resolves.toEqual(response);

    const [requestUrl, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ];
    expect(requestUrl.toString()).toBe(
      'https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=380475',
    );
    expect(options.headers).toEqual({
      Authorization: 'Bearer test-token',
    });
  });

  it('turns HTTP failures into CardTrader errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(
      new CardTraderMarketplaceHttpAdapter().findMarketplaceProducts(380475),
    ).rejects.toBeInstanceOf(CardTraderUnavailableError);
  });
});
