import ChevronLeftIcon from "@material-design-icons/svg/outlined/chevron_left.svg";
import ChevronRightIcon from "@material-design-icons/svg/outlined/chevron_right.svg";
import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import {
	AccessibilityInfo,
	Pressable,
	Text as NativeText,
	View,
} from "react-native";
import Animated, {
	LayoutAnimationConfig,
	useSharedValue,
	type SharedValue,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";
import {
	scheduleOnRN,
	scheduleOnUI,
} from "react-native-worklets";
import { Temporal } from "temporal-polyfill";

import { useLiveRegion } from "../../lib/a11y/live-region";
import {
	formatDay,
	monthGrid,
	today,
	weekStart,
} from "../../lib/dates/month";
import { useTimeZone } from "../../lib/dates/time-zone";
import { hapticTick } from "../../lib/haptics/haptics";
import { slideIn, slideOut } from "../../lib/motion/motion";
import { StateLayer } from "../../lib/state-layer/state-layer";
import { suffixed } from "../../lib/test-id/test-id";
import {
	tonePaint,
	type ToneName,
} from "../../lib/tone/tone";
import type { AsyncStatus } from "../../lib/wait/async-status";
import { Button } from "../button/button";
import { StaleContent } from "../stale-content/stale-content";

/**
 * A mark some days carry: which days, how it is drawn, and the words a screen
 * reader hears after a marked day's date, which the legend shows too.
 *
 * @example
 *   const marked: CalendarMarker = {
 *   	id: "marked",
 *   	kind: "dot",
 *   	label: m.calendar_marked(),
 *   	marks: day => events.has(day),
 *   };
 */
export type CalendarMarker = Readonly<{
	/** Names the marker for `Calendar.LegendItem`. */
	id: string;
	/** A dot under the day's number, or the number struck through. */
	kind: "dot" | "strike";
	label: string;
	/** Whether a day, as `YYYY-MM-DD`, carries the marker. */
	marks: (day: string) => boolean;
	/** The tone a dot is drawn in. */
	tone?: ToneName;
}>;

/**
 * What a `Calendar.Root` takes: the chosen day as `YYYY-MM-DD`, the shown month
 * as `YYYY-MM`, which days cannot be chosen and what is said of them, the
 * markers some days carry, and how far the shown month's days have loaded, with
 * the way to ask again. `locale` is the app's locale tag.
 */
export type CalendarProps = Readonly<{
	locale: string;
	value: string | undefined;
	onChange: (day: string) => void;
	month: string;
	onMonthChange: (month: string) => void;
	/** The first day that can be chosen, as `YYYY-MM-DD`. The month steps stop at its month. */
	min?: string;
	/** The last day that can be chosen, as `YYYY-MM-DD`. The month steps stop at its month. */
	max?: string;
	isDisabled?: (day: string) => boolean;
	/** What a screen reader hears after a day `isDisabled` holds back, and what the legend says of it. */
	disabledLabel?: string;
	markers?: readonly CalendarMarker[];
	status?: AsyncStatus;
	onRetry?: () => void;
}>;

type RootProps = CalendarProps &
	Readonly<{ testID?: string; children: ReactNode }>;

type CalendarContextValue = CalendarProps &
	Readonly<{
		shown: Temporal.PlainYearMonth;
		weeks: readonly (readonly Temporal.PlainDate[])[];
		heading: SharedValue<number>;
		status: AsyncStatus;
		canStepBack: boolean;
		canStepOn: boolean;
		step: (months: number) => void;
	}>;

type PartProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type IdProps = Readonly<{ testID?: string }>;

type StepProps = Readonly<{
	/** What the step is announced as, such as "Previous month". */
	label: string;
	testID?: string;
}>;

type StatusProps = Readonly<{
	/** What the calendar says when the month's days failed to load. */
	errorMessage: string;
	/** What the calendar says over days that are slow to update. */
	slowMessage: string;
	/** What the button that asks again says. */
	retryLabel: string;
	/** `testID` goes on the failure or on the frame of the days, `${testID}-message` on what either says and `${testID}-retry` on its retry button. */
	testID?: string;
	children: ReactNode;
}>;

type GridProps = Readonly<{
	testID?: string;
	/** The id each `Calendar.Day` the grid draws carries, handed its day as `YYYY-MM-DD`. */
	dayTestID?: (day: string) => string;
	/** Draws one day of the shown month, as `YYYY-MM-DD`. Without it, each is a `Calendar.Day`. */
	children?: (day: string) => ReactNode;
}>;

type DayProps = Readonly<{
	day: string;
	testID?: string;
}>;

type LegendProps = Readonly<{
	testID?: string;
	children?: ReactNode;
}>;

type LegendItemProps = Readonly<{ testID?: string }> &
	(
		| Readonly<{ marker: string; disabled?: undefined }>
		| Readonly<{ disabled: true; marker?: undefined }>
	);

const OUTSIDE_OPACITY = 0.4;

const FULL_DATE: Intl.DateTimeFormatOptions = {
	weekday: "long",
	day: "numeric",
	month: "long",
	year: "numeric",
};

const MONTH_TITLE: Intl.DateTimeFormatOptions = {
	month: "long",
	year: "numeric",
};

const WEEKDAY: Intl.DateTimeFormatOptions = {
	weekday: "short",
};

const SAMPLE_DAY = 12;

const CalendarContext = createContext<
	CalendarContextValue | undefined
>(undefined);

const useCalendar = (): CalendarContextValue => {
	const value = useContext(CalendarContext);
	if (value === undefined) {
		throw new Error(
			"Calendar parts must be rendered inside Calendar.Root",
		);
	}
	return value;
};

const monthTitle = (
	month: Temporal.PlainYearMonth,
	locale: string,
): string =>
	formatDay(
		month.toPlainDate({ day: 1 }),
		MONTH_TITLE,
		locale,
	);

const monthOf = (
	day: string | undefined,
): Temporal.PlainYearMonth | undefined =>
	day === undefined
		? undefined
		: Temporal.PlainDate.from(day).toPlainYearMonth();

const outOfRange = (
	day: Temporal.PlainDate,
	min: string | undefined,
	max: string | undefined,
): boolean =>
	(min !== undefined &&
		Temporal.PlainDate.compare(day, min) < 0) ||
	(max !== undefined &&
		Temporal.PlainDate.compare(day, max) > 0);

const Root = ({
	children,
	status = "ready",
	testID,
	...props
}: RootProps): ReactNode => {
	const heading = useSharedValue(1);
	const shown = Temporal.PlainYearMonth.from(props.month);
	const first = monthOf(props.min);
	const last = monthOf(props.max);
	const turn = (next: string) => {
		props.onMonthChange(next);
		AccessibilityInfo.announceForAccessibility(
			monthTitle(
				Temporal.PlainYearMonth.from(next),
				props.locale,
			),
		);
	};
	const step = (months: number) => {
		const next = shown.add({ months }).toString();
		scheduleOnUI(() => {
			heading.set(months);
			scheduleOnRN(turn, next);
		});
	};
	return (
		<CalendarContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				...props,
				status,
				shown,
				weeks: monthGrid(shown, weekStart(props.locale)),
				heading,
				canStepBack:
					first === undefined ||
					Temporal.PlainYearMonth.compare(shown, first) > 0,
				canStepOn:
					last === undefined ||
					Temporal.PlainYearMonth.compare(shown, last) < 0,
				step,
			}}>
			<LayoutAnimationConfig skipEntering skipExiting>
				<View style={styles.root} testID={testID}>
					{children}
				</View>
			</LayoutAnimationConfig>
		</CalendarContext.Provider>
	);
};

