import { Injectable } from '@nestjs/common';
import {
  CardTraderExpansion,
  CardTraderSourcePort,
} from '../application/ports/card-trader-source.port';
import { CardTraderUnavailableError } from '../application/errors/card-sets.errors';

@Injectable()
export class CardTraderHttpAdapter implements CardTraderSourcePort {
  private readonly baseUrl =
    process.env.CARDTRADER_API_BASE_URL ?? 'https://api.cardtrader.com/api/v2';
  private readonly apiToken = process.env.CARDTRADER_API_TOKEN?.trim();

  async findBlueprints(cardName: string): Promise<unknown> {
    if (!this.apiToken) {
      throw new CardTraderUnavailableError(
        'CARDTRADER_API_TOKEN is not configured',
      );
    }

    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/blueprints`);
    url.searchParams.set('name', cardName);
    url.searchParams.set('game', 'yugioh');

    let response: Response;
    try {
      response = await fetch(url, {
        headers: this.buildHeaders(),
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

  async findExpansions(): Promise<CardTraderExpansion[]> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/expansions`);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: this.buildHeaders(),
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
      const body = await response.json();
      if (!Array.isArray(body)) {
        throw new CardTraderUnavailableError(
          'CardTrader returned an invalid expansion payload',
        );
      }
      return body.map((item) => this.normalizeExpansion(item));
    } catch (error) {
      if (error instanceof CardTraderUnavailableError) {
        throw error;
      }
      throw new CardTraderUnavailableError(
        `CardTrader returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiToken) {
      headers.Authorization = `Bearer ${this.apiToken}`;
    }
    return headers;
  }

  private normalizeExpansion(item: unknown): CardTraderExpansion {
    const expansion = item as Partial<CardTraderExpansion>;
    const id = Number(expansion.id ?? 0);
    const gameId = Number(expansion.game_id ?? 0);

    if (!Number.isInteger(id) || id <= 0) {
      throw new CardTraderUnavailableError(
        'CardTrader returned an expansion without a valid id',
      );
    }

    return {
      id,
      game_id: Number.isInteger(gameId) && gameId > 0 ? gameId : 1,
      code: typeof expansion.code === 'string' ? expansion.code : '',
      name: typeof expansion.name === 'string' ? expansion.name : '',
      ...(expansion as Record<string, unknown>),
    };
  }
}
