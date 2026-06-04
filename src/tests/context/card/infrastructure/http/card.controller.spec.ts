import { NotFoundException } from '@nestjs/common';
import { CardController } from '../../../../../context/card/infrastructure/http/card.controller';
import { FindOrSyncCardByExternalIdUseCase } from '../../../../../context/card/application/use-cases/find-or-sync-card-by-external-id.use-case';
import { Card } from '../../../../../context/card/domain/entities/card.entity';

describe('CardController', () => {
  const requestedExternalId = '23771716';

  const buildCard = (): Card =>
    Card.create({
      id: 'f00df00d-4a6b-4f2a-9cb9-ccf33a71f0f1',
      externalId: requestedExternalId,
      name: 'Elemental HERO Neos',
      typeline: ['Warrior', 'Normal'],
      type: 'Normal Monster',
      humanReadableCardType: 'Normal Monster',
      frameType: 'normal',
      desc: 'A hero from another world.',
      race: 'Warrior',
      atk: 2500,
      def: 2000,
      level: 7,
      scale: null,
      linkval: null,
      linkmarkers: [],
      attribute: 'LIGHT',
      rawData: {
        id: 23771716,
        name: 'Elemental HERO Neos',
      },
    });

  const buildUseCaseMock = () => ({
    execute: jest.fn(),
  });

  it('returns card primitives when externalId 23771716 exists', async () => {
    const card = buildCard();
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(card);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
    );

    const result = await controller.findByExternalId(requestedExternalId);

    expect(useCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(useCaseMock.execute).toHaveBeenCalledWith({
      externalId: requestedExternalId,
    });
    expect(result).toMatchObject({
      externalId: requestedExternalId,
      name: 'Elemental HERO Neos',
    });
  });

  it('throws NotFoundException when card does not exist', async () => {
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(null);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
    );

    let raisedError: unknown;

    try {
      await controller.findByExternalId(requestedExternalId);
    } catch (error) {
      raisedError = error;
    }

    expect(raisedError).toBeInstanceOf(NotFoundException);
    expect((raisedError as Error).message).toBe(
      `Card with externalId ${requestedExternalId} was not found`,
    );
  });

  it('forwards the route param externalId to the use case unchanged', async () => {
    const card = buildCard();
    const useCaseMock = buildUseCaseMock();
    useCaseMock.execute.mockResolvedValue(card);

    const controller = new CardController(
      useCaseMock as unknown as FindOrSyncCardByExternalIdUseCase,
    );

    await controller.findByExternalId('23771716');

    expect(useCaseMock.execute).toHaveBeenLastCalledWith({
      externalId: '23771716',
    });
  });
});