const Header = ({
	testID,
	children,
}: PartProps): ReactNode => (
	<View style={styles.header} testID={testID}>
		{children}
	</View>
);

const Title = ({ testID }: IdProps): ReactNode => {
	const { month, shown, locale, heading } = useCalendar();
	const { theme } = useUnistyles();
	return (
		<View style={styles.title} testID={testID}>
			<Animated.View
				entering={slideIn(theme.motion, heading)}
				exiting={slideOut(theme.motion, heading)}
				key={month}>
				<NativeText style={styles.monthTitle}>
					{monthTitle(shown, locale)}
				</NativeText>
			</Animated.View>
		</View>
	);
};

const Previous = ({
	label,
	testID,
}: StepProps): ReactNode => {
	const { canStepBack, step } = useCalendar();
	return (
		<Button.Root
			disabled={!canStepBack}
			iconOnly
			label={label}
			onPress={() => step(-1)}
			testID={testID}
			tier="ghost"
			tone="neutral">
			<Button.Icon svg={ChevronLeftIcon} />
		</Button.Root>
	);
};

const Next = ({ label, testID }: StepProps): ReactNode => {
	const { canStepOn, step } = useCalendar();
	return (
		<Button.Root
			disabled={!canStepOn}
			iconOnly
			label={label}
			onPress={() => step(1)}
			testID={testID}
			tier="ghost"
			tone="neutral">
			<Button.Icon svg={ChevronRightIcon} />
		</Button.Root>
	);
};

