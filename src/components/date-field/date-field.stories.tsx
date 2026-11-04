import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	CALENDAR_COPY,
	DATE_PLACEHOLDER,
	FIELD_ARG_TYPES,
	FIELD_COPY,
	isWeekend,
	requirednessFrom,
	STORY_LOCALE,
	UNAVAILABLE_LABEL,
} from "../../lib/forms/story-copy";
import {
	DateField,
	type DateFieldProps,
} from "./date-field";

type DateFieldStoryArgs = Omit<
	DateFieldProps,
	"requiredness" | "isDisabled" | "disabledLabel"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		weekendsUnavailable: boolean;
	}>;

const LABEL = "Date";

const ControlledDateField = ({
	requiredness,
	weekendsUnavailable,
	...args
}: DateFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<DateField
			{...args}
			disabledLabel={
				weekendsUnavailable ? UNAVAILABLE_LABEL : undefined
			}
			isDisabled={
				weekendsUnavailable ? isWeekend : undefined
			}
			onValueChange={next => {
				args.onValueChange(next);
				setValue(next);
			}}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledDateField key={id} {...args} />
	),
	args: {
		label: LABEL,
		placeholder: DATE_PLACEHOLDER,
		weekendsUnavailable: false,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		copy: FIELD_COPY,
		calendarCopy: CALENDAR_COPY,
		locale: STORY_LOCALE,
		value: undefined,
		onValueChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"placeholder",
				"weekendsUnavailable",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
				"pending",
			],
		},
	},
} satisfies Meta<DateFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
