import StarIcon from "@material-design-icons/svg/outlined/star.svg";
import StarBorderIcon from "@material-design-icons/svg/outlined/star_border.svg";
import * as RadioGroupPrimitive from "@rn-primitives/radio-group";
import {
	createContext,
	useContext,
	type ReactNode,
} from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import {
	FieldControl,
	FieldStateDescription,
} from "../../lib/a11y/field-accessibility";
import type {
	FieldState,
	FieldVariants,
} from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { hapticTick } from "../../lib/haptics/haptics";
import { popIn } from "../../lib/motion/motion";
import type { SysTheme } from "../../theme";
import { Field, type FieldCopy } from "../field/field";
import { Icon } from "../icon/icon";

/**
 * What a rating of so many stars reads as, handed the count, so a project's
 * message function can be passed as is.
 *
 * @example
 *   const ratingLabel: RatingLabel = ({ count }) => `${count} of 5 stars`;
 */
export type RatingLabel = (
	inputs: Readonly<{ count: number }>,
) => string;

/** What a `RatingInput.Root` takes: the field's own state, plus the rating itself. */
export type RatingInputRootProps = FieldState &
	Readonly<{
		label: string;
		copy: FieldCopy;
		/** What the stars read as before any is chosen, such as "Not rated". */
		unratedLabel: string;
		/** What a rating, and each star, reads as. */
		ratingLabel: RatingLabel;
		description?: string;
		errors?: unknown;
		handle?: FieldHandle;
		value: number | undefined;
		onValueChange: (value: number) => void;
		testID?: string;
		children: ReactNode;
	}>;

type RatingInputContextValue = Readonly<{
	value: number;
	announced: string;
	ratingLabel: RatingLabel;
	commit: (value: number) => void;
}>;

type StarsProps = Readonly<{
	testID?: string;
	/** The id each star carries, handed the rating it stands for. */
	starTestID?: (rating: number) => string;
}>;

type StarProps = Readonly<{
	rating: number;
	testID: string | undefined;
}>;

const RATINGS: readonly number[] = [1, 2, 3, 4, 5];

const unrated = 0;

const RatingInputContext = createContext<
	RatingInputContextValue | undefined
>(undefined);

const useRatingInput = (): RatingInputContextValue => {
	const value = useContext(RatingInputContext);
	if (value === undefined) {
		throw new Error(
			"A rating part must be rendered inside RatingInput.Root",
		);
	}
	return value;
};

const Root = ({
	label,
	unratedLabel,
	ratingLabel,
	description,
	errors,
	handle,
	value,
	onValueChange,
	children,
	...given
}: RatingInputRootProps): ReactNode => {
	const locked =
		given.disabled === true || given.readonly === true;
	return (
		<RatingInputContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				value: value ?? unrated,
				announced:
					value === undefined
						? unratedLabel
						: ratingLabel({ count: value }),
				ratingLabel,
				commit: next => {
					if (!locked && next !== value) {
						hapticTick();
						onValueChange(next);
					}
				},
			}}>
			<Field.Root
				{...given}
				description={description}
				errors={errors}
				filled={given.filled ?? value !== undefined}
				handle={handle}
				label={label}>
				{children}
			</Field.Root>
		</RatingInputContext.Provider>
	);
};

const inkOf = (
	theme: SysTheme,
	state: FieldVariants,
	earned: boolean,
): string => {
	if (state.disabled) {
		return earned
			? theme.color.disabled.fg
			: theme.color.disabled.bg;
	}
	if (earned) {
		return state.invalid
			? theme.color.error.fg
			: theme.color.primary;
	}
	if (state.invalid) {
		return theme.color.error.border;
	}
	return state.readonly
		? theme.color.border
		: theme.color.outline;
};

const Star = ({ rating, testID }: StarProps): ReactNode => {
	const { state } = Field.useControl();
	const { ratingLabel, value } = useRatingInput();
	const { theme } = useUnistyles();
	const earned = rating <= value;
	const target = Field.useFocusTarget({
		kind: rating === value ? "chosen" : "option",
		index: rating,
	});
	return (
		<RadioGroupPrimitive.Item
			accessibilityLabel={ratingLabel({ count: rating })}
			asChild
			value={String(rating)}>
			<Pressable
				ref={target}
				style={styles.star}
				testID={testID}>
				<Animated.View
					entering={
						earned ? popIn(theme.motion) : undefined
					}
					key={earned ? "earned" : "empty"}>
					<Icon.Root
						color={inkOf(theme, state, earned)}
						size="lg"
						svg={earned ? StarIcon : StarBorderIcon}
					/>
				</Animated.View>
			</Pressable>
		</RadioGroupPrimitive.Item>
	);
};

const Stars = ({
	testID,
	starTestID,
}: StarsProps): ReactNode => {
	const { accessibility, state } = Field.useControl();
	const { announced, commit, value } = useRatingInput();
	return (
		<FieldControl {...accessibility}>
			<View style={styles.row} testID={testID}>
				<FieldStateDescription stateDescription={announced}>
					<RadioGroupPrimitive.Root
						asChild
						disabled={state.disabled || state.readonly}
						onValueChange={next => commit(Number(next))}
						value={
							value === unrated ? undefined : String(value)
						}>
						<View style={styles.stars}>
							{RATINGS.map(rating => (
								<Star
									key={rating}
									rating={rating}
									testID={starTestID?.(rating)}
								/>
							))}
						</View>
					</RadioGroupPrimitive.Root>
				</FieldStateDescription>
				<Field.Pending />
			</View>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	row: {
		alignItems: "center",
		alignSelf: "flex-start",
		flexDirection: "row",
	},
	stars: { flexDirection: "row" },
	star: {
		alignItems: "center",
		justifyContent: "center",
		height: theme.unit[22],
		width: theme.unit[22],
	},
}));

type RatingInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Stars: typeof Stars;
}>;

/**
 * The parts of a rating field: label, description and error around a bare row
 * of five stars, which is a single-choice group wearing a glyph instead of a
 * ring. `Root` holds the rating, so no part below it takes it again.
 *
 * @example
 *   <RatingInput.Root
 *   	copy={fieldCopy}
 *   	label={m.review_rating()}
 *   	ratingLabel={m.rating_value}
 *   	unratedLabel={m.rating_unrated()}
 *   	onValueChange={setRating}
 *   	value={rating}>
 *   	<RatingInput.Label />
 *   	<RatingInput.Stars />
 *   	<RatingInput.Error />
 *   </RatingInput.Root>
 */
export const RatingInput: RatingInputNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Stars,
};
