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
import { useMemo } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { extendedDayjs } from '@superset-ui/core/utils/dates';
import type { Dayjs } from 'dayjs';
import {
  Radio,
  RangePicker,
  AntdThemeProvider,
  Loading,
} from '@superset-ui/core/components';
import type { RadioChangeEvent } from '@superset-ui/core/components/Radio';
import { useLocale } from 'src/hooks/useLocale';
import type { FrameComponentProps, CustomDatePreset } from '../types';
import {
  CUSTOM_DATE_PRESETS,
  CUSTOM_DATE_PRESET_BY_EXPRESSION,
  CUSTOM_DATE_PRESET_EXPRESSIONS,
  SIMPLE_DATE_FORMAT,
} from '../utils/constants';

const CUSTOM_DATE_DEFAULT_DAYS = 7;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
`;

const RadioContainer = styled.div`
  flex: 1;
`;

const DatePickerContainer = styled.div`
  ${({ theme }) => css`
    .ant-picker {
      width: 100%;
      border-radius: ${theme.borderRadius}px;
    }
  `}
`;

/**
 * Resolve which radio option a time range value belongs to. Named presets are
 * stored as rolling expressions (see CUSTOM_DATE_PRESET_EXPRESSIONS); anything
 * else, including a concrete `YYYY-MM-DD : YYYY-MM-DD` range, is a custom date.
 */
export function detectPreset(value: string): CustomDatePreset {
  return CUSTOM_DATE_PRESET_BY_EXPRESSION.get(value.trim()) ?? 'CustomDate';
}

/**
 * Parse a concrete `YYYY-MM-DD : YYYY-MM-DD` range, returning null for any
 * other value (preset expressions, "No filter", legacy ranges, ...).
 */
export function parseCustomDateRange(value: string): [Dayjs, Dayjs] | null {
  const parts = value.split(' : ');
  if (parts.length !== 2) return null;
  const start = extendedDayjs(parts[0].trim(), SIMPLE_DATE_FORMAT, true);
  const end = extendedDayjs(parts[1].trim(), SIMPLE_DATE_FORMAT, true);
  if (!start.isValid() || !end.isValid()) return null;
  return [start, end];
}

export function formatCustomDateRange(start: Dayjs, end: Dayjs): string {
  return `${start.format(SIMPLE_DATE_FORMAT)} : ${end.format(SIMPLE_DATE_FORMAT)}`;
}

/** Range offered when the user first switches to a custom date. */
export function defaultCustomDateRange(): [Dayjs, Dayjs] {
  const today = extendedDayjs().startOf('day');
  return [today.subtract(CUSTOM_DATE_DEFAULT_DAYS, 'days'), today];
}

export function CustomDateFrame({ value, onChange }: FrameComponentProps) {
  const datePickerLocale = useLocale();

  const selectedPreset = useMemo(() => detectPreset(value), [value]);
  const rangePickerValue = useMemo(() => parseCustomDateRange(value), [value]);

  function onPresetChange(e: RadioChangeEvent) {
    const preset = e.target.value as CustomDatePreset;
    if (preset === 'CustomDate') {
      // Writing a concrete range is what selects "Custom date": concrete dates
      // never equal a preset expression, so the selection cannot snap back to
      // the previously chosen preset.
      const [start, end] = rangePickerValue ?? defaultCustomDateRange();
      onChange(formatCustomDateRange(start, end));
      return;
    }
    onChange(CUSTOM_DATE_PRESET_EXPRESSIONS[preset]);
  }

  function onRangePickerChange(dates: [Dayjs | null, Dayjs | null] | null) {
    if (dates?.[0] && dates?.[1]) {
      onChange(formatCustomDateRange(dates[0], dates[1]));
    }
  }

  if (datePickerLocale === null) {
    return <Loading position="inline-centered" />;
  }

  return (
    <AntdThemeProvider locale={datePickerLocale}>
      <Container data-test="custom-date-frame">
        <div className="section-title">{t('Configure custom date range')}</div>
        <RowContainer>
          <RadioContainer>
            <Radio.GroupWrapper
              options={CUSTOM_DATE_PRESETS}
              onChange={onPresetChange}
              value={selectedPreset}
              spaceConfig={{ direction: 'vertical', size: 'small' }}
            />
          </RadioContainer>
        </RowContainer>
        {selectedPreset === 'CustomDate' && (
          <DatePickerContainer>
            <RangePicker
              value={rangePickerValue}
              format={SIMPLE_DATE_FORMAT}
              onChange={onRangePickerChange}
              allowClear={false}
            />
          </DatePickerContainer>
        )}
      </Container>
    </AntdThemeProvider>
  );
}