const Weekdays = ({ testID }: IdProps): ReactNode => {
	const { weeks, locale, status } = useCalendar();
	const [opening = []] = weeks;
	if (status === "error") {
		return null;
	}
	return (
		<View aria-hidden style={styles.week} testID={testID}>
			{opening.map(day => (
				<View key={day.dayOfWeek} style={styles.weekday}>
					<NativeText style={styles.weekdayName}>
						{formatDay(day, WEEKDAY, locale)}
					</NativeText>
				</View>
			))}
		</View>
	);
};

const Page = ({
	testID,
	children,
}: PartProps): ReactNode => {
	const { month, heading } = useCalendar();
	const { theme } = useUnistyles();
	return (
		<View style={styles.page} testID={testID}>
			<Animated.View
				entering={slideIn(theme.motion, heading)}
				exiting={slideOut(theme.motion, heading)}
				key={month}>
				{children}
			</Animated.View>
		</View>
	);
};

const Failure = ({
	errorMessage,
	retryLabel,
	testID,
}: Pick<
	StatusProps,
	"errorMessage" | "retryLabel" | "testID"
>): ReactNode => {
	const { onRetry } = useCalendar();
	const live = useLiveRegion(errorMessage);

	return (
		<View {...live} style={styles.failure} testID={testID}>
			<NativeText
				style={styles.failureText}
				testID={suffixed(testID, "message")}>
				{errorMessage}
			</NativeText>
			{onRetry === undefined ? null : (
				<Button.Root
					onPress={onRetry}
					testID={suffixed(testID, "retry")}
					tier="tonal">
					<Button.Label>{retryLabel}</Button.Label>
				</Button.Root>
			)}
		</View>
	);
};

const Status = ({
	errorMessage,
	slowMessage,
	retryLabel,
	testID,
	children,
}: StatusProps): ReactNode => {
	const { status, onRetry } = useCalendar();
	return status === "error" ? (
		<Failure
			errorMessage={errorMessage}
			retryLabel={retryLabel}
			testID={testID}
		/>
	) : (
		<StaleContent
			busy={status !== "ready"}
			retry={
				onRetry === undefined
					? undefined
					: { label: retryLabel, onPress: onRetry }
			}
			slowLabel={slowMessage}
			testID={testID}>
			{children}
		</StaleContent>
	);
};

const spokenDay = (
	day: Temporal.PlainDate,
	words: readonly string[],
	locale: string,
): string =>
	[formatDay(day, FULL_DATE, locale), ...words].join(", ");

const Day = ({ day, testID }: DayProps): ReactNode => {
	const {
		value,
		onChange,
		min,
		max,
		isDisabled,
		disabledLabel,
		markers = [],
		locale,
	} = useCalendar();
	const zone = useTimeZone();
	const { theme } = useUnistyles();
	const [pressed, setPressed] = useState(false);
	const date = Temporal.PlainDate.from(day);
	const held = isDisabled?.(day) ?? false;
	const disabled = held || outOfRange(date, min, max);
	const selected = value === day;
	const current = date.equals(today(zone));
	const carried = markers.filter(marker =>
		marker.marks(day),
	);
	const dots = carried.filter(
		marker => marker.kind === "dot",
	);
	const struck = carried.some(
		marker => marker.kind === "strike",
	);
	const words = [
		...(held && disabledLabel !== undefined
			? [disabledLabel]
			: []),
		...carried.map(marker => marker.label),
	];
	styles.useVariants({
		selected,
		current,
		disabled,
	});
	return (
		<Pressable
			accessibilityLabel={spokenDay(date, words, locale)}
			accessibilityRole="button"
			accessibilityState={{ selected, disabled }}
			disabled={disabled}
			onPress={() => {
				hapticTick();
				onChange(day);
			}}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			style={styles.cell}
			testID={testID}>
			<View style={styles.mark}>
				{selected ? <View style={styles.fill} /> : null}
				<StateLayer
					color={
						selected
							? theme.color.onPrimary
							: theme.color.text
					}
					pressed={pressed}
				/>
				<NativeText
					style={[
						styles.number,
						struck ? styles.struck : null,
					]}>
					{date.day}
				</NativeText>
				{dots.length === 0 ? null : (
					<View style={styles.dotSlot}>
						{dots.map(marker => (
							<View
								key={marker.id}
								style={[
									styles.dot,
									selected || disabled
										? null
										: styles.dotTone(
												marker.tone ?? "brand",
											),
								]}
							/>
						))}
					</View>
				)}
			</View>
		</Pressable>
	);
};

