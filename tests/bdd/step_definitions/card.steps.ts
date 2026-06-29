import 'dotenv/config';
import {
  BeforeAll,
  AfterAll,
  When,
  Then,
  setWorldConstructor,
  World,
} from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app/app.module';
import { Logger } from '../../../src/context/card/domain/ports/logger.port';
import request from 'supertest';

let app: INestApplication;

const silentLogger = {
  info: (): void => {},
  warn: (): void => {},
  error: (): void => {},
  debug: (): void => {},
};

export class CardWorld extends World {
  response: request.Response;

  constructor(options) {
    super(options);
  }
}

setWorldConstructor(CardWorld);

BeforeAll(async function () {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(Logger)
    .useValue(silentLogger)
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});

AfterAll(async function () {
  if (app) {
    await app.close();
  }
});

When(/^I send a GET request to "([^"]+)"$/, async function (path: string) {
  this.response = await request(app.getHttpServer()).get(path);
});

Then(/^the response status should be (\d+)$/, function (status: number) {
  if (this.response.status !== status) {
    throw new Error(
      `Expected status ${status} but got ${this.response.status}. Body: ${JSON.stringify(this.response.body)}`,
    );
  }
});

Then(
  /^the response body should match card "([^"]+)"$/,
  function (cardName: string) {
    const expected = {
      id: '10000',
      name: cardName,
      type: 'Effect Monster',
      humanReadableCardType: 'Effect Monster',
      race: 'Dragon',
      attribute: 'DARK',
      atk: null,
      def: null,
      level: 10,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (this.response.body[key] !== value) {
        throw new Error(
          `Expected body.${key} to be ${JSON.stringify(value)} but got ${JSON.stringify(this.response.body[key])}`,
        );
      }
    }
  },
);

Then(/^the response should not include rawData$/, function () {
  if ('rawData' in this.response.body) {
    throw new Error('Response should not include rawData');
  }
});

Then(
  /^the response body should include a name matching "(\d+)"$/,
  function (templateId: string) {
    const name = this.response.body.name;
    if (typeof name !== 'string' || !name.includes(templateId)) {
      throw new Error(
        `Expected name to include "${templateId}" but got "${name}"`,
      );
    }
  },
);

Then(
  /^the response body name should be "([^"]+)"$/,
  function (expectedName: string) {
    if (this.response.body.name !== expectedName) {
      throw new Error(
        `Expected name to be "${expectedName}" but got "${this.response.body.name}"`,
      );
    }
  },
);

Then(/^the response should contain paginated results$/, function () {
  const body = this.response.body;
  if (typeof body.total !== 'number') {
    throw new Error(
      `Expected total to be a number but got ${JSON.stringify(body.total)}`,
    );
  }
  if (body.page !== 1) {
    throw new Error(`Expected page to be 1 but got ${body.page}`);
  }
  if (typeof body.limit !== 'number') {
    throw new Error(
      `Expected limit to be a number but got ${JSON.stringify(body.limit)}`,
    );
  }
  if (!Array.isArray(body.items)) {
    throw new Error(
      `Expected items to be an array but got ${JSON.stringify(body.items)}`,
    );
  }
});

Then(/^at least one result should be returned$/, function () {
  const items = this.response.body.items;
  if (!items || items.length < 1) {
    throw new Error(`Expected at least one result but got none`);
  }
});

Then(/^each result should have an id and name$/, function () {
  const items = this.response.body.items;
  for (const item of items) {
    if (typeof item.id !== 'string') {
      throw new Error(
        `Expected item.id to be a string but got ${JSON.stringify(item.id)}`,
      );
    }
    if (typeof item.name !== 'string') {
      throw new Error(
        `Expected item.name to be a string but got ${JSON.stringify(item.name)}`,
      );
    }
  }
});

Then(/^results should not include rawData$/, function () {
  const items = this.response.body.items;
  for (const item of items) {
    if ('rawData' in item) {
      throw new Error('Result items should not include rawData');
    }
  }
});

Then(
  /^a result with id "(\d+)" should have name "([^"]+)"$/,
  function (id: string, expectedName: string) {
    const item = this.response.body.items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`No result found with id "${id}"`);
    }
    if (item.name !== expectedName) {
      throw new Error(
        `Expected item with id "${id}" to have name "${expectedName}" but got "${item.name}"`,
      );
    }
  },
);

Then(
  /^each result should have "([^"]+)" in its name$/,
  function (substring: string) {
    const items = this.response.body.items;
    for (const item of items) {
      if (typeof item.name !== 'string' || !item.name.includes(substring)) {
        throw new Error(
          `Expected item name to include "${substring}" but got "${item.name}"`,
        );
      }
    }
  },
);

