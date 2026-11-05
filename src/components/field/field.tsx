import AsteriskIcon from "@material-design-icons/svg/filled/emergency.svg";
import type { AnyFieldApi } from "@tanstack/react-form";
import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	type ComponentRef,
	type FC,
	type ReactNode,
} from "react";
import {
	AccessibilityInfo,
	Text as NativeText,
	View,
	type HostInstance,
	type PressableProps,
} from "react-native";
import type { SvgProps } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import {
	isFieldAccessibilityAvailable,
	type FieldAccessibility,
} from "../../lib/a11y/field-accessibility";
import { fieldContext } from "../../lib/forms/context";
import { registerInvalidFocus } from "../../lib/forms/failed-submit";
import {
	fieldVariants,
	spokenLabelFor,
	type FieldState,
	type FieldVariants,
	type SpokenLabelCopy,
} from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { normalizeFieldErrors } from "../../lib/forms/validation-helpers";
import { hapticTick } from "../../lib/haptics/haptics";
import { Button } from "../button/button";
import { ErrorText } from "../error-text/error-text";
import { Icon } from "../icon/icon";
import {
	useFieldClearance,
	useScrollIntoView,
} from "../scroll-area/scroll-area";
import { Spinner } from "../spinner/spinner";
import {
	FieldFrame,
	PressableFrame,
	type FieldFrameStyle,
	type PressableFrameHandlers,
} from "./field-frame";

type Measured = (
	x: number,
	y: number,
	width: number,
	height: number,
) => void;

type Focusable = Readonly<{
	focus: () => void;
	measureInWindow?: (onMeasured: Measured) => void;
}>;

type TargetKind = "control" | "chosen" | "option";

type FocusTarget = Readonly<{
	node: HostInstance;
	kind: TargetKind;
	index: number;
	disabled: boolean;
}>;

type FocusTargetOptions = Readonly<{
	kind: TargetKind;
	index?: number;
	disabled?: boolean;
}>;

type FieldIds = Readonly<{
	labelId: string;
	descriptionId: string;
	errorId: string;
	controlId: string;
}>;

/**
 * The words a field draws and announces around its own label. The functions
 * are handed the field's label (and error), so a project's message functions
 * can be passed as they are. Only `optional` is drawn; the rest name the field
 * where the platform carries no native requiredness or error channel.
 *
 * @example
 *   const fieldCopy: FieldCopy = {
 *   	optional: m.form_optional(),
 *   	labelOptional: m.form_label_optional,
 *   	labelRequired: m.form_label_required_spoken,
 *   	labelInvalid: m.form_label_invalid,
 *   };
 */
export type FieldCopy = SpokenLabelCopy &
	Readonly<{
		/** The word set beside an optional field's label, such as "optional". */
		optional: string;
		/** The name an invalid field announces, such as "Email, enter a valid address". */
		labelInvalid: (
			inputs: Readonly<{ label: string; error: string }>,
		) => string;
	}>;

type FieldControlValue = Readonly<{
	ids: FieldIds;
	copy: FieldCopy;
	label: string;
	description: string | undefined;
	error: string | undefined;
	accessibility: FieldAccessibility;
	accessibilityLabel: string;
	accessibilityHint: string | undefined;
	state: FieldVariants;
	setControl: (control: Focusable | null) => void;
	/** Told whether the field's own control holds focus, so the page can make room under it. */
	reportFocus: (focused: boolean) => void;
	focusControl: () => void;
	registerTarget: (target: FocusTarget) => () => void;
}>;

type RootProps = FieldState &
	Readonly<{
		label: string;
		copy: FieldCopy;
		description?: string;
		/** What the validators returned, shown as the lines `normalizeFieldErrors` makes of it. */
		errors?: unknown;
		handle?: FieldHandle;
		testID?: string;
		children: ReactNode;
	}>;

type PartProps = Readonly<{ testID?: string }>;

type CaptionProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type GroupProps = Readonly<{
	style: FieldFrameStyle;
	testID?: string;
	children: ReactNode;
}>;

type TriggerProps = Readonly<{
	style: FieldFrameStyle;
	press: PressableFrameHandlers;
	children: ReactNode;
}>;

type InlayEnd = "leading" | "trailing";

type InlayProps = Readonly<{
	end: InlayEnd;
	action?: boolean;
	testID?: string;
	children: ReactNode;
}>;

type InlayButtonProps = Readonly<{
	end: InlayEnd;
	label: string;
	svg: FC<SvgProps>;
	disabled?: boolean;
	onPress: PressableProps["onPress"];
	testID?: string;
}>;

