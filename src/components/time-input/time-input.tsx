import ClockIcon from "@material-design-icons/svg/outlined/schedule.svg";
import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { TextInput as RNTextInput } from "react-native";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";
import { Temporal } from "temporal-polyfill";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import { useTimeZone } from "../../lib/dates/time-zone";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { Field, type FieldCopy } from "../field/field";
import {
	fieldControl,
	fieldControlVariants,
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { useFieldFocus } from "../field/use-field-focus";
import { Icon } from "../icon/icon";

/** How far down a time input goes: to the minute, or to the second. */
export type TimePrecision = "minutes" | "seconds";

/**
 * What a `TimeInput.Root` takes: the field's own state and the instant whose
 * time of day it edits, in the zone of the nearest `TimeZoneProvider`.
 */
export type TimeInputRootProps = Omit<
	FieldState,
	"filled" | "focused"
> &
	Readonly<{
		label: string;
		copy: FieldCopy;
		/** What the empty control shows, spelling out the precision, such as "hh:mm". */
		placeholder: string;
		description?: string;
		errors?: unknown;
		handle?: FieldHandle;
		precision?: TimePrecision;
		value: Date | undefined;
		onValueChange: (value: Date) => void;
		testID?: string;
		children: ReactNode;
	}>;

type InputProps = Readonly<{ testID?: string }>;

type TimeInputContextValue = Readonly<{
	digits: string;
	placeholder: string;
	precision: TimePrecision;
	type: (digits: string) => void;
}>;

const TimeInputContext = createContext<
	TimeInputContextValue | undefined
>(undefined);

const useTimeInput = (): TimeInputContextValue => {
	const value = useContext(TimeInputContext);
	if (value === undefined) {
		throw new Error(
			"A time input part must be rendered inside TimeInput.Root",
		);
	}
	return value;
};

const pad = (part: number): string =>
	String(part).padStart(2, "0");

/**
 * How many digits a precision spells: four for `hh:mm`, six for `hh:mm:ss`.
 *
 * @example
 *   timeLength("seconds"); // 6
 */
export const timeLength = (
	precision: TimePrecision,
): number => (precision === "seconds" ? 6 : 4);

const zoned = (
	instant: Date,
	zone: string,
): Temporal.ZonedDateTime =>
	Temporal.Instant.fromEpochMilliseconds(
		instant.getTime(),
	).toZonedDateTimeISO(zone);

/**
 * An instant's time of day in `zone` as bare digits, empty where there is no instant.
 *
 * @example
 *   timeDigits(new Date("2026-01-01T08:30:00Z"), "minutes", "Europe/Amsterdam"); // "0930"
 */
export const timeDigits = (
	value: Date | undefined,
	precision: TimePrecision,
	zone: string,
): string => {
	if (value === undefined) {
		return "";
	}
	const time = zoned(value, zone);
	const seconds =
		precision === "seconds" ? pad(time.second) : "";
	return `${pad(time.hour)}${pad(time.minute)}${seconds}`;
};

/**
 * Bare digits shown as a time, with a colon after each pair typed so far.
 *
 * @example
 *   maskTime("093"); // "09:3"
 */
export const maskTime = (digits: string): string =>
	(digits.match(/\d{1,2}/g) ?? []).join(":");

/**
 * The instant a complete set of digits names in `zone`, on the day the base
 * instant falls there, or `undefined` where they are short or out of range.
 *
 * @example
 *   timeAt("0930", "minutes", new Date("2026-01-01T12:00:00Z"), "Europe/Amsterdam"); // 2026-01-01T08:30:00Z
 */
export const timeAt = (
	digits: string,
	precision: TimePrecision,
	base: Date,
	zone: string,
): Date | undefined => {
	if (digits.length !== timeLength(precision)) {
		return undefined;
	}
	const hours = Number(digits.slice(0, 2));
	const minutes = Number(digits.slice(2, 4));
	const seconds =
		precision === "seconds"
			? Number(digits.slice(4, 6))
			: 0;
	if (hours > 23 || minutes > 59 || seconds > 59) {
		return undefined;
	}
	return new Date(
		zoned(base, zone).with({
			hour: hours,
			minute: minutes,
			second: seconds,
			millisecond: 0,
			microsecond: 0,
			nanosecond: 0,
		}).epochMilliseconds,
	);
};

const Root = ({
	children,
	precision = "minutes",
	placeholder,
	value,
	onValueChange,
	...field
}: TimeInputRootProps): ReactNode => {
	const zone = useTimeZone();
	const [entry, setEntry] = useState({
		digits: timeDigits(value, precision, zone),
		shown: value,
	});
	if (entry.shown !== value) {
		setEntry({
			digits: timeDigits(value, precision, zone),
			shown: value,
		});
	}
	return (
		<TimeInputContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				digits: entry.digits,
				placeholder,
				precision,
				type: typed => {
					setEntry({ digits: typed, shown: value });
					const next = timeAt(
						typed,
						precision,
						value ?? new Date(),
						zone,
					);
					if (next !== undefined) {
						onValueChange(next);
					}
				},
			}}>
			<Field.Root {...field} filled={entry.digits !== ""}>
				{children}
			</Field.Root>
		</TimeInputContext.Provider>
	);
};

const Input = ({ testID }: InputProps): ReactNode => {
	const { digits, placeholder, precision, type } =
		useTimeInput();
	const {
		accessibility,
		accessibilityHint,
		accessibilityLabel,
		setControl,
		state,
	} = Field.useControl();
	const { theme } = useUnistyles();
	const focus = useFieldFocus();
	styles.useVariants({ ...state, focused: focus.focused });
	const length = timeLength(precision);
	return (
		<FieldControl {...accessibility}>
			<Field.Group style={styles.box}>
				<RNTextInput
					{...focus.handlers}
					accessibilityHint={accessibilityHint}
					accessibilityLabel={accessibilityLabel}
					aria-disabled={state.disabled}
					editable={!state.disabled && !state.readonly}
					keyboardType="number-pad"
					maxLength={length + length / 2 - 1}
					onChangeText={typed =>
						type(typed.replace(/\D/g, "").slice(0, length))
					}
					placeholder={placeholder}
					placeholderTextColor={theme.color.textPlaceholder}
					ref={setControl}
					selectionColor={theme.color.focusRing}
					style={styles.input}
					testID={testID}
					value={maskTime(digits)}
				/>
				<Field.Pending />
				<Field.Inlay end="trailing">
					<Icon.Root
						color={
							state.disabled
								? theme.color.disabled.fg
								: theme.color.textMuted
						}
						svg={ClockIcon}
					/>
				</Field.Inlay>
			</Field.Group>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	box: {
		...fieldGroup(theme),
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	input: {
		...fieldControl(theme),
		variants: { ...fieldControlVariants(theme) },
	},
}));

type TimeInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Input: typeof Input;
}>;

/**
 * The parts of a field that holds one time of day, typed rather than picked:
 * digits go in bare and the colons are drawn in, so `hh:mm` and `hh:mm:ss` are
 * the same control at two precisions. Its value is a `Date`, whose date half the
 * input leaves alone.
 *
 * @example
 *   <TimeInput.Root
 *   	copy={fieldCopy}
 *   	label={m.booking_starts_at()}
 *   	onValueChange={setStartsAt}
 *   	placeholder={m.time_mask_seconds()}
 *   	precision="seconds"
 *   	value={startsAt}>
 *   	<TimeInput.Label />
 *   	<TimeInput.Input />
 *   	<TimeInput.Error />
 *   </TimeInput.Root>
 */
export const TimeInput: TimeInputNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Input,
};
