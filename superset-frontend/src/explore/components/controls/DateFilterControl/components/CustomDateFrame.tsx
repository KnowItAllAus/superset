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
import { styled, css } from '@apache-superset/core/theme';
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
  SIMPLE_DATE_FORMAT,
} from '../utils/constants';

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

export function computePresetRange(preset: CustomDatePreset): [Dayjs, Dayjs] {
  const today = extendedDayjs().utc();
  switch (preset) {
    case 'CurrentMonth':
      return [today.startOf('month'), today];
    case 'LastMonth': {
      const lastMonth = today.subtract(1, 'month');
      return [lastMonth.startOf('month'), lastMonth.endOf('month')];
    }
    case 'Last6Month':
      return [today.subtract(6, 'months').startOf('month'), today];
    case 'Last12Month':
      return [today.subtract(12, 'months').startOf('month'), today];
    case 'LastFinancialYear': {
      const currentYear = today.year();
      const currentMonth = today.month(); // 0-indexed, so June = 5, July = 6
      // If in July (6) or later, last FY ended June of this year
      // If before July, last FY ended June of last year
      const fyEndYear = currentMonth >= 6 ? currentYear : currentYear - 1;
      return [
        extendedDayjs.utc(`${fyEndYear - 1}-07-01`, SIMPLE_DATE_FORMAT),
        extendedDayjs.utc(`${fyEndYear}-06-30`, SIMPLE_DATE_FORMAT),
      ];
    }
    case 'CustomDate':
    default:
      return [today.subtract(7, 'days').startOf('day'), today];
  }
}

export function detectPreset(value: string): CustomDatePreset {
  const parts = value.split(' : ');
  if (parts.length !== 2) return 'CustomDate';

  const start = extendedDayjs(parts[0].trim(), SIMPLE_DATE_FORMAT, true);
  const end = extendedDayjs(parts[1].trim(), SIMPLE_DATE_FORMAT, true);
  if (!start.isValid() || !end.isValid()) return 'CustomDate';

  const presets: CustomDatePreset[] = [
    'CurrentMonth',
    'LastMonth',
    'Last6Month',
    'Last12Month',
    'LastFinancialYear',
  ];

  for (const preset of presets) {
    const [expectedStart, expectedEnd] = computePresetRange(preset);
    if (
      start.format(SIMPLE_DATE_FORMAT) ===
        expectedStart.format(SIMPLE_DATE_FORMAT) &&
      end.format(SIMPLE_DATE_FORMAT) ===
        expectedEnd.format(SIMPLE_DATE_FORMAT)
    ) {
      return preset;
    }
  }
  return 'CustomDate';
}

function formatRange(start: Dayjs, end: Dayjs): string {
  return `${start.format(SIMPLE_DATE_FORMAT)} : ${end.format(SIMPLE_DATE_FORMAT)}`;
}

export function CustomDateFrame({ value, onChange }: FrameComponentProps) {
  const datePickerLocale = useLocale();

  const selectedPreset = useMemo(() => detectPreset(value), [value]);

  const rangePickerValue = useMemo((): [Dayjs, Dayjs] | null => {
    const parts = value.split(' : ');
    if (parts.length !== 2) return null;
    const start = extendedDayjs(parts[0].trim(), SIMPLE_DATE_FORMAT, true);
    const end = extendedDayjs(parts[1].trim(), SIMPLE_DATE_FORMAT, true);
    if (!start.isValid() || !end.isValid()) return null;
    return [start, end];
  }, [value]);

  function onPresetChange(e: RadioChangeEvent) {
    const preset = e.target.value as CustomDatePreset;
    if (preset === 'CustomDate') {
      // Keep the current range or set a default
      if (!rangePickerValue) {
        const [start, end] = computePresetRange('CustomDate');
        onChange(formatRange(start, end));
      }
      return;
    }
    const [start, end] = computePresetRange(preset);
    onChange(formatRange(start, end));
  }

  function onRangePickerChange(
    dates: [Dayjs | null, Dayjs | null] | null,
  ) {
    if (dates?.[0] && dates?.[1]) {
      onChange(formatRange(dates[0], dates[1]));
    }
  }

  if (datePickerLocale === null) {
    return <Loading position="inline-centered" />;
  }

  return (
    <AntdThemeProvider locale={datePickerLocale}>
      <Container data-test="custom-date-frame">
        <div className="section-title">
          {t('Configure custom date range')}
        </div>
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