const FieldContext = createContext<
	FieldControlValue | undefined
>(undefined);

/**
 * One field's ids, stable for its lifetime. `controlId` doubles as the control's
 * own name.
 *
 * @example
 *   const { labelId, controlId } = Field.useIds();
 */
const useIds = (): FieldIds => {
	const id = useId();
	return {
		labelId: `${id}-label`,
		descriptionId: `${id}-description`,
		errorId: `${id}-error`,
		controlId: `${id}-control`,
	};
};

/**
 * What the control inside a `Field.Root` needs: the accessibility config for its
 * ancestor view, the accessible name and hint for its own node, the field's
 * complete variant selection, and the seam the field focuses it through.
 *
 * @example
 *   const { accessibility, accessibilityLabel } = Field.useControl();
 */
const useControl = (): FieldControlValue => {
	const value = useContext(FieldContext);
	if (value === undefined) {
		throw new Error(
			"A field control must be rendered inside Field.Root",
		);
	}
	return value;
};

/**
 * What `useControl` returns, or nothing outside a `Field.Root`, for a control
 * that also stands on its own.
 *
 * @example
 *   const field = Field.useOptionalControl();
 */
const useOptionalControl = ():
	| FieldControlValue
	| undefined => useContext(FieldContext);

/**
 * A ref for a node a failed submit can move accessibility focus to: the field's
 * own control, its chosen option, or one of its options, in that order of
 * preference. Outside a `Field.Root` it does nothing.
 *
 * @example
 *   const target = Field.useFocusTarget({ kind: chosen ? "chosen" : "option", index });
 *   <Pressable ref={target} />;
 */
const useFocusTarget = ({
	kind,
	index = 0,
	disabled = false,
}: FocusTargetOptions): ((
	node: HostInstance | null,
) => void) => {
	const field = useContext(FieldContext);
	const release = useRef<(() => void) | undefined>(
		undefined,
	);
	return node => {
		release.current?.();
		release.current =
			node === null || field === undefined
				? undefined
				: field.registerTarget({
						node,
						kind,
						index,
						disabled,
					});
	};
};

const accessibleName = (
	label: string,
	error: string | undefined,
	copy: FieldCopy,
): string =>
	error === undefined || isFieldAccessibilityAvailable
		? label
		: copy.labelInvalid({ error, label });

const announce = (
	target: FocusTarget,
	reveal: (node: HostInstance) => void,
): true => {
	reveal(target.node);
	AccessibilityInfo.sendAccessibilityEvent(
		target.node,
		"focus",
	);
	return true;
};

const focusInto = (
	control: Focusable | null,
	targets: ReadonlySet<FocusTarget>,
	reveal: (node: HostInstance) => void,
): boolean => {
	const all = [...targets];
	const enabled = all
		.filter(target => !target.disabled)
		.sort((a, b) => a.index - b.index);
	const own = enabled.find(
		target => target.kind === "control",
	);
	if (own !== undefined) {
		return announce(own, reveal);
	}
	if (
		control !== null &&
		!all.some(target => target.kind === "control")
	) {
		control.focus();
		return true;
	}
	const next =
		enabled.find(target => target.kind === "chosen") ??
		enabled.find(target => target.kind === "option");
	return next === undefined
		? false
		: announce(next, reveal);
};