const Outside = ({
	day,
}: Readonly<{ day: Temporal.PlainDate }>): ReactNode => (
	<View aria-hidden style={styles.cell}>
		<NativeText style={styles.outside}>
			{day.day}
		</NativeText>
	</View>
);

const Grid = ({
	testID,
	dayTestID,
	children,
}: GridProps): ReactNode => {
	const { shown, weeks } = useCalendar();
	return (
		<View style={styles.grid} testID={testID}>
			{weeks.map(week => (
				<View
					key={week.at(0)?.toString()}
					style={styles.week}>
					{week.map(day =>
						day.month === shown.month ? (
							<View
								key={day.toString()}
								style={styles.slot}>
								{children === undefined ? (
									<Day
										day={day.toString()}
										testID={dayTestID?.(day.toString())}
									/>
								) : (
									children(day.toString())
								)}
							</View>
						) : (
							<Outside day={day} key={day.toString()} />
						),
					)}
				</View>
			))}
		</View>
	);
};

const LegendItem = (props: LegendItemProps): ReactNode => {
	const { markers = [], disabledLabel } = useCalendar();
	if (props.disabled === true) {
		return disabledLabel === undefined ? null : (
			<View style={styles.key} testID={props.testID}>
				<NativeText style={styles.disabledSample}>
					{SAMPLE_DAY}
				</NativeText>
				<NativeText style={styles.keyText}>
					{disabledLabel}
				</NativeText>
			</View>
		);
	}
	const marker = markers.find(
		candidate => candidate.id === props.marker,
	);
	if (marker === undefined) {
		return null;
	}
	return (
		<View style={styles.key} testID={props.testID}>
			{marker.kind === "strike" ? (
				<NativeText style={styles.struckSample}>
					{SAMPLE_DAY}
				</NativeText>
			) : (
				<View
					style={[
						styles.dotSample,
						styles.dotTone(marker.tone ?? "brand"),
					]}
				/>
			)}
			<NativeText style={styles.keyText}>
				{marker.label}
			</NativeText>
		</View>
	);
};

