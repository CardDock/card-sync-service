import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';
import { MediaController } from '../../../../../context/card/infrastructure/http/media.controller';
import { GetCardImageUseCase } from '../../../../../context/card/application/use-cases/get-card-image.use-case';

jest.mock('fs', () => {
  const { Readable } = require('stream');
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    createReadStream: jest.fn(() => {
      const stream = new Readable({
        read() {
          this.push(Buffer.from('fake-image-data'));
          this.push(null);
        },
      });
      return stream;
    }),
  };
});

const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

describe('MediaController', () => {
  const buildUseCaseMock = () => ({
    execute: jest.fn(),
  });

  const createController = (useCase: ReturnType<typeof buildUseCaseMock>) =>
    new MediaController(
      useCase as unknown as GetCardImageUseCase,
      buildLoggerMock(),
    );

  it('returns a StreamableFile when image is found', async () => {
    const useCase = buildUseCaseMock();
    useCase.execute.mockResolvedValue({ filePath: '/some/path.jpg' });

    const controller = createController(useCase);
    const res = { set: jest.fn() };

    const result = await controller.getCardImage(
      '46986414',
      undefined,
      res as any,
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      cardId: '46986414',
      variant: undefined,
    });
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    });
    expect(result).toBeDefined();
  });

  it('passes variant to use case', async () => {
    const useCase = buildUseCaseMock();
    useCase.execute.mockResolvedValue({ filePath: '/some/path.jpg' });

    const controller = createController(useCase);
    const res = { set: jest.fn() };

    await controller.getCardImage('46986414', 'small', res as any);

    expect(useCase.execute).toHaveBeenCalledWith({
      cardId: '46986414',
      variant: 'small',
    });
  });

  it('throws NotFoundException when image is not found', async () => {
    const useCase = buildUseCaseMock();
    useCase.execute.mockResolvedValue(null);

    const controller = createController(useCase);
    const res = { set: jest.fn() };

    let raisedError: unknown;

    try {
      await controller.getCardImage('99999999', undefined, res as any);
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      'Image not found for card 99999999',
    );
  });
});