const Root = ({
	label,
	copy,
	description,
	errors,
	handle,
	testID,
	children,
	...given
}: RootProps): ReactNode => {
	const ids = useIds();
	const control = useRef<Focusable | null>(null);
	const root = useRef<ComponentRef<typeof View>>(null);
	const focused = useRef(false);
	const targets = useRef(new Set<FocusTarget>());
	const blocked = useRef(false);
	const clear = useFieldClearance();
	const reveal = useScrollIntoView();
	const field: AnyFieldApi | null =
		useContext(fieldContext);

	useEffect(
		() => () => {
			if (focused.current) {
				clear(0);
			}
		},
		[clear],
	);

	useEffect(() => {
		blocked.current =
			given.disabled === true || given.readonly === true;
	});

	useEffect(() => {
		if (field === null) {
			return undefined;
		}
		return registerInvalidFocus(field.form, {
			name: field.name,
			place: found => {
				const node = root.current;
				if (node === null) {
					found({ hidden: true, top: undefined });
					return;
				}
				node.measureInWindow((_x, y, width, height) =>
					found({
						hidden: width === 0 && height === 0,
						top: y,
					}),
				);
			},
			focus: () =>
				!blocked.current &&
				focusInto(control.current, targets.current, reveal),
		});
	}, [field, reveal]);

	const measure = () => {
		const node = root.current;
		const target = control.current;

		if (!focused.current) {
			return;
		}
		if (
			node === null ||
			target?.measureInWindow === undefined
		) {
			clear(0);
			return;
		}
		node.measureInWindow(
			(_x, fieldY, _width, fieldHeight) => {
				target.measureInWindow?.(
					(_cx, controlY, _cwidth, controlHeight) => {
						clear(
							Math.max(
								0,
								fieldY +
									fieldHeight -
									(controlY + controlHeight),
							),
						);
					},
				);
			},
		);
	};
	const lines = normalizeFieldErrors(errors);
	const message =
		lines.length === 0 ? undefined : lines.join("\n");
	const state = fieldVariants({
		...given,
		invalid: given.invalid ?? message !== undefined,
	});
	const accessibility: FieldAccessibility = {
		label: spokenLabelFor(
			label,
			state.requiredness,
			isFieldAccessibilityAvailable,
			copy,
		),
		description,
		requiredness: state.requiredness,
		error: message,
		invalid: state.invalid,
	};
	return (
		<FieldContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				ids,
				copy,
				label,
				description,
				error: message,
				accessibility,
				accessibilityLabel: accessibleName(
					accessibility.label,
					message,
					copy,
				),
				accessibilityHint: description,
				state,
				setControl: next => {
					control.current = next;
					handle?.attach(next);
				},
				focusControl: () => {
					if (!state.disabled) {
						control.current?.focus();
					}
				},
				registerTarget: target => {
					targets.current.add(target);
					return () => {
						targets.current.delete(target);
					};
				},
				reportFocus: next => {
					focused.current = next;
					if (next) {
						measure();
					} else {
						clear(0);
					}
				},
			}}>
			<View
				onLayout={measure}
				ref={root}
				style={styles.root}
				testID={testID}>
				{children}
			</View>
		</FieldContext.Provider>
	);
};

const RequiredMark = ({ testID }: PartProps): ReactNode => {
	const { theme } = useUnistyles();
	return (
		<Icon.Root
			svg={AsteriskIcon}
			size="sm"
			color={theme.color.primary}
			testID={testID}
		/>
	);
};

const OptionalMark = ({ testID }: PartProps): ReactNode => {
	const { copy } = useControl();
	return (
		<NativeText style={styles.caption} testID={testID}>
			{copy.optional}
		</NativeText>
	);
};

const Mark = ({ testID }: PartProps): ReactNode => {
	const { state } = useControl();
	if (state.requiredness === "required") {
		return <RequiredMark testID={testID} />;
	}
	return state.requiredness === "optional" ? (
		<OptionalMark testID={testID} />
	) : null;
};

const Label = ({ testID }: PartProps): ReactNode => {
	const { ids, label, state } = useControl();
	return (
		<View
			aria-hidden
			style={styles.labelRow}
			testID={testID}>
			<NativeText
				nativeID={ids.labelId}
				style={[
					styles.label,
					state.disabled ? styles.disabled : null,
				]}>
				{label}
			</NativeText>
			<Mark />
		</View>
	);
};

const Caption = ({
	testID,
	children,
}: CaptionProps): ReactNode => {
	const { state } = useControl();
	return (
		<NativeText
			aria-hidden
			style={[
				styles.label,
				state.disabled ? styles.disabled : null,
			]}
			testID={testID}>
			{children}
		</NativeText>
	);
};

const Description = ({ testID }: PartProps): ReactNode => {
	const { description, ids } = useControl();
	return description === undefined ? null : (
		<NativeText
			aria-hidden
			nativeID={ids.descriptionId}
			style={styles.caption}
			testID={testID}>
			{description}
		</NativeText>
	);
};

const ErrorMessage = ({ testID }: PartProps): ReactNode => {
	const { error, ids } = useControl();
	return error === undefined ? null : (
		<View testID={testID}>
			<ErrorText.Root aria-hidden nativeID={ids.errorId}>
				{error}
			</ErrorText.Root>
		</View>
	);
};

const Inlay = ({
	end,
	action = false,
	testID,
	children,
}: InlayProps): ReactNode => {
	styles.useVariants({ end, action });
	return (
		<View
			pointerEvents={action ? "box-none" : "none"}
			style={styles.inlay}
			testID={testID}>
			{children}
		</View>
	);
};