const Legend = ({
	testID,
	children,
}: LegendProps): ReactNode => {
	const {
		markers = [],
		disabledLabel,
		status,
	} = useCalendar();
	if (
		status === "error" ||
		(children === undefined &&
			markers.length === 0 &&
			disabledLabel === undefined)
	) {
		return null;
	}
	return (
		<View aria-hidden style={styles.legend} testID={testID}>
			{children ?? (
				<>
					{markers.map(marker => (
						<LegendItem
							key={marker.id}
							marker={marker.id}
						/>
					))}
					<LegendItem disabled />
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	root: { gap: theme.unit[2] },
	header: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[2],
	},
	title: { flex: 1, overflow: "hidden" },
	monthTitle: {
		...theme.font.label.mediumStrong,
		color: theme.color.text,
	},
	page: {
		marginHorizontal: -theme.unit[4],
		overflow: "hidden",
	},
	grid: {
		gap: theme.unit[2],
		paddingHorizontal: theme.unit[4],
	},
	failure: {
		alignItems: "center",
		gap: theme.unit[6],
		paddingVertical: theme.unit[12],
	},
	failureText: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
	week: { flexDirection: "row" },
	weekday: {
		alignItems: "center",
		flex: 1,
		paddingVertical: theme.unit[2],
	},
	weekdayName: {
		...theme.font.body.small,
		color: theme.color.textMuted,
		textTransform: "uppercase",
	},
	slot: { flex: 1 },
	cell: {
		alignItems: "center",
		flex: 1,
		justifyContent: "center",
		minHeight: theme.unit[22],
	},
	mark: {
		alignItems: "center",
		borderRadius: theme.radius.full,
		height: theme.unit[20],
		justifyContent: "center",
		overflow: "hidden",
		width: theme.unit[20],
	},
	fill: {
		backgroundColor: theme.color.primary,
		bottom: 0,
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
		variants: {
			selected: { true: {}, false: {} },
			current: { true: {}, false: {} },
			disabled: { true: {}, false: {} },
		},
		compoundVariants: [
			{
				selected: true,
				disabled: true,
				styles: {
					backgroundColor: theme.color.neutral.bg,
				},
			},
		],
	},
	number: {
		...theme.font.label.medium,
		color: theme.color.text,
		variants: {
			selected: {
				true: { color: theme.color.onPrimary },
				false: {},
			},
			current: {
				true: {
					...theme.font.label.mediumStrong,
					color: theme.color.onPrimaryContainer,
				},
				false: {},
			},
			disabled: {
				true: { color: theme.color.textMuted },
				false: {},
			},
		},
		compoundVariants: [
			{
				selected: true,
				current: true,
				styles: { color: theme.color.onPrimary },
			},
			{
				current: true,
				disabled: true,
				styles: { color: theme.color.textMuted },
			},
			{
				selected: true,
				disabled: true,
				styles: { color: theme.color.textMuted },
			},
		],
	},
	struck: { textDecorationLine: "line-through" },
	dotSlot: {
		bottom: theme.unit[2],
		flexDirection: "row",
		gap: theme.unit[2],
		justifyContent: "center",
		left: 0,
		position: "absolute",
		right: 0,
	},
	dot: {
		borderRadius: theme.radius.full,
		height: theme.unit[2],
		width: theme.unit[2],
		variants: {
			selected: {
				true: {
					backgroundColor: theme.color.onPrimary,
				},
				false: {},
			},
			disabled: {
				true: { backgroundColor: theme.color.textMuted },
				false: {},
			},
		},
		compoundVariants: [
			{
				selected: true,
				disabled: true,
				styles: {
					backgroundColor: theme.color.textMuted,
				},
			},
		],
	},
	dotTone: (tone: ToneName) => ({
		backgroundColor: tonePaint(theme.color, tone).solid,
	}),
	outside: {
		...theme.font.label.medium,
		color: theme.color.textMuted,
		opacity: OUTSIDE_OPACITY,
	},
	legend: {
		columnGap: theme.unit[8],
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		paddingTop: theme.unit[4],
		rowGap: theme.unit[2],
	},
	key: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[4],
	},
	keyText: {
		...theme.font.body.small,
		color: theme.color.textMuted,
	},
	struckSample: {
		...theme.font.label.small,
		color: theme.color.textMuted,
		textDecorationLine: "line-through",
	},
	disabledSample: {
		...theme.font.label.small,
		color: theme.color.textMuted,
	},
	dotSample: {
		borderRadius: theme.radius.full,
		height: theme.unit[2],
		width: theme.unit[2],
	},
}));

type CalendarNamespace = Readonly<{
	Root: typeof Root;
	Header: typeof Header;
	Title: typeof Title;
	Previous: typeof Previous;
	Next: typeof Next;
	Weekdays: typeof Weekdays;
	Page: typeof Page;
	Status: typeof Status;
	Grid: typeof Grid;
	Day: typeof Day;
	Legend: typeof Legend;
	LegendItem: typeof LegendItem;
}>;

/**
 * A month of days to choose one from, as parts. `Root` holds the month, the
 * choice, the disabled days and the markers; `Page` slides with the month,
 * `Status` draws its days loading, updating or failed, and `Legend` reads the
 * same markers the days draw and announce.
 *
 * @example
 *   <Calendar.Root locale={locale} month={month} onMonthChange={setMonth} value={day} onChange={setDay}>
 *   	<Calendar.Header>
 *   		<Calendar.Title />
 *   		<Calendar.Previous label={m.calendar_previous()} />
 *   		<Calendar.Next label={m.calendar_next()} />
 *   	</Calendar.Header>
 *   	<Calendar.Weekdays />
 *   	<Calendar.Page>
 *   		<Calendar.Grid />
 *   	</Calendar.Page>
 *   </Calendar.Root>
 */
export const Calendar: CalendarNamespace = {
	Root,
	Header,
	Title,
	Previous,
	Next,
	Weekdays,
	Page,
	Status,
	Grid,
	Day,
	Legend,
	LegendItem,
};
