import { CheckType } from '../../interface';

import { AnyCheckHandler } from './check-handler';
import { contentCheckHandler } from './handlers/content-check.handler';
import { fileCheckHandler } from './handlers/file-check.handler';
import { jsonCheckHandler } from './handlers/json-check.handler';
import { sizeCheckHandler } from './handlers/size-check.handler';
import { xpathCheckHandler } from './handlers/xpath-check.handler';
import { yamlCheckHandler } from './handlers/yaml-check.handler';

const CHECK_HANDLERS: readonly AnyCheckHandler[] = [
  contentCheckHandler,
  fileCheckHandler,
  jsonCheckHandler,
  sizeCheckHandler,
  xpathCheckHandler,
  yamlCheckHandler,
];

const CHECK_HANDLERS_BY_TYPE = new Map(
  CHECK_HANDLERS.map((handler) => [handler.type, handler])
);

if (CHECK_HANDLERS_BY_TYPE.size !== CHECK_HANDLERS.length) {
  throw new Error('Duplicate check handler type');
}

export function getCheckHandler(type: CheckType): AnyCheckHandler | undefined {
  return CHECK_HANDLERS_BY_TYPE.get(type);
}

export function getCheckHandlers(): readonly AnyCheckHandler[] {
  return CHECK_HANDLERS;
}
