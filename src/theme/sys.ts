import type { BoxShadowValue } from "react-native";

/** A status group: its container, the ink that reads on it, and its line. */
export type StatusRole = Readonly<{
	fg: string;
	bg: string;
	border: string;
}>;

/** The status groups `SysTheme["color"]` carries. */
export type StatusName =
	| "success"
	| "info"
	| "warning"
	| "error"
	| "neutral";

/** A person's colour: a container and the ink that reads on it. */
export type IdentityRole = Readonly<{
	bg: string;
	fg: string;
}>;

/**
 * A type role. `fontFamily` is absent when the token set names no family, and
 * the platform's system font draws it.
 */
export type FontRole = Readonly<{
	fontFamily?: string;
	fontSize: number;
	lineHeight: number;
	fontWeight: "400" | "500" | "600" | "700" | "800";
	letterSpacing?: number;
}>;

export type CubicBezier = readonly [
	number,
	number,
	number,
	number,
];

/** A step of the spacing scale, in eighths of a rem. */
export type UnitStep =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32
	| 33
	| 34
	| 35
	| 36
	| 37
	| 38
	| 39
	| 40
	| 41
	| 42
	| 43
	| 44
	| 45
	| 46
	| 47
	| 48
	| 49
	| 50
	| 51
	| 52
	| 53
	| 54
	| 55
	| 56
	| 57
	| 58
	| 59
	| 60
	| 61
	| 62
	| 63
	| 64;

/**
 * The roles every kit component reads, per theme. It mirrors the `sys` group of
 * `tokens/sys.tokens.json` one to one: each kebab-case token name becomes a
 * camelCase key, and the Terrazzo plugin in `./terrazzo` emits an object of
 * exactly this shape for every `theme` permutation of a resolver.
 *
 * @example
 *   const styles = StyleSheet.create(theme => ({
 *   	card: {
 *   		backgroundColor: theme.color.surface,
 *   		borderRadius: theme.radius.md,
 *   		padding: theme.unit[8],
 *   	},
 *   }));
 */
export type SysTheme = Readonly<{
	color: Readonly<{
		/** Primary buttons and links. */
		primary: string;
		onPrimary: string;
		/** Avatar fallbacks, mention pills, brand tints. */
		primaryContainer: string;
		onPrimaryContainer: string;
		/** The brand container, turned to a hue of its own. */
		identity: Readonly<{
			1: IdentityRole;
			2: IdentityRole;
			3: IdentityRole;
			4: IdentityRole;
		}>;
		/** Done, approved. */
		success: StatusRole;
		/** Worth knowing, nothing to do. */
		info: StatusRole;
		/** Needs attention. */
		warning: StatusRole;
		/** Failed or invalid. */
		error: StatusRole & Readonly<{ outline: string }>;
		/** A chip or badge with no verdict. */
		neutral: StatusRole;
		/** Body copy and headings. */
		text: string;
		/** Captions, help text and anything passive. */
		textMuted: string;
		/** The hint text an empty field shows. */
		textPlaceholder: string;
		textInverse: string;
		/** Selected text. */
		selection: Readonly<{
			bg: string;
			fg: string;
		}>;
		/** A field the browser has filled in for the user. */
		autofill: Readonly<{
			bg: string;
		}>;
		/** The page behind everything. */
		bg: string;
		/** The dimmest card: a table's sub-rows. */
		surfaceLowest: string;
		/** The default card. */
		surface: string;
		/** A fill nested in a card. */
		surfaceHigh: string;
		/** The deepest recess: fields, placeholders. */
		surfaceHighest: string;
		/** Popups and tooltips. */
		surfaceOverlay: string;
		/** Toasts. */
		surfaceOverlayHigh: string;
		/** The quiet hairline that separation rations. */
		border: string;
		/** A mark that has to be found: grab bars, scroll thumbs, control outlines. */
		outline: string;
		/** Keyboard focus, on every focusable element. */
		focusRing: string;
		disabled: Readonly<{
			/** The fill of a control or button that cannot be used. */
			bg: string;
			/** The ink of a control that cannot be used: its text, icons and the marks of its choice. */
			fg: string;
		}>;
	}>;
	/** The opacity of the state layer, a control's own ink laid over its fill, per state. */
	state: Readonly<{
		hover: number;
		focus: number;
		pressed: number;
		dragged: number;
	}>;
	focusRing: Readonly<{
		width: number;
		offset: number;
	}>;
	font: Readonly<{
		/** Copy. */
		body: Readonly<{
			small: FontRole;
			medium: FontRole;
			mediumStrong: FontRole;
			large: FontRole;
		}>;
		/** Dialog and page titles. */
		heading: Readonly<{
			small: FontRole;
			medium: FontRole;
			large: FontRole;
		}>;
		/** Buttons, tabs, nav items, field labels and chips. */
		label: Readonly<{
			small: FontRole;
			medium: FontRole;
			large: FontRole;
			smallStrong: FontRole;
			mediumStrong: FontRole;
			largeStrong: FontRole;
		}>;
	}>;
	/** The one spacing scale, in eighths of a rem: step 8 is 16 points. */
	unit: Readonly<Record<UnitStep, number>>;
	radius: Readonly<{
		/** Inner joins of a group that reads as one object. */
		none: number;
		/** The densest chrome: skeleton lines, marks inside fields. */
		xs: number;
		/** Menu rows, tooltips, checkboxes, attachment tiles. */
		sm: number;
		/** Cards, tables, nav items, popups, toasts. */
		md: number;
		/** Popovers and drawers. */
		lg: number;
		/** Dialogs and bottom sheets. */
		xl: number;
		/** Pills: buttons, chips, badges, switches, tabs. */
		full: number;
		/** Avatars and radio buttons. */
		circle: number;
	}>;
	/** The colours a shadow's two layers are cast in. */
	shadow: Readonly<{
		umbra: string;
		penumbra: string;
	}>;
	/** The casts of the three heights, as `boxShadow` layers. */
	elevation: Readonly<{
		/** The page. */
		0: readonly Readonly<BoxShadowValue>[];
		/** Popups and tooltips. */
		1: readonly Readonly<BoxShadowValue>[];
		/** Toasts. */
		2: readonly Readonly<BoxShadowValue>[];
	}>;
	/** Durations in milliseconds, and easings as their four control points. */
	motion: Readonly<{
		/** Popups, tooltips, hover and press. */
		instant: number;
		/** Dialogs, drawers, check marks. */
		short: number;
		/** Larger surfaces: the theme change. */
		medium: number;
		long: number;
		/** Most transitions: a menu opening. */
		standard: CubicBezier;
		/** A larger move: a dialog opening. */
		emphasized: CubicBezier;
		/** Something arriving: a sent comment. */
		decelerate: CubicBezier;
		/** Something leaving: a cleared selection. */
		accelerate: CubicBezier;
		/** A mark popping in: a check mark. */
		overshoot: CubicBezier;
	}>;
}>;

export type SysThemes = Readonly<{
	light: SysTheme;
	dark: SysTheme;
}>;
