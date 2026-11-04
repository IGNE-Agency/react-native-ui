import { Host, Stepper } from "@expo/ui/swift-ui";
import { disabled as disabledModifier } from "@expo/ui/swift-ui/modifiers";
import AddIcon from "@material-design-icons/svg/outlined/add.svg";
import RemoveIcon from "@material-design-icons/svg/outlined/remove.svg";
import {
	createContext,
	useContext,
	useState,
	type FC,
	type ReactNode,
} from "react";
import {
	Platform,
	Pressable,
	Text as NativeText,
	View,
} from "react-native";
import type { SvgProps } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { Requiredness } from "../../lib/forms/field-state";
import { hapticTick } from "../../lib/haptics/haptics";
import { StateLayer } from "../../lib/state-layer/state-layer";
import { Field, type FieldCopy } from "../field/field";
import {
	fieldControl,
	fieldControlVariants,
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { Icon } from "../icon/icon";

type Direction = 1 | -1;

type NumberInputValue = Readonly<{
	value: number;
	min: number;
	max: number;
	step: number;
	formatted: string;
	incrementLabel: string;
	decrementLabel: string;
	adjust: (direction: Direction) => void;
	commit: (value: number) => void;
}>;

type RootProps = Readonly<{
	label: string;
	copy: FieldCopy;
	/** The app's locale tag, which the value is written out in. */
	locale: string;
	/** What the accessibility action that steps up is called on Android, such as "Increase". */
	incrementLabel: string;
	/** What the accessibility action that steps down is called on Android, such as "Decrease". */
	decrementLabel: string;
	description?: string;
	errors?: unknown;
	disabled?: boolean;
	requiredness?: Requiredness;
	value: number;
	min: number;
	max: number;
	step?: number;
	onValueChange: (value: number) => void;
	testID?: string;
	children: ReactNode;
}>;

type GroupProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type PartProps = Readonly<{ testID?: string }>;

type StepProps = Readonly<{
	direction: Direction;
	svg: FC<SvgProps>;
	testID: string | undefined;
}>;

const NumberInputContext = createContext<
	NumberInputValue | undefined
>(undefined);

const useNumberInput = (): NumberInputValue => {
	const value = useContext(NumberInputContext);
	if (value === undefined) {
		throw new Error(
			"A number input part must be rendered inside NumberInput.Root",
		);
	}
	return value;
};

const formatNumber = (
	value: number,
	locale: string,
): string => new Intl.NumberFormat(locale).format(value);

const clamp = (
	value: number,
	min: number,
	max: number,
): number => Math.min(max, Math.max(min, value));

const Root = ({
	label,
	copy,
	locale,
	incrementLabel,
	decrementLabel,
	description,
	errors,
	disabled,
	requiredness,
	value,
	min,
	max,
	step = 1,
	onValueChange,
	testID,
	children,
}: RootProps): ReactNode => {
	const commit = (next: number) => {
		const settled = clamp(next, min, max);
		if (!disabled && settled !== value) {
			onValueChange(settled);
		}
	};
	return (
		<Field.Root
			copy={copy}
			description={description}
			disabled={disabled}
			errors={errors}
			label={label}
			requiredness={requiredness}
			testID={testID}>
			<NumberInputContext.Provider
				// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
				value={{
					value,
					min,
					max,
					step,
					formatted: formatNumber(value, locale),
					incrementLabel,
					decrementLabel,
					adjust: direction =>
						commit(value + direction * step),
					commit,
				}}>
				{children}
			</NumberInputContext.Provider>
		</Field.Root>
	);
};

const Group = ({
	testID,
	children,
}: GroupProps): ReactNode => {
	const {
		accessibility,
		accessibilityHint,
		accessibilityLabel,
		state,
	} = Field.useControl();
	const {
		adjust,
		decrementLabel,
		formatted,
		incrementLabel,
		max,
		min,
		value,
	} = useNumberInput();
	const target = Field.useFocusTarget({ kind: "control" });
	styles.useVariants(state);
	return (
		<FieldControl {...accessibility}>
			<View
				ref={target}
				accessibilityActions={Platform.select({
					android: [
						{
							name: "increment",
							label: incrementLabel,
						},
						{
							name: "decrement",
							label: decrementLabel,
						},
					],
					default: undefined,
				})}
				accessibilityHint={accessibilityHint}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="adjustable"
				accessibilityState={{ disabled: state.disabled }}
				accessibilityValue={Platform.select({
					ios: { text: formatted },
					default: { min, max, now: value },
				})}
				accessible
				onAccessibilityAction={event => {
					if (
						event.nativeEvent.actionName === "increment"
					) {
						adjust(1);
					}
					if (
						event.nativeEvent.actionName === "decrement"
					) {
						adjust(-1);
					}
				}}
				style={styles.box}
				testID={testID}>
				{children}
			</View>
		</FieldControl>
	);
};

const Value = ({ testID }: PartProps): ReactNode => {
	const { state } = Field.useControl();
	const { formatted } = useNumberInput();
	styles.useVariants(state);
	return (
		<NativeText
			aria-hidden
			style={styles.value}
			testID={testID}>
			{formatted}
		</NativeText>
	);
};

const Step = ({
	direction,
	svg,
	testID,
}: StepProps): ReactNode => {
	const { state } = Field.useControl();
	const { adjust, max, min, value } = useNumberInput();
	const { theme } = useUnistyles();
	const spent =
		direction === -1 ? value <= min : value >= max;
	const unavailable =
		state.disabled || state.readonly || spent;
	const [pressed, setPressed] = useState(false);
	return (
		<Field.Inlay
			action
			end={direction === -1 ? "leading" : "trailing"}>
			<Pressable
				accessible={false}
				accessibilityElementsHidden
				disabled={unavailable}
				importantForAccessibility="no-hide-descendants"
				onPress={() => {
					hapticTick();
					adjust(direction);
				}}
				onPressIn={() => setPressed(true)}
				onPressOut={() => setPressed(false)}
				style={styles.step}
				testID={testID}>
				<StateLayer
					color={theme.color.text}
					pressed={pressed}
				/>
				<Icon.Root
					color={
						unavailable
							? theme.color.disabled.fg
							: theme.color.text
					}
					svg={svg}
				/>
			</Pressable>
		</Field.Inlay>
	);
};

const Decrement = ({ testID }: PartProps): ReactNode => (
	<Step direction={-1} svg={RemoveIcon} testID={testID} />
);

const Increment = ({ testID }: PartProps): ReactNode => (
	<Step direction={1} svg={AddIcon} testID={testID} />
);

const PlatformStepper = ({
	testID,
}: PartProps): ReactNode => {
	const { state } = Field.useControl();
	const { commit, formatted, max, min, step, value } =
		useNumberInput();
	if (Platform.OS !== "ios") {
		return null;
	}
	return (
		<View style={styles.host} testID={testID}>
			<Host matchContents>
				<Stepper
					label={formatted}
					max={max}
					min={min}
					modifiers={[disabledModifier(state.disabled)]}
					onValueChange={commit}
					step={step}
					value={value}
				/>
			</Host>
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	box: {
		...fieldGroup(theme),
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	value: {
		...fieldControl(theme),
		textAlign: "center",
		variants: { ...fieldControlVariants(theme) },
	},
	step: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		borderRadius: theme.radius.full,
		overflow: "hidden",
	},
	host: {
		flex: 1,
		alignItems: "stretch",
		paddingHorizontal: theme.unit[8],
	},
}));

type NumberInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Group: typeof Group;
	Value: typeof Value;
	Decrement: typeof Decrement;
	Increment: typeof Increment;
	Stepper: typeof PlatformStepper;
	Pending: typeof Field.Pending;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
}>;

/**
 * The parts of a numeric stepper field: the field frame, one adjustable box and
 * the platform's own way of stepping inside it — a SwiftUI `Stepper` on iOS, our
 * own step buttons on Android. The box is the field's only accessibility node.
 *
 * @example
 *   <NumberInput.Root
 *   	copy={fieldCopy}
 *   	decrementLabel={m.number_decrement()}
 *   	incrementLabel={m.number_increment()}
 *   	label={m.order_quantity()}
 *   	locale={getLocale()}
 *   	max={10}
 *   	min={1}
 *   	onValueChange={setQuantity}
 *   	value={quantity}>
 *   	<NumberInput.Label />
 *   	<NumberInput.Group>
 *   		<NumberInput.Decrement />
 *   		<NumberInput.Value />
 *   		<NumberInput.Increment />
 *   	</NumberInput.Group>
 *   	<NumberInput.Error />
 *   </NumberInput.Root>
 */
export const NumberInput: NumberInputNamespace = {
	Root,
	Label: Field.Label,
	Group,
	Value,
	Decrement,
	Increment,
	Stepper: PlatformStepper,
	Pending: Field.Pending,
	Description: Field.Description,
	Error: Field.Error,
};
