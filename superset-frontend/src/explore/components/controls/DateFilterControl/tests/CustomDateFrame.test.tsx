/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import {
  render,
  screen,
  userEvent,
  waitForElementToBeRemoved,
} from 'spec/helpers/testing-library';
import {
  CustomDateFrame,
  detectPreset,
  parseCustomDateRange,
} from '../components/CustomDateFrame';
import { CUSTOM_DATE_PRESET_EXPRESSIONS, guessFrame } from '../utils';

const TODAY = '2026-10-26';
jest.useFakeTimers();
jest.setSystemTime(new Date(TODAY).getTime());

const concreteValue = '2026-10-01 : 2026-10-26';

const mockStore = configureStore([thunk]);
const store = mockStore({ common: { locale: 'en' } });

const renderFrame = async (value: string, onChange = jest.fn()) => {
  render(<CustomDateFrame onChange={onChange} value={value} />, { store });
  await waitForElementToBeRemoved(() => screen.queryByLabelText('Loading'));
  return onChange;
};

test('detectPreset maps each preset expression back to its preset', () => {
  Object.entries(CUSTOM_DATE_PRESET_EXPRESSIONS).forEach(
    ([preset, expression]) => {
      expect(detectPreset(expression)).toBe(preset);
    },
  );
});

test('detectPreset treats concrete dates and other values as custom date', () => {
  expect(detectPreset(concreteValue)).toBe('CustomDate');
  expect(detectPreset('No filter')).toBe('CustomDate');
  expect(detectPreset('Last week')).toBe('CustomDate');
  expect(detectPreset('')).toBe('CustomDate');
});

test('parseCustomDateRange only accepts YYYY-MM-DD : YYYY-MM-DD', () => {
  const parsed = parseCustomDateRange(concreteValue);
  expect(parsed?.[0].format('YYYY-MM-DD')).toBe('2026-10-01');
  expect(parsed?.[1].format('YYYY-MM-DD')).toBe('2026-10-26');
  expect(
    parseCustomDateRange(CUSTOM_DATE_PRESET_EXPRESSIONS.CurrentMonth),
  ).toBeNull();
  expect(parseCustomDateRange('No filter')).toBeNull();
});

test('guessFrame routes preset expressions to the CustomDate frame', () => {
  Object.values(CUSTOM_DATE_PRESET_EXPRESSIONS).forEach(expression => {
    expect(guessFrame(expression)).toBe('CustomDate');
  });
  expect(guessFrame(concreteValue)).toBe('CustomDate');
});

test('selects the matching preset and hides the picker for an expression', async () => {
  await renderFrame(CUSTOM_DATE_PRESET_EXPRESSIONS.LastMonth);
  expect(screen.getByLabelText('Last full month')).toBeChecked();
  expect(screen.getByLabelText('Custom date')).not.toBeChecked();
  expect(screen.queryByPlaceholderText('Start date')).not.toBeInTheDocument();
});

test('selects Custom date and shows the picker for a concrete range', async () => {
  await renderFrame(concreteValue);
  expect(screen.getByLabelText('Custom date')).toBeChecked();
  expect(screen.getByPlaceholderText('Start date')).toHaveValue('2026-10-01');
  expect(screen.getByPlaceholderText('End date')).toHaveValue('2026-10-26');
});

test('choosing a preset stores its rolling expression', async () => {
  const onChange = await renderFrame(concreteValue);
  await userEvent.click(screen.getByLabelText('Current month to date'));
  expect(onChange).toHaveBeenLastCalledWith(
    CUSTOM_DATE_PRESET_EXPRESSIONS.CurrentMonth,
  );
  await userEvent.click(screen.getByLabelText('Last financial year'));
  expect(onChange).toHaveBeenLastCalledWith(
    CUSTOM_DATE_PRESET_EXPRESSIONS.LastFinancialYear,
  );
});

test('choosing Custom date after a preset writes a concrete range', async () => {
  const onChange = await renderFrame(
    CUSTOM_DATE_PRESET_EXPRESSIONS.CurrentMonth,
  );
  await userEvent.click(screen.getByLabelText('Custom date'));
  expect(onChange).toHaveBeenCalledTimes(1);
  const written = onChange.mock.calls[0][0] as string;
  expect(written).toMatch(/^\d{4}-\d{2}-\d{2} : \d{4}-\d{2}-\d{2}$/);
  expect(detectPreset(written)).toBe('CustomDate');
});

test('a concrete range is never re-detected as a preset', async () => {
  // A hand-picked range that happens to equal "current month to date" must
  // stay on Custom date so the picker remains available.
  await renderFrame(concreteValue);
  expect(screen.getByLabelText('Custom date')).toBeChecked();
  expect(screen.getByLabelText('Current month to date')).not.toBeChecked();
});