const InlayButton = ({
	end,
	label,
	svg,
	disabled,
	onPress,
	testID,
}: InlayButtonProps): ReactNode => (
	<Inlay action end={end}>
		<Button.Root
			disabled={disabled}
			iconOnly
			inlay
			label={label}
			onPress={onPress}
			size="sm"
			testID={testID}
			tier="ghost"
			tone="neutral">
			<Button.Icon svg={svg} />
		</Button.Root>
	</Inlay>
);

const Pending = ({ testID }: PartProps): ReactNode => {
	const { state } = useControl();
	return state.pending ? (
		<Inlay end="trailing" testID={testID}>
			<Spinner.Indicator size="sm" />
		</Inlay>
	) : null;
};

const InlineLabelText = ({
	testID,
}: PartProps): ReactNode => {
	const { label, state } = useControl();
	return (
		<View
			aria-hidden
			style={styles.inlineLabel}
			testID={testID}>
			<NativeText
				style={[
					styles.body,
					state.disabled ? styles.disabled : null,
				]}>
				{label}
				{state.requiredness === "required" ? (
					<>
						{" "}
						<RequiredMark />
					</>
				) : null}
			</NativeText>
			{state.requiredness === "optional" ? (
				<OptionalMark />
			) : null}
		</View>
	);
};

const Group = ({
	style,
	testID,
	children,
}: GroupProps): ReactNode => {
	const { focusControl, state } = useControl();
	return (
		<PressableFrame
			press={{
				accessible: false,
				disabled: state.disabled,
				focusable: false,
				onPress: focusControl,
				testID,
			}}
			style={style}>
			{children}
		</PressableFrame>
	);
};

const Trigger = ({
	style,
	press,
	children,
}: TriggerProps): ReactNode => (
	<PressableFrame
		press={{
			...press,
			onPress: event => {
				hapticTick();
				press.onPress?.(event);
			},
		}}
		style={style}>
		{children}
	</PressableFrame>
);

const styles = StyleSheet.create(theme => ({
	root: { gap: theme.unit[2] },
	labelRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[2],
	},
	inlineLabel: {
		alignItems: "flex-start",
		flex: 1,
	},
	label: {
		...theme.font.label.medium,
		color: theme.color.text,
	},
	body: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
	caption: {
		...theme.font.body.small,
		color: theme.color.textMuted,
	},
	disabled: { color: theme.color.disabled.fg },
	inlay: {
		alignItems: "center",
		alignSelf: "stretch",
		justifyContent: "center",
		width: theme.unit[24],
		zIndex: 1,
		variants: {
			end: {
				leading: { marginEnd: -theme.unit[6] },
				trailing: { marginStart: -theme.unit[6] },
			},
			action: {
				true: { alignItems: "stretch" },
				false: {},
			},
		},
	},
}));

type FieldNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Label;
	Mark: typeof Mark;
	Caption: typeof Caption;
	Description: typeof Description;
	Error: typeof ErrorMessage;
	Pending: typeof Pending;
	InlineLabelText: typeof InlineLabelText;
	Inlay: typeof Inlay;
	InlayButton: typeof InlayButton;
	Frame: typeof FieldFrame;
	Group: typeof Group;
	Trigger: typeof Trigger;
	useIds: typeof useIds;
	useControl: typeof useControl;
	useOptionalControl: typeof useOptionalControl;
	useFocusTarget: typeof useFocusTarget;
}>;

/**
 * The frame every input control sits in, as parts. The control is the field's
 * only accessibility node, so the label, its requiredness mark, the description
 * and the error are drawn for the eye alone and the announced copy reaches the
 * control through `useControl`. An `Inlay` is a slot as tall as the frame, flush
 * against the `end` it sits at, that passes every touch to the control unless it
 * holds an `action`; `InlayButton` is the round button that fills one.
 *
 * @example
 *   <Field.Root label={m.login_email()} copy={fieldCopy} errors={errors}>
 *   	<Field.Label />
 *   	<Field.Group style={styles.box}>
 *   		<TextInput.Input />
 *   	</Field.Group>
 *   	<Field.Description />
 *   	<Field.Error />
 *   </Field.Root>
 */
export const Field: FieldNamespace = {
	Root,
	Label,
	Mark,
	Caption,
	Description,
	Error: ErrorMessage,
	Pending,
	InlineLabelText,
	Inlay,
	InlayButton,
	Frame: FieldFrame,
	Group,
	Trigger,
	useIds,
	useControl,
	useOptionalControl,
	useFocusTarget,
};
