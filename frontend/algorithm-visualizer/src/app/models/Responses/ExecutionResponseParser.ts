import type { ExecutionLogEntry } from '../ExecutionLogEntry';
import {
  EXECUTION_ERROR_CODES,
  EXECUTION_STAGES
} from './ExecuteCodeResponse';
import type { ExecuteCodeResponse } from './ExecuteCodeResponse';

export function parseExecutionResponse(value: unknown): ExecuteCodeResponse {
  if (!isRecord(value)
      || value['schema'] !== 'av.execution.v1'
      || typeof value['success'] !== 'boolean'
      || !isOneOf(value['stage'], EXECUTION_STAGES)
      || typeof value['stdout'] !== 'string'
      || typeof value['stderr'] !== 'string'
      || !(value['exitCode'] === null || isInteger(value['exitCode']))
      || !isInteger(value['durationMs'])
      || value['durationMs'] < 0
      || !Array.isArray(value['events'])
      || !value['events'].every(isExecutionEvent)
      || !isExecutionError(value['error'])) {
    throw new Error('The execution response does not match av.execution.v1.');
  }

  if (value['success'] !== (value['stage'] === 'completed')
      || value['success'] !== (value['error'] === null)) {
    throw new Error('The execution response has inconsistent status fields.');
  }

  return value as unknown as ExecuteCodeResponse;
}

function isExecutionEvent(value: unknown): value is ExecutionLogEntry {
  return isRecord(value)
    && value['schema'] === 'av.event.v1'
    && isInteger(value['time'])
    && value['time'] > 0
    && (value['type'] === 'array' || value['type'] === 'map')
    && typeof value['path'] === 'string'
    && value['path'].length > 0
    && (value['op'] === 'init' || value['op'] === 'snapshot')
    && isInteger(value['line'])
    && value['line'] > 0
    && Object.prototype.hasOwnProperty.call(value, 'value');
}

function isExecutionError(value: unknown): value is ExecuteCodeResponse['error'] {
  return value === null || (isRecord(value)
    && isOneOf(value['code'], EXECUTION_ERROR_CODES)
    && typeof value['message'] === 'string'
    && value['message'].length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}
