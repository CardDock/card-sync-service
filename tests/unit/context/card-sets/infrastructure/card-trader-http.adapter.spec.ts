import { CardTraderHttpAdapter } from '../../../../../src/context/card-sets/infrastructure/card-trader-http.adapter';
import { CardTraderUnavailableError } from '../../../../../src/context/card-sets/application/errors/card-sets.errors';

describe('CardTraderHttpAdapter', () => {
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

  it('encodes the card name and game in the request URL', async () => {
    const response = [{ blueprint_id: 10 }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(response),
    });

    await expect(
      new CardTraderHttpAdapter().findBlueprints('A Case for K9 & Friends'),
    ).resolves.toEqual(response);

    const [requestUrl, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ];
    expect(requestUrl.toString()).toBe(
      'https://api.cardtrader.com/api/v2/blueprints?name=A+Case+for+K9+%26+Friends&game=yugioh',
    );
    expect(options.headers).toEqual({ Authorization: 'Bearer test-token' });
  });

  it('turns HTTP failures into CardTrader errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(
      new CardTraderHttpAdapter().findBlueprints('A Case for K9'),
    ).rejects.toBeInstanceOf(CardTraderUnavailableError);
  });
});
