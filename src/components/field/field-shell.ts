import { StyleSheet } from "react-native-unistyles";

import type { FontRole, SysTheme } from "../../theme";

type FieldTheme = SysTheme;

type EdgeStyle = Readonly<{
	borderWidth?: number;
	borderStyle?: "solid" | "dashed";
	borderColor: string;
}>;

/** What a state treatment re-points: the edge, the fill, and the inset that keeps a control's text still while its edge thickens. */
type StateStyle = Partial<EdgeStyle> &
	Readonly<{
		backgroundColor?: string;
		color?: string;
		paddingHorizontal?: number;
	}>;

/** The edge a control wears in each of its states. */
export type ControlEdge = Readonly<{
	resting: EdgeStyle;
	focused: EdgeStyle;
	invalid: EdgeStyle;
	invalidFocused: EdgeStyle;
	readonly: EdgeStyle;
	disabled: EdgeStyle;
}>;

/** A field's box: both of the edges its frame eases are named. */
export type FieldGroupStyle = EdgeStyle &
	Readonly<{
		alignItems: "center";
		flexDirection: "row";
		minHeight: number;
		borderRadius: number;
		backgroundColor: string;
	}>;

/** A field's bare control: its ink is named. */
export type FieldControlStyle = FontRole &
	Readonly<{
		flex: number;
		paddingHorizontal: number;
		paddingVertical: number;
		color: string;
	}>;

type Toggle<TStyle> = Readonly<{
	true: TStyle;
	false: TStyle;
}>;

type RequirednessGroup<TStyle> = Readonly<{
	required: TStyle;
	optional: TStyle;
	unstated: TStyle;
}>;

/** One variant group per key `fieldVariants` returns. */
export type FieldStateVariants<TStyle> = Readonly<{
	focused: Toggle<TStyle>;
	disabled: Toggle<TStyle>;
	readonly: Toggle<TStyle>;
	invalid: Toggle<TStyle>;
	valid: Toggle<TStyle>;
	dirty: Toggle<TStyle>;
	touched: Toggle<TStyle>;
	filled: Toggle<TStyle>;
	pending: Toggle<TStyle>;
	requiredness: RequirednessGroup<TStyle>;
}>;

/** A state treatment a field's box wears where its conditions hold. */
export type FieldGroupCompound = Readonly<{
	invalid?: boolean;
	focused?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	styles: StateStyle;
}>;

/**
 * The edge every control wears, per state: a hairline at rest that thickens on
 * focus, and the border role each state re-points it to. A control spreads `resting` into its base style and
 * lets `fieldGroupVariants` and `fieldGroupCompounds` apply the rest.
 *
 * @example
 *   pill: { ...controlEdge(theme).resting, backgroundColor: theme.color.surface };
 */
export const controlEdge = (
	theme: FieldTheme,
): ControlEdge => ({
	resting: {
		borderWidth: StyleSheet.hairlineWidth,
		borderStyle: "solid",
		borderColor: theme.color.border,
	},
	focused: {
		borderWidth: theme.unit[1],
		borderColor: theme.color.focusRing,
	},
	invalid: {
		borderColor: theme.color.error.border,
	},
	invalidFocused: {
		borderColor: theme.color.error.fg,
	},
	readonly: {
		borderStyle: "dashed",
		borderColor: theme.color.outline,
	},
	disabled: {
		borderColor: "transparent",
	},
});

/**
 * The chrome a field's box wears, for the flex wrapper the control sits bare
 * inside: a filled pill in the shared edge, with no padding of its own, so an
 * inlay sits flush against its ends. Spread it, then declare a literal
 * `variants` of your own — a spread `variants` key is invisible to the Babel
 * plugin.
 *
 * @example
 *   box: { ...fieldGroup(theme), variants: { ...fieldGroupVariants(theme) } };
 */
