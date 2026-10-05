import { Injectable } from '@nestjs/common';
import { CardTraderUnavailableError } from '../application/errors/card-sets.errors';
import { CardTraderMarketplaceSourcePort } from '../application/ports/card-trader-marketplace-source.port';

@Injectable()
export class CardTraderMarketplaceHttpAdapter implements CardTraderMarketplaceSourcePort {
  private readonly baseUrl =
    process.env.CARDTRADER_API_BASE_URL ?? 'https://api.cardtrader.com/api/v2';
  private readonly apiToken = process.env.CARDTRADER_API_TOKEN?.trim();

  async findMarketplaceProducts(blueprintId: number): Promise<unknown> {
    if (!this.apiToken) {
      throw new CardTraderUnavailableError(
        'CARDTRADER_API_TOKEN is not configured',
      );
    }

    const url = new URL(
      `${this.baseUrl.replace(/\/$/, '')}/marketplace/products`,
    );
    url.searchParams.set('blueprint_id', String(blueprintId));

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });
    } catch (error) {
      throw new CardTraderUnavailableError(
        `CardTrader request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      throw new CardTraderUnavailableError(
        `CardTrader returned ${response.status} ${response.statusText}`,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new CardTraderUnavailableError(
        `CardTrader returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
