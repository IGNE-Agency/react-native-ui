import CalendarIcon from "@material-design-icons/svg/outlined/calendar_today.svg";
import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import {
	Text as NativeText,
	View,
	type TextStyle,
} from "react-native";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";
import { Temporal } from "temporal-polyfill";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import { formatDay } from "../../lib/dates/month";
import { fieldVariants } from "../../lib/forms/field-state";
import { timing } from "../../lib/motion/motion";
import { Field } from "../field/field";
import {
	fieldControlVariants,
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { Icon } from "../icon/icon";
import {
	MonthCalendar,
	type MonthCalendarProps,
} from "../month-calendar/month-calendar";

/**
 * What a `DateInput.Root` takes: a month calendar's props, plus the name its
 * trigger announces when no field names it.
 */
type DateInputCalendarProps = Omit<
	MonthCalendarProps,
	"testID"
>;

type DateInputRootProps = DateInputCalendarProps &
	Readonly<{
		label?: string;
		children: ReactNode;
	}>;

type DateInputContextValue = Readonly<{
	calendar: DateInputCalendarProps;
	label: string | undefined;
	formatted: string | undefined;
	open: boolean;
	mounted: boolean;
	reveal: SharedValue<number>;
	toggle: () => void;
}>;

type TriggerProps = Readonly<{
	/** What the pill shows while no date is chosen, such as "Pick a date". */
	placeholder: string;
	testID?: string;
}>;

type CalendarPartProps = Readonly<{
	/** Handed to the month calendar, which names its own parts from it as `MonthCalendar` does. */
	testID?: string;
}>;

const DateInputContext = createContext<
	DateInputContextValue | undefined
>(undefined);

const useDateInput = (): DateInputContextValue => {
	const value = useContext(DateInputContext);
	if (value === undefined) {
		throw new Error(
			"A date input part must be rendered inside DateInput.Root",
		);
	}
	return value;
};

const VALUE_FORMAT: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	year: "numeric",
};

const Root = ({
	label,
	children,
	...calendar
}: DateInputRootProps): ReactNode => {
	const { value } = calendar;
	const { theme } = useUnistyles();
	const [phase, setPhase] = useState<
		"closed" | "open" | "closing"
	>("closed");
	const open = phase === "open";
	const reveal = useSharedValue(0);
	const settle = timing(
		theme.motion.medium,
		theme.motion.standard,
	);
	const toggle = () => {
		if (open) {
			setPhase("closing");
			reveal.set(
				withTiming(0, settle, finished => {
					if (finished) {
						runOnJS(setPhase)("closed");
					}
				}),
			);
			return;
		}
		setPhase("open");
		reveal.set(withTiming(1, settle));
	};
	return (
		<DateInputContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				calendar,
				label,
				formatted:
					value === undefined
						? undefined
						: formatDay(
								Temporal.PlainDate.from(value),
								VALUE_FORMAT,
								calendar.locale,
							),
				open,
				mounted: phase !== "closed",
				reveal,
				toggle,
			}}>
			{children}
		</DateInputContext.Provider>
	);
};

const Trigger = ({
	placeholder,
	testID,
}: TriggerProps): ReactNode => {
	const { formatted, label, open, toggle } = useDateInput();
	const field = Field.useOptionalControl();
	const target = Field.useFocusTarget({ kind: "control" });
	const { theme } = useUnistyles();
	const state = field?.state ?? fieldVariants({});
	styles.useVariants({
		...state,
		focused: state.focused || open,
		filled: formatted !== undefined,
	});
	const shown = formatted ?? placeholder;
	const name = field?.accessibilityLabel ?? label;
	const pill = (
		<Field.Trigger
			press={{
				accessibilityHint: field?.accessibilityHint,
				accessibilityLabel: name ?? shown,
				accessibilityRole: "button",
				accessibilityState: {
					disabled: state.disabled,
					expanded: open,
				},
				accessibilityValue:
					name === undefined ? undefined : { text: shown },
				accessible: true,
				disabled: state.disabled || state.readonly,
				onPress: toggle,
				ref: target,
				testID,
			}}
			style={styles.pill}>
			<Field.Inlay end="leading">
				<Icon.Root
					color={
						state.disabled
							? theme.color.disabled.fg
							: theme.color.textMuted
					}
					svg={CalendarIcon}
				/>
			</Field.Inlay>
			<NativeText aria-hidden style={styles.value}>
				{shown}
			</NativeText>
			{field === undefined ? null : <Field.Pending />}
		</Field.Trigger>
	);
	return field === undefined ? (
		pill
	) : (
		<FieldControl {...field.accessibility}>
			{pill}
		</FieldControl>
	);
};

const DateCalendar = ({
	testID,
}: CalendarPartProps): ReactNode => {
	const { calendar, mounted, reveal } = useDateInput();
	const field = Field.useOptionalControl();
	const height = useSharedValue(0);
	const drawn = useAnimatedStyle(() => ({
		height: reveal.get() * height.get(),
		opacity: reveal.get(),
	}));
	if (
		!mounted ||
		field?.state.disabled === true ||
		field?.state.readonly === true
	) {
		return null;
	}
	return (
		<Animated.View style={[styles.drawer, drawn]}>
			<View
				onLayout={event => {
					height.set(event.nativeEvent.layout.height);
				}}
				style={styles.sheet}>
				<MonthCalendar {...calendar} testID={testID} />
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create(theme => ({
	pill: {
		...fieldGroup(theme),
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	value: {
		...theme.font.body.medium,
		color: theme.color.text,
		flexShrink: 1,
		paddingHorizontal: theme.unit[8],
		paddingVertical: theme.unit[4],
		variants: {
			...fieldControlVariants(theme),
			filled: {
				true: {} satisfies TextStyle,
				false: {
					color: theme.color.textPlaceholder,
				} satisfies TextStyle,
			},
		},
	},
	drawer: {
		marginHorizontal: -theme.unit[4],
		overflow: "hidden",
	},
	sheet: {
		left: theme.unit[4],
		paddingTop: theme.unit[4],
		position: "absolute",
		right: theme.unit[4],
		top: 0,
	},
}));

type DateInputNamespace = Readonly<{
	Root: typeof Root;
	Trigger: typeof Trigger;
	Calendar: typeof DateCalendar;
}>;

/**
 * One date as a filled pill that opens a month calendar inline beneath it,
 * standing alone or inside a `Field.Root`. `Trigger` is the pill and toggles
 * the calendar; `Calendar` is drawn where it is placed while open.
 *
 * @example
 *   <DateInput.Root
 *   	copy={calendarCopy}
 *   	isDisabled={day => !open.has(day)}
 *   	label={m.visit_date()}
 *   	locale={getLocale()}
 *   	month={month}
 *   	onChange={setDay}
 *   	onMonthChange={setMonth}
 *   	onRetry={retry}
 *   	status={status}
 *   	value={day}>
 *   	<DateInput.Trigger placeholder={m.date_placeholder()} />
 *   	<DateInput.Calendar />
 *   </DateInput.Root>
 */
export const DateInput: DateInputNamespace = {
	Root,
	Trigger,
	Calendar: DateCalendar,
};