export const fieldGroup = (
	theme: FieldTheme,
): FieldGroupStyle => ({
	...controlEdge(theme).resting,
	alignItems: "center",
	flexDirection: "row",
	minHeight: theme.unit[24],
	borderRadius: theme.radius.full,
	backgroundColor: theme.color.surfaceHighest,
});

/**
 * The variant groups a control's box selects on. Every key `fieldVariants`
 * returns is declared, because an undeclared key is ignored and an absent
 * compound condition counts as satisfied.
 *
 * @example
 *   variants: { ...fieldGroupVariants(theme), size: { sm: {}, md: {} } };
 */
export const fieldGroupVariants = (
	theme: FieldTheme,
): FieldStateVariants<StateStyle> => ({
	focused: {
		true: controlEdge(theme).focused,
		false: {},
	},
	disabled: { true: {}, false: {} },
	readonly: { true: {}, false: {} },
	invalid: { true: {}, false: {} },
	valid: { true: {}, false: {} },
	dirty: { true: {}, false: {} },
	touched: { true: {}, false: {} },
	filled: { true: {}, false: {} },
	pending: { true: {}, false: {} },
	requiredness: {
		required: {},
		optional: {},
		unstated: {},
	},
});

/**
 * The state treatments a control's box wears, in the order they win: invalid
 * over focus, read-only over both, a control's own treatments over those, and
 * disabled over everything.
 *
 * @example
 *   compoundVariants: [
 *   	...fieldGroupCompounds(theme, [
 *   		{ checked: true, invalid: true, styles: { borderColor: theme.color.error.fg } },
 *   	]),
 *   ];
 */
export const fieldGroupCompounds = <
	TOwn extends Readonly<{ styles: StateStyle }> = never,
>(
	theme: FieldTheme,
	own: readonly TOwn[] = [],
): (FieldGroupCompound | TOwn)[] => [
	{
		invalid: true,
		styles: {
			...controlEdge(theme).invalid,
			backgroundColor: theme.color.error.bg,
		},
	},
	{
		invalid: true,
		focused: true,
		styles: controlEdge(theme).invalidFocused,
	},
	{
		readonly: true,
		styles: {
			...controlEdge(theme).readonly,
			backgroundColor: theme.color.surfaceHighest,
		},
	},
	...own,
	{
		disabled: true,
		styles: {
			...controlEdge(theme).disabled,
			backgroundColor: theme.color.disabled.bg,
		},
	},
];

/**
 * The bare control inside a field's box: the ink, the metrics and the inset its
 * text keeps from the box's ends, and no chrome of its own, so no bordered box
 * ever sits inside another.
 *
 * @example
 *   input: { ...fieldControl(theme), variants: { ...fieldControlVariants(theme) } };
 */
export const fieldControl = (
	theme: FieldTheme,
): FieldControlStyle => ({
	...theme.font.body.medium,
	flex: 1,
	paddingHorizontal: theme.unit[8],
	paddingVertical: theme.unit[4],
	color: theme.color.text,
});

/**
 * The variant groups a field's bare control selects on, declaring every key
 * `fieldVariants` returns.
 *
 * @example
 *   variants: { ...fieldControlVariants(theme) };
 */
export const fieldControlVariants = (
	theme: FieldTheme,
): FieldStateVariants<StateStyle> => ({
	disabled: {
		true: {
			color: theme.color.disabled.fg,
		},
		false: {},
	},
	focused: {
		true: {
			paddingHorizontal:
				theme.unit[8] -
				theme.unit[1] +
				StyleSheet.hairlineWidth,
		},
		false: {},
	},
	readonly: { true: {}, false: {} },
	invalid: { true: {}, false: {} },
	valid: { true: {}, false: {} },
	dirty: { true: {}, false: {} },
	touched: { true: {}, false: {} },
	filled: { true: {}, false: {} },
	pending: { true: {}, false: {} },
	requiredness: {
		required: {},
		optional: {},
		unstated: {},
	},
});
