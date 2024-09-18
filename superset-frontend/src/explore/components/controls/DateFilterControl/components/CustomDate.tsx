import React, { useState, useEffect } from 'react';
import { t } from '@superset-ui/core';
import { Radio } from 'src/components/Radio';
import moment, { Moment } from 'moment'; // Import moment for date handling
import {
  CUSTOM_DATE,
  DATE_FILTER_TEST_KEY,
} from 'src/explore/components/controls/DateFilterControl/utils';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import { DatePicker } from 'antd';
import './CustomDate.css';

const { RangePicker } = DatePicker;
const otherUsecase = [
  'Last day',
  'Last week',
  'Last month',
  'Last quarter',
  'Last year',
  'previous calendar week',
  'previous calendar month',
  'previous calendar year',
];
export function CustomDate(props: FrameComponentProps) {
  const [selectedRange, setSelectedRange] = useState<
    [Moment | null, Moment | null]
  >([null, null]);
  const [pickerType, setPickerType] = useState<'date' | 'month'>('date');
  const [typeSelect, setTypeSelect] = useState('');
  useEffect(() => {
    // Parse props.value into start and end dates
    const check = otherUsecase.some(d => d === props.value);
    if (props.value === 'No filter' || check) {
      setTypeSelect('CurrentMonth');
      setSelectedRange([moment().startOf('month'), moment()]);
      return;
    }

    const [startDateStr, endDateStr] = props.value.split(' : ');
    const startDate = moment(startDateStr, 'YYYY-MM-DD');
    const endDate = moment(endDateStr, 'YYYY-MM-DD');
    // setSelectedRange([startDate,end])
    // Calculate the difference in months
    const diffInDays = endDate.diff(startDate, 'days') + 1;
    const startMonth = startDate.clone().startOf('month');
    let diffInMonths = endDate.diff(startMonth, 'months', true); // Use true for fractional months
    if (startDate.isBefore(startMonth)) {
      diffInMonths -= 1; // Adjust if the start date is before the start of the month
    } // Adjust if the start date is before the start of the month

    // Determine the typeSelect based on the calculated values
    if (
      diffInMonths >= 11.95 &&
      startDate.month() === 6 &&
      endDate.month() === 5
    ) {
      setTypeSelect('LastFinancialYear');
      setPickerType('month');
      setSelectedRange([
        moment(startDate).month(6).startOf('month'), // July of last year
        moment(endDate).month(5).endOf('month'), // June of current year
      ]);
    } else if (
      diffInMonths >= 0.95 &&
      diffInMonths < 1.05 &&
      diffInDays >= 28 &&
      diffInDays <= 31
    ) {
      setTypeSelect('LastMonth');
      setPickerType('date');
      setSelectedRange([startDate, endDate]);
    } else if (
      diffInMonths >= 5.95 &&
      diffInMonths < 6.05 &&
      diffInDays >= 180 &&
      diffInDays <= 186
    ) {
      setTypeSelect('Last6Month');
      setPickerType('month');
      setSelectedRange([
        moment(startDate).startOf('month'),
        moment(endDate).endOf('month'),
      ]);
    } else if (
      diffInMonths >= 11.95 &&
      diffInMonths < 12.05 &&
      diffInDays >= 365 &&
      diffInDays <= 366
    ) {
      setTypeSelect('Last12Month');
      setPickerType('month');
      setSelectedRange([
        moment(startDate).startOf('month'),
        moment(endDate).endOf('month'),
      ]);
    } else if (startDate.isSame(moment().startOf('month'))) {
      setTypeSelect('CurrentMonth');
      setPickerType('date');
      setSelectedRange([startDate, endDate]);
    } else {
      setTypeSelect('CustomDate');
      setPickerType('date');
      setSelectedRange([startDate, endDate]);
    }
    // Set the selected range based on props.value
  }, []);

  useEffect(() => {
    const combineDate = `${selectedRange[0]?.format(
      'YYYY-MM-DD',
    )} : ${selectedRange[1]?.format('YYYY-MM-DD')}`;
    props.onChange(combineDate);
  }, [selectedRange]);

  const handleDateChange = (dates: [Moment | null, Moment | null]) => {
    const startDate = moment(dates?.[0], 'YYYY-MM-DD');
    const endDate = moment(dates?.[1], 'YYYY-MM-DD');
    // setSelectedRange([startDate,end])
    // Calculate the difference in months
    const diffInDays = endDate.diff(startDate, 'days') + 1;
    const startMonth = startDate.clone().startOf('month');
    let diffInMonths = endDate.diff(startMonth, 'months', true); // Use true for fractional months
    if (startDate.isBefore(startMonth)) {
      diffInMonths -= 1; // Adjust if the start date is before the start of the month
    } // Adjust if the start date is before the start of the month
    console.log(' diffInDays', pickerType);
    // Determine the typeSelect based on the calculated values
    if (
      diffInMonths >= 0.95 &&
      diffInMonths < 1.05 &&
      diffInDays >= 28 &&
      diffInDays <= 31
    ) {
      setSelectedRange(dates);
    } else if (
      diffInMonths >= 5.95 &&
      diffInMonths < 6.05 &&
      diffInDays >= 180 &&
      diffInDays <= 186
    ) {
      setSelectedRange(dates);
    } else if (
      diffInMonths >= 11.95 &&
      diffInMonths < 12.05 &&
      diffInDays >= 365 &&
      diffInDays <= 366
    ) {
      setSelectedRange(dates);
    } else if (startDate.isSame(moment().startOf('month'))) {
      setSelectedRange(dates);
    } else {
      setTypeSelect('CustomDate');
      setPickerType('date');
      setSelectedRange(dates);
    }
    // setSelectedRange(dates);
    // props.onChange(combineDate);
  };
  const handleRadioChange = (e: any) => {
    const newValue = e.target.value;
    setTypeSelect(newValue);
    // Notify parent component about the date change
    switch (newValue) {
      case 'LastMonth':
        setPickerType('date');

        setSelectedRange([
          moment().subtract(1, 'months').startOf('month'),
          moment().subtract(1, 'months').endOf('month'),
        ]);
        break;
      case 'Last6Month':
        setPickerType('month');
        setSelectedRange([
          moment().subtract(6, 'months').startOf('month'),
          moment().subtract(1, 'months').endOf('month'),
        ]);
        break;
      case 'Last12Month':
        setPickerType('month');
        setSelectedRange([
          moment().subtract(12, 'months').startOf('month'),
          moment().subtract(1, 'months').endOf('month'),
        ]);
        break;
      case 'LastFinancialYear':
        setPickerType('month');
        setSelectedRange([
          moment().subtract(1, 'years').month(6).startOf('month'),
          moment().month(5).endOf('month'),
        ]);
        // Implement your logic for the financial month
        break;
      case 'CurrentMonth':
        setPickerType('date');
        setSelectedRange([moment().startOf('month'), moment()]);
        break;
      case 'CustomDate':
        setPickerType('date');
        setSelectedRange([null, null]); // Let the user pick a custom range
        break;
      default:
        setSelectedRange([null, null]); // Default to no range selected
    }
    // props.onChange(newValue);
  };

  return (
    <div className="custom-date-container">
      <div
        className="section-title"
        data-test={DATE_FILTER_TEST_KEY.commonFrame}
      >
        {t('Configure Time Range: Last...')}
      </div>
      <div className="row-container">
        <div className="radio-container">
          <Radio.Group value={typeSelect} onChange={handleRadioChange}>
            {CUSTOM_DATE.map(({ value, label }: any) => (
              <Radio key={value} value={value} className="horizontal-radio">
                {label}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        <div className="date-picker-container">
          <RangePicker
            value={selectedRange}
            allowClear={false}
            onChange={handleDateChange}
            format="YYYY-MM-DD" // Format as year and month or year, month, day
            picker="date" // Switch between date and month pickers based on the selected option
          />
        </div>
      </div>
    </div>
  );
}
