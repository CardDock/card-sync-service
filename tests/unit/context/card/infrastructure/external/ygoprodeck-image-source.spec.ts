import { YgoProDeckImageSourceAdapter } from '../../../../../../src/context/card/infrastructure/external/ygoprodeck-image-source';
import { CardDomainProcessError } from '../../../../../../src/context/card/domain/errors';
import { CardImageVariant } from '../../../../../../src/context/card/domain/value-objects/card-image-variant.value-object';
import { buildLoggerMock } from '../../../../../helpers';

const buildImageBuffer = (): Buffer =>
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

const buildImageResponse = (buffer: Buffer, status = 200): Response =>
  new Response(new Uint8Array(buffer), {
    status,
    headers: { 'Content-Type': 'image/jpeg' },
  });

describe('YgoProDeckImageSourceAdapter', () => {
  let fetchSpy: jest.Spied<typeof global.fetch>;

  beforeAll(() => {
    process.env.YGOPRODECK_IMAGE_BASE_URL = 'https://example.com/images';
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('returns buffer on successful fetch', async () => {
    const imageBuffer = buildImageBuffer();
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(imageBuffer, 200));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());
    const result = await source.fetchImage(
      '46986414',
      CardImageVariant.create('normal'),
    );

    expect(result).toEqual(imageBuffer);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/images/cards/46986414.jpg',
      expect.objectContaining({
        headers: { Accept: 'image/jpeg,image/*,*/*' },
      }),
    );
  });

  it('returns null on 404', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(Buffer.alloc(0), 404));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());
    const result = await source.fetchImage(
      '99999999',
      CardImageVariant.create('normal'),
    );

    expect(result).toBeNull();
  });

  it('throws CardDomainProcessError on 500', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(Buffer.alloc(0), 500));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());

    await expect(
      source.fetchImage('46986414', CardImageVariant.create('normal')),
    ).rejects.toThrow(CardDomainProcessError);
  });

  it('throws CardDomainProcessError on non-OK non-404 status', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(Buffer.alloc(0), 403));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());

    let raisedError: unknown;
    try {
      await source.fetchImage('46986414', CardImageVariant.create('normal'));
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

  it('uses correct URL for normal variant', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(buildImageBuffer(), 200));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());
    await source.fetchImage('46986414', CardImageVariant.create('normal'));

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/images/cards/46986414.jpg',
      expect.any(Object),
    );
  });

  it('uses correct URL for small variant', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(buildImageBuffer(), 200));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());
    await source.fetchImage('46986414', CardImageVariant.create('small'));

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/images/cards_small/46986414.jpg',
      expect.any(Object),
    );
  });

  it('uses correct URL for cropped variant', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(buildImageResponse(buildImageBuffer(), 200));

    const source = new YgoProDeckImageSourceAdapter(buildLoggerMock());
    await source.fetchImage('46986414', CardImageVariant.create('cropped'));

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/images/cards_cropped/46986414.jpg',
      expect.any(Object),
    );
  });
});
