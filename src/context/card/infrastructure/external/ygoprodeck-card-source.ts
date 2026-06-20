import { Injectable } from '@nestjs/common';
import { ExternalCardSourcePort } from '../../domain/ports/external-card-source.port';
import { SyncCardWithRelatedData } from '../../domain/types/sync-card-with-related.types';
import { CardDomainProcessError } from '../../domain/errors';
import {
  mapYgoProDeckResponseToSyncCardParams,
  YgoProDeckResponse,
} from './ygoprodeck-card.mapper';

@Injectable()
export class YgoProDeckExternalCardSource implements ExternalCardSourcePort {
  private readonly baseUrl =
    process.env.YGOPRODECK_API_BASE_URL ??
    'https://db.ygoprodeck.com/api/v7/cardinfo.php';

  async findByExternalId(
    externalId: string,
  ): Promise<SyncCardWithRelatedData | null> {
    const requestUrl = new URL(this.baseUrl);
    requestUrl.searchParams.set('id', externalId);

    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new CardDomainProcessError({
        stage: 'YgoProDeckExternalCardSource.findByExternalId',
        message: `Failed to fetch card ${externalId} from external source`,
        context: {
          externalId,
          httpStatus: response.status,
          provider: 'YGOPRODeck',
        },
      });
    }

    const body = (await response.json()) as YgoProDeckResponse;

    return mapYgoProDeckResponseToSyncCardParams(body);
  }

  async findByName(name: string): Promise<SyncCardWithRelatedData[]> {
    const requestUrl = new URL(this.baseUrl);
    requestUrl.searchParams.set('fname', name);

    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404 || response.status === 400) {
      return [];
    }

    if (!response.ok) {
      throw new CardDomainProcessError({
        stage: 'YgoProDeckExternalCardSource.findByName',
        message: `Failed to search cards by name "${name}" from external source`,
        context: {
          name,
          httpStatus: response.status,
          provider: 'YGOPRODeck',
        },
      });
    }

    const body = (await response.json()) as YgoProDeckResponse;

    return body.data?.map((dto) => mapYgoProDeckResponseToSyncCardParams({ data: [dto] })).filter(Boolean) ?? [];
  }
}
