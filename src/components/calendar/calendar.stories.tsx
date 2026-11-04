import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import { currentMonth, today } from "../../lib/dates/month";
import { useTimeZone } from "../../lib/dates/time-zone";
import {
	CALENDAR_COPY,
	dayFromToday,
	isWeekend,
	STORY_LOCALE,
	UNAVAILABLE_LABEL,
} from "../../lib/forms/story-copy";
import {
	MonthCalendar,
	type MonthCalendarProps,
} from "../month-calendar/month-calendar";
import type { CalendarMarker } from "./calendar";

type MonthCalendarStoryArgs = Omit<
	MonthCalendarProps,
	| "isDisabled"
	| "disabledLabel"
	| "markers"
	| "min"
	| "month"
> &
	Readonly<{
		pastUnavailable: boolean;
		weekendsUnavailable: boolean;
		marked: boolean;
	}>;

const MARKED_DAYS = [3, 4, 10];

const STRUCK_DAYS = [2, 9];

const markersIn = (
	zone: string,
): readonly CalendarMarker[] => {
	const marked = new Set(
		MARKED_DAYS.map(days => dayFromToday(days, zone)),
	);
	const struck = new Set(
		STRUCK_DAYS.map(days => dayFromToday(days, zone)),
	);
	return [
		{
			id: "marked",
			kind: "dot",
			label: "marked",
			marks: day => marked.has(day),
		},
		{
			id: "struck",
			kind: "strike",
			label: "struck through",
			marks: day => struck.has(day),
		},
	];
};

const ControlledMonthCalendar = ({
	pastUnavailable,
	weekendsUnavailable,
	marked,
	...args
}: MonthCalendarStoryArgs): ReactNode => {
	const zone = useTimeZone();
	const [value, setValue] = useState(args.value);
	const [month, setMonth] = useState(() =>
		currentMonth(zone),
	);
	return (
		<MonthCalendar
			{...args}
			disabledLabel={
				weekendsUnavailable ? UNAVAILABLE_LABEL : undefined
			}
			isDisabled={
				weekendsUnavailable ? isWeekend : undefined
			}
			markers={marked ? markersIn(zone) : undefined}
			min={
				pastUnavailable ? today(zone).toString() : undefined
			}
			month={month}
			onChange={next => {
				args.onChange(next);
				setValue(next);
			}}
			onMonthChange={next => {
				args.onMonthChange(next);
				setMonth(next);
			}}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledMonthCalendar key={id} {...args} />
	),
	args: {
		status: "ready",
		pastUnavailable: true,
		weekendsUnavailable: false,
		marked: false,
		locale: STORY_LOCALE,
		copy: CALENDAR_COPY,
		value: undefined,
		onChange: () => {},
		onMonthChange: () => {},
		onRetry: () => {},
	},
	argTypes: {
		status: {
			control: "radio",
			options: ["ready", "loading", "updating", "error"],
		},
	},
	parameters: {
		controls: {
			include: [
				"status",
				"pastUnavailable",
				"weekendsUnavailable",
				"marked",
			],
		},
	},
} satisfies Meta<MonthCalendarStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
