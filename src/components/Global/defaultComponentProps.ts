import type { App, Component } from 'vue';

import { defineAsyncComponent, defineComponent, h } from 'vue';

import { appDefaultSettings } from '@/settings';

type AttrMap = Record<string, unknown>;

const Select = defineAsyncComponent(() => import('antdv-next/dist/select/index'));
const DatePicker = defineAsyncComponent(() => import('antdv-next/dist/date-picker/index'));
const DateRangePicker = defineAsyncComponent(() =>
  import('antdv-next/dist/date-picker/index').then((module) => module.DateRangePicker),
);

const withAllowClearDefault = (
  name: string,
  component: Component,
  getDefaultAllowClear: () => boolean,
) => {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => {
        const props = attrs as AttrMap;
        const allowClear = props.allowClear ?? getDefaultAllowClear();

        return h(component, { ...props, allowClear }, slots);
      };
    },
  });
};

const SelectWithDefaults = withAllowClearDefault(
  'ASelectWithDefaults',
  Select,
  () => appDefaultSettings.select.allowClear,
);

const DatePickerWithDefaults = withAllowClearDefault(
  'ADatePickerWithDefaults',
  DatePicker,
  () => appDefaultSettings.datePicker.allowClear,
);

const RangePickerWithDefaults = withAllowClearDefault(
  'ARangePickerWithDefaults',
  DateRangePicker,
  () => appDefaultSettings.datePicker.allowClear,
);

export const registerDefaultComponentProps = (app: App) => {
  app.component('ASelect', SelectWithDefaults);
  app.component('ADatePicker', DatePickerWithDefaults);
  app.component('ARangePicker', RangePickerWithDefaults);
};
