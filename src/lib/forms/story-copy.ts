// English copy and controls the form-control stories share. Stories only: kept
// out of `src/index.ts`, the declarations build and the published package.
import type { ArgTypes } from "@storybook/react-native";
import { Temporal } from "temporal-polyfill";

import type { FieldCopy } from "../../components/field/field";
import type { FileInputCopy } from "../../components/file-input/file-input";
import type { CalendarCopy } from "../../components/month-calendar/month-calendar";
import type { PasswordStrengthCopy } from "../../components/password-strength/password-strength";
import type { RatingLabel } from "../../components/rating-input/rating-input";
import type { CounterLabel } from "../../components/text-input/text-input";
import { today } from "../dates/month";
import type {
	Requiredness,
	RequirednessVariant,
} from "./field-state";
import type { Option } from "./option";

export const STORY_LOCALE = "en-US";

const SATURDAY = 6;

export const FIELD_COPY: FieldCopy = {
	optional: "optional",
	labelOptional: ({ label }) => `${label}, optional`,
	labelRequired: ({ label }) => `${label}, required`,
	labelInvalid: ({ label, error }) => `${label}, ${error}`,
};

export const CALENDAR_COPY: CalendarCopy = {
	previousMonthLabel: "Previous month",
	nextMonthLabel: "Next month",
	errorMessage: "The days could not be loaded.",
	slowMessage: "Updating the days…",
	retryLabel: "Try again",
};

export const UNAVAILABLE_LABEL = "unavailable";

/**
 * Whether a day, as `YYYY-MM-DD`, falls on a Saturday or a Sunday.
 *
 * @example
 *   isWeekend("2026-11-07"); // true
 */
export const isWeekend = (day: string): boolean =>
	Temporal.PlainDate.from(day).dayOfWeek >= SATURDAY;

export const FILE_COPY: FileInputCopy = {
	unnamed: "Unnamed file",
	permissionDenied:
		"Allow access to your files in Settings to add one.",
	failed: "The file could not be added. Try again.",
	removeLabel: ({ file }) => `Remove ${file}`,
};

export const PASSWORD_STRENGTH_COPY: PasswordStrengthCopy =
	{
		label: "Password strength",
		none: "Enter a password",
		veryWeak: "Very weak",
		weak: "Weak",
		fair: "Fair",
		strong: "Strong",
		veryStrong: "Very strong",
	};

export const COUNTER_LABEL: CounterLabel = ({
	length,
	max,
}) => `${length} / ${max}`;

export const RATING_LABEL: RatingLabel = ({ count }) =>
	count === 1 ? "1 star" : `${count} stars`;

export const UNRATED_LABEL = "Not rated";
export const CLEAR_LABEL = "Clear";
export const SWITCH_ON_LABEL = "On";
export const SWITCH_OFF_LABEL = "Off";
export const INCREMENT_LABEL = "Increase";
export const DECREMENT_LABEL = "Decrease";
export const SHOW_PASSWORD_LABEL = "Show password";
export const HIDE_PASSWORD_LABEL = "Hide password";
export const CHOOSE_FILE_LABEL = "Choose a file";
export const DATE_PLACEHOLDER = "Pick a date";
export const TIME_PLACEHOLDER_MINUTES = "hh:mm";
export const TIME_PLACEHOLDER_SECONDS = "hh:mm:ss";

/** A day `days` after today in `zone`, as `YYYY-MM-DD`. */
export const dayFromToday = (
	days: number,
	zone: string,
): string => today(zone).add({ days }).toString();

/** The controls every field story offers beside its own: requiredness, description and errors. */
export const FIELD_ARG_TYPES: ArgTypes = {
	requiredness: {
		control: "radio",
		options: ["unstated", "required", "optional"],
	},
	description: { control: "text" },
	errors: { control: "text" },
};

/**
 * The requiredness a field takes for the choice its story's control holds.
 *
 * @example
 *   requirednessFrom("unstated"); // undefined
 */
export const requirednessFrom = (
	choice: RequirednessVariant,
): Requiredness | undefined =>
	choice === "unstated" ? undefined : choice;

/**
 * The options with the last one made unavailable, when `unavailable` is set.
 *
 * @example
 *   withLastUnavailable(OPTIONS, true); // the last option has `disabled: true`
 */
export const withLastUnavailable = (
	options: readonly Option<string>[],
	unavailable: boolean,
): readonly Option<string>[] =>
	options.map((option, index) =>
		unavailable && index === options.length - 1
			? { ...option, disabled: true }
			: option,
	);