Then(/^each result should have an id, name, and type$/, function () {
  const items = this.response.body.items;
  for (const item of items) {
    if (typeof item.id !== 'string') {
      throw new Error(
        `Expected item.id to be a string but got ${JSON.stringify(item.id)}`,
      );
    }
    if (typeof item.name !== 'string') {
      throw new Error(
        `Expected item.name to be a string but got ${JSON.stringify(item.name)}`,
      );
    }
    if (typeof item.type !== 'string') {
      throw new Error(
        `Expected item.type to be a string but got ${JSON.stringify(item.type)}`,
      );
    }
  }
});

Then(
  /^the response should have (\d+) items, total (\d+), page (\d+), limit (\d+)$/,
  function (itemsCount: number, total: number, page: number, limit: number) {
    const body = this.response.body;
    if (!Array.isArray(body.items) || body.items.length !== itemsCount) {
      throw new Error(
        `Expected items.length to be ${itemsCount} but got ${body.items?.length}`,
      );
    }
    if (body.total !== total) {
      throw new Error(`Expected total to be ${total} but got ${body.total}`);
    }
    if (body.page !== page) {
      throw new Error(`Expected page to be ${page} but got ${body.page}`);
    }
    if (body.limit !== limit) {
      throw new Error(`Expected limit to be ${limit} but got ${body.limit}`);
    }
  },
);

Then(/^at most (\d+) results should be returned$/, function (max: number) {
  const items = this.response.body.items;
  if (items.length > max) {
    throw new Error(`Expected at most ${max} results but got ${items.length}`);
  }
});

Then(
  /^all returned cards should have type "([^"]+)" and attribute "([^"]+)"$/,
  function (expectedType: string, expectedAttribute: string) {
    const items = this.response.body.items;
    for (const item of items) {
      if (item.type !== expectedType) {
        throw new Error(
          `Expected type to be "${expectedType}" but got "${item.type}"`,
        );
      }
      if (item.attribute !== expectedAttribute) {
        throw new Error(
          `Expected attribute to be "${expectedAttribute}" but got "${item.attribute}"`,
        );
      }
    }
  },
);

Then(
  /^all returned cards should have race "([^"]+)"$/,
  function (expectedRace: string) {
    const items = this.response.body.items;
    for (const item of items) {
      if (item.race !== expectedRace) {
        throw new Error(
          `Expected race to be "${expectedRace}" but got "${item.race}"`,
        );
      }
    }
  },
);

Then(/^the response limit should be (\d+)$/, function (expectedLimit: number) {
  if (this.response.body.limit !== expectedLimit) {
    throw new Error(
      `Expected limit to be ${expectedLimit} but got ${this.response.body.limit}`,
    );
  }
});

Then(/^at least one print should be returned$/, function () {
  const body = this.response.body;
  if (!Array.isArray(body) || body.length < 1) {
    throw new Error(`Expected at least one print but got none`);
  }
});

Then(
  /^each print should have id, cardSetId, cardSetName, setCode, and rarity$/,
  function () {
    const items = this.response.body;
    for (const item of items) {
      if (typeof item.id !== 'string')
        throw new Error(`Expected print.id to be a string`);
      if (typeof item.cardSetId !== 'string')
        throw new Error(`Expected print.cardSetId to be a string`);
      if (typeof item.cardSetName !== 'string')
        throw new Error(`Expected print.cardSetName to be a string`);
      if (typeof item.setCode !== 'string')
        throw new Error(`Expected print.setCode to be a string`);
      if (typeof item.rarity !== 'string')
        throw new Error(`Expected print.rarity to be a string`);
    }
  },
);

Then(/^at least one artwork should be returned$/, function () {
  const body = this.response.body;
  if (!Array.isArray(body) || body.length < 1) {
    throw new Error(`Expected at least one artwork but got none`);
  }
});

Then(
  /^each artwork should have an imageUrl containing "([^"]+)"$/,
  function (substring: string) {
    const items = this.response.body;
    for (const item of items) {
      if (typeof item.id !== 'string')
        throw new Error(`Expected artwork.id to be a string`);
      if (
        typeof item.imageUrl !== 'string' ||
        !item.imageUrl.includes(substring)
      ) {
        throw new Error(
          `Expected artwork.imageUrl to contain "${substring}" but got "${item.imageUrl}"`,
        );
      }
    }
  },
);

Then(/^at least one card set should be returned$/, function () {
  const body = this.response.body;
  if (!Array.isArray(body) || body.length < 1) {
    throw new Error(`Expected at least one card set but got none`);
  }
});

Then(/^each card set should have an id and name$/, function () {
  const items = this.response.body;
  for (const item of items) {
    if (typeof item.id !== 'string')
      throw new Error(`Expected cardSet.id to be a string`);
    if (typeof item.name !== 'string')
      throw new Error(`Expected cardSet.name to be a string`);
  }
});
