import { YgoProDeckExternalCardSource } from '../../../../../context/card/infrastructure/external/ygoprodeck-card-source';
import { CardDomainProcessError } from '../../../../../context/card/domain/errors';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

const buildResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('YgoProDeckExternalCardSource', () => {
  let fetchSpy: jest.Spied<typeof global.fetch>;

  beforeAll(() => {
    process.env.YGOPRODECK_API_BASE_URL = 'https://example.com/api/cardinfo.php';
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('findById', () => {
    it('returns mapped card data on 200', async () => {
      const apiResponse = {
        data: [
          {
            id: 46986414,
            name: 'Dark Magician',
            type: 'Normal Monster',
            frameType: 'normal',
            desc: 'The ultimate wizard.',
            race: 'Spellcaster',
            atk: 2500,
            def: 2100,
            level: 7,
            attribute: 'DARK',
          },
        ],
      };
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse(apiResponse, 200));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findById('46986414');

      expect(result).not.toBeNull();
      expect(result!.card).toMatchObject({
        id: '46986414',
        name: 'Dark Magician',
        attribute: 'DARK',
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/api/cardinfo.php?id=46986414',
        }),
        expect.objectContaining({ headers: { Accept: 'application/json' } }),
      );
    });

    it('returns null on 404', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 404));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findById('99999999');

      expect(result).toBeNull();
    });

    it('throws CardDomainProcessError on 500', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 500));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());

      await expect(source.findById('46986414')).rejects.toThrow(
        CardDomainProcessError,
      );
    });

    it('throws CardDomainProcessError on non-OK non-404 status', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 403));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());

      let raisedError: unknown;
      try {
        await source.findById('46986414');
      } catch (error) {
        raisedError = error;
      }

      expect(raisedError).toBeInstanceOf(CardDomainProcessError);
      const processError = raisedError as CardDomainProcessError;
      expect(processError.context).toMatchObject({
        httpStatus: 403,
        provider: 'YGOPRODeck',
      });
    });
  });

  describe('findByName', () => {
    it('returns mapped card data on 200', async () => {
      const apiResponse = {
        data: [
          {
            id: 46986414,
            name: 'Dark Magician',
            type: 'Normal Monster',
            frameType: 'normal',
            desc: 'The ultimate wizard.',
            race: 'Spellcaster',
            atk: 2500,
            def: 2100,
            level: 7,
            attribute: 'DARK',
          },
        ],
      };
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse(apiResponse, 200));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findByName('Dark Magician');

      expect(result).toHaveLength(1);
      expect(result[0].card.name).toBe('Dark Magician');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/api/cardinfo.php?fname=Dark+Magician',
        }),
        expect.any(Object),
      );
    });

    it('returns empty array on 404', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 404));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findByName('NonExistentCard');

      expect(result).toEqual([]);
    });

    it('returns empty array on 400', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 400));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findByName('??');

      expect(result).toEqual([]);
    });

    it('throws CardDomainProcessError on 500', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({}, 500));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());

      await expect(source.findByName('Dark Magician')).rejects.toThrow(
        CardDomainProcessError,
      );
    });

    it('returns empty array when API response has no data', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ data: [] }, 200));

      const source = new YgoProDeckExternalCardSource(buildLoggerMock());
      const result = await source.findByName('EmptyResult');

      expect(result).toEqual([]);
    });
  });
});
