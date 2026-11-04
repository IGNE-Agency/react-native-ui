import type {
	ColorSpace,
	ColorValueNormalized,
	DimensionValue,
	DurationValue,
	Plugin,
	ShadowValueNormalized,
	TokenNormalized,
	TokenNormalizedSet,
	TypographyValueNormalized,
} from "@terrazzo/parser";
import { type Color, formatHex, formatHex8 } from "culori";

export type ReactNativeThemeOptions = Readonly<{
	/**
	 * The file the themes are written to, relative to the config's `outDir`.
	 *
	 * @default "theme.gen.ts"
	 */
	filename?: string;
	/**
	 * The module the generated file imports the `SysTheme` type from.
	 *
	 * @default "@maanlamp/react-native-ui/theme"
	 */
	themeModule?: string;
}>;

/** A value the generated file writes out as a TypeScript literal. */
type Literal =
	| string
	| number
	| boolean
	| readonly Literal[]
	| Readonly<{ [key: string]: Literal }>;

/** A group of the theme being assembled: its keys, in token order, each holding a group or a value. */
type Group = Map<string, Node>;

type Node =
	| Readonly<{ kind: "group"; children: Group }>
	| Readonly<{ kind: "value"; value: Literal }>;

/** A colour's three components, with a `none` (null) component as `undefined`. */
type Components = readonly [
	number | undefined,
	number | undefined,
	number | undefined,
];

const NAME = "@maanlamp/react-native-ui/terrazzo";

const ROOT = "sys";

const THEMES = ["light", "dark"] as const;

/** The pixels one `rem` stands for, the root font size React Native lays out at. */
const REM = 16;

/**
 * The typography properties the kit's tokens set. `fontFamily` is left out so
 * the platform's system font draws a role, and `letterSpacing` is optional.
 */
const TYPOGRAPHY_PROPERTIES = [
	"fontSize",
	"fontWeight",
	"lineHeight",
] as const;

const VALID_TYPOGRAPHY = "core/valid-typography";

const fail = (id: string, message: string): never => {
	throw new Error(`${NAME}: ${id}: ${message}`);
};

/** Rounds away floating-point noise, such as a line height of 20.000000000000004. */
const tidy = (value: number): number =>
	Math.round(value * 10_000) / 10_000;

const camelCase = (name: string): string =>
	name.replace(/-+([a-z0-9])/gi, (_, next: string) =>
		next.toUpperCase(),
	);

/** A missing component other than hue counts as zero, as CSS reads `none`. */
const zero = (component: number | undefined): number =>
	component ?? 0;

/** A percentage component (DTCG writes HSL and HWB as 0–100) as culori's 0–1. */
const share = (component: number | undefined): number =>
	zero(component) / 100;

/** Each DTCG colour space as the culori colour of the same components. */
const COLOR_SPACES: Readonly<
	Record<
		ColorSpace,
		(components: Components, alpha: number) => Color
	>
> = {
	srgb: ([r, g, b], alpha) => ({
		mode: "rgb",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	"srgb-linear": ([r, g, b], alpha) => ({
		mode: "lrgb",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	"display-p3": ([r, g, b], alpha) => ({
		mode: "p3",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	"a98-rgb": ([r, g, b], alpha) => ({
		mode: "a98",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	"prophoto-rgb": ([r, g, b], alpha) => ({
		mode: "prophoto",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	rec2020: ([r, g, b], alpha) => ({
		mode: "rec2020",
		r: zero(r),
		g: zero(g),
		b: zero(b),
		alpha,
	}),
	hsl: ([h, s, l], alpha) => ({
		mode: "hsl",
		h,
		s: share(s),
		l: share(l),
		alpha,
	}),
	hwb: ([h, w, b], alpha) => ({
		mode: "hwb",
		h,
		w: share(w),
		b: share(b),
		alpha,
	}),
	lab: ([l, a, b], alpha) => ({
		mode: "lab",
		l: zero(l),
		a: zero(a),
		b: zero(b),
		alpha,
	}),
	"lab-d65": ([l, a, b], alpha) => ({
		mode: "lab65",
		l: zero(l),
		a: zero(a),
		b: zero(b),
		alpha,
	}),
	lch: ([l, c, h], alpha) => ({
		mode: "lch",
		l: zero(l),
		c: zero(c),
		h,
		alpha,
	}),
	oklab: ([l, a, b], alpha) => ({
		mode: "oklab",
		l: zero(l),
		a: zero(a),
		b: zero(b),
		alpha,
	}),
	oklch: ([l, c, h], alpha) => ({
		mode: "oklch",
		l: zero(l),
		c: zero(c),
		h,
		alpha,
	}),
	okhsv: ([h, s, v], alpha) => ({
		mode: "okhsv",
		h,
		s: zero(s),
		v: zero(v),
		alpha,
	}),
	xyz: ([x, y, z], alpha) => ({
		mode: "xyz65",
		x: zero(x),
		y: zero(y),
		z: zero(z),
		alpha,
	}),
	"xyz-d65": ([x, y, z], alpha) => ({
		mode: "xyz65",
		x: zero(x),
		y: zero(y),
		z: zero(z),
		alpha,
	}),
	"xyz-d50": ([x, y, z], alpha) => ({
		mode: "xyz50",
		x: zero(x),
		y: zero(y),
		z: zero(z),
		alpha,
	}),
};

/**
 * A colour as the hex React Native reads: `#rrggbb`, or `#rrggbbaa` when it is
 * translucent. Channels outside sRGB are clipped.
 */
const hex = (
	id: string,
	{ colorSpace, components, alpha }: ColorValueNormalized,
): string => {
	const toColor = Object.hasOwn(COLOR_SPACES, colorSpace)
		? COLOR_SPACES[colorSpace]
		: fail(
				id,
				`colour space ${colorSpace} is not supported`,
			);
	const color = toColor(
		[
			components[0] ?? undefined,
			components[1] ?? undefined,
			components[2] ?? undefined,
		],
		alpha,
	);
	return alpha < 1 ? formatHex8(color) : formatHex(color);
};

/** A length in pixels. `rem` counts 16 pixels; `em` needs a font size to mean anything. */
const pixels = (
	id: string,
	{ value, unit }: DimensionValue,
	fontSize?: number,
): number => {
	switch (unit) {
		case "px": {
			return value;
		}
		case "rem": {
			return tidy(value * REM);
		}
		case "em": {
			return fontSize === undefined
				? fail(
						id,
						"an em dimension only means something inside a typography token",
					)
				: tidy(value * fontSize);
		}
		default: {
			return fail(
				id,
				`unknown dimension unit ${JSON.stringify(unit)}`,
			);
		}
	}
};

const milliseconds = ({
	value,
	unit,
}: DurationValue): number =>
	unit === "s" ? tidy(value * 1000) : value;

const numeric = (id: string, value: unknown): number =>
	typeof value === "number"
		? value
		: fail(
				id,
				`expected a number, received ${JSON.stringify(value)}`,
			);

const shadow = (
	id: string,
	layers: readonly ShadowValueNormalized[],
): readonly Literal[] =>
	layers.map(layer => ({
		offsetX: pixels(id, layer.offsetX),
		offsetY: pixels(id, layer.offsetY),
		blurRadius: pixels(id, layer.blur),
		spreadDistance: pixels(id, layer.spread),
		color: hex(id, layer.color),
		...(layer.inset ? { inset: true } : {}),
	}));

/**
 * A type role as React Native's text style takes it: sizes in pixels, a line
 * height in pixels (a unitless line height multiplies the font size), the
 * weight as a string, and a family only when the token names one.
 */
const fontRole = (
	id: string,
	value: TypographyValueNormalized,
): Readonly<Record<string, Literal>> => {
	const fontSize = pixels(id, value.fontSize);
	const family: readonly string[] | string | undefined =
		value.fontFamily;
	const letterSpacing: DimensionValue | undefined =
		value.letterSpacing;
	const lineHeight =
		typeof value.lineHeight === "number"
			? tidy(value.lineHeight * fontSize)
			: pixels(id, value.lineHeight, fontSize);
	const fontFamily =
		typeof family === "string" ? family : family?.[0];
	return {
		...(fontFamily === undefined ? {} : { fontFamily }),
		fontSize,
		lineHeight,
		fontWeight: String(numeric(id, value.fontWeight)),
		...(letterSpacing === undefined
			? {}
			: {
					letterSpacing: pixels(
						id,
						letterSpacing,
						fontSize,
					),
				}),
	};
};

const literal = (token: TokenNormalized): Literal => {
	switch (token.$type) {
		case "color": {
			return hex(token.id, token.$value);
		}
		case "dimension": {
			return pixels(token.id, token.$value);
		}
		case "duration": {
			return milliseconds(token.$value);
		}
		case "cubicBezier": {
			return token.$value.map(point =>
				numeric(token.id, point),
			);
		}
		case "number":
		case "boolean":
		case "string": {
			return token.$value;
		}
		case "fontWeight": {
			return String(token.$value);
		}
		case "fontFamily": {
			return (
				token.$value[0] ?? fail(token.id, "no font family")
			);
		}
		case "shadow": {
			return shadow(token.id, token.$value);
		}
		case "typography": {
			return fontRole(token.id, token.$value);
		}
		default: {
			return fail(
				token.id,
				`$type ${token.$type} has no React Native form`,
			);
		}
	}
};

/** Places a value in the group at its path below `sys`, with every segment in camelCase. */
const place = (
	group: Group,
	path: readonly string[],
	value: Literal,
	id: string,
): void => {
	const [head, ...rest] = path;
	if (head === undefined) {
		return fail(
			id,
			"a token sits directly on the sys group",
		);
	}
	const key = camelCase(head);
	const existing = group.get(key);
	if (rest.length === 0) {
		if (existing !== undefined) {
			return fail(id, `two tokens map to the key ${key}`);
		}
		group.set(key, { kind: "value", value });
		return undefined;
	}
	if (existing?.kind === "value") {
		return fail(id, `${key} is both a token and a group`);
	}
	const children: Group = existing?.children ?? new Map();
	group.set(key, { kind: "group", children });
	return place(children, rest, value, id);
};

const themeOf = (tokens: TokenNormalizedSet): Group => {
	const theme: Group = new Map();
	for (const token of Object.values(tokens)) {
		const [root, ...path] = token.id.split(".");
		if (root === ROOT) {
			place(theme, path, literal(token), token.id);
		}
	}
	return theme;
};

const IDENTIFIER = /^(?:[A-Za-z_$][\w$]*|0|[1-9]\d*)$/;

const propertyKey = (key: string): string =>
	IDENTIFIER.test(key) ? key : JSON.stringify(key);

const isList = (
	value: Literal,
): value is readonly Literal[] => Array.isArray(value);

const block = (
	entries: readonly (readonly [string, string])[],
	depth: number,
): string =>
	`{\n${entries
		.map(
			([key, item]) =>
				`${"\t".repeat(depth + 1)}${propertyKey(key)}: ${item},\n`,
		)
		.join("")}${"\t".repeat(depth)}}`;

const serialize = (
	value: Literal,
	depth: number,
): string => {
	if (typeof value !== "object") {
		return typeof value === "string"
			? JSON.stringify(value)
			: String(value);
	}
	if (isList(value)) {
		return value.every(item => typeof item !== "object")
			? `[${value.map(item => serialize(item, depth)).join(", ")}]`
			: `[\n${value.map(item => `${"\t".repeat(depth + 1)}${serialize(item, depth + 1)},\n`).join("")}${"\t".repeat(depth)}]`;
	}
	return block(
		Object.entries(value).map(([key, item]) => [
			key,
			serialize(item, depth + 1),
		]),
		depth,
	);
};

const serializeGroup = (
	group: Group,
	depth: number,
): string =>
	block(
		[...group].map(([key, node]) => [
			key,
			node.kind === "group"
				? serializeGroup(node.children, depth + 1)
				: serialize(node.value, depth + 1),
		]),
		depth,
	);

/** Narrows the recommended typography rule to the properties a kit token sets, unless the project chose its own list. */
const narrowTypographyRule: NonNullable<
	Plugin["config"]
> = config => {
	const rule = config.lint.rules[VALID_TYPOGRAPHY];
	if (rule === undefined) {
		return undefined;
	}
	const [severity, options]: readonly [
		(typeof rule)[0],
		unknown,
	] = rule;
	const set =
		typeof options === "object" && options !== null
			? options
			: {};
	if (!("requiredProperties" in set)) {
		config.lint.rules[VALID_TYPOGRAPHY] = [
			severity,
			{
				...set,
				requiredProperties: [...TYPOGRAPHY_PROPERTIES],
			},
		];
	}
	return undefined;
};

/**
 * A Terrazzo plugin that turns the `sys` group of any resolver into the typed
 * Unistyles themes the kit's components read. It applies the resolver's `theme`
 * modifier once per context, `light` and `dark`, and writes one TypeScript file
 * that exports both, typed `SysTheme` (an annotation rather than `satisfies`,
 * so the file also passes `isolatedDeclarations`).
 *
 * Every kebab-case token name becomes a camelCase key. Colours become hex
 * (8-digit when translucent), dimensions and durations become numbers (pixels
 * and milliseconds), a cubic Bézier becomes its four points, a shadow becomes
 * React Native `boxShadow` layers and a typography token becomes a `FontRole`.
 * A role with no `fontFamily` is drawn in the system font, so the plugin lets
 * typography tokens leave the family out: it narrows Terrazzo's
 * `core/valid-typography` rule to `fontSize`, `fontWeight` and `lineHeight`
 * unless the config sets that rule's `requiredProperties` itself.
 *
 * @example
 *   // terrazzo.config.ts
 *   import { defineConfig } from "@terrazzo/cli";
 *   import reactNativeTheme from "@maanlamp/react-native-ui/terrazzo";
 *
 *   export default defineConfig({
 *   	tokens: ["./src/theme/tokens/app.resolver.json"],
 *   	outDir: "./src/theme/",
 *   	plugins: [reactNativeTheme()],
 *   });
 */
const reactNativeTheme = (
	options: ReactNativeThemeOptions = {},
): Plugin => {
	const filename = options.filename ?? "theme.gen.ts";
	const themeModule =
		options.themeModule ??
		"@maanlamp/react-native-ui/theme";
	return {
		name: NAME,
		config: narrowTypographyRule,
		build: ({ resolver, outputFile }) => {
			const contexts =
				resolver.source.modifiers?.theme?.contexts;
			const missing = THEMES.filter(
				theme => contexts?.[theme] === undefined,
			);
			if (missing.length > 0) {
				fail(
					"resolver",
					`the resolver needs a theme modifier with the contexts ${THEMES.join(" and ")} (missing ${missing.join(", ")})`,
				);
			}
			const themes = THEMES.map(
				theme =>
					`export const ${theme}: SysTheme = ${serializeGroup(themeOf(resolver.apply({ theme })), 0)};\n`,
			);
			outputFile(
				filename,
				[
					`// Generated by \`tz build\` through ${NAME}. Do not edit.\n`,
					`import type { SysTheme } from ${JSON.stringify(themeModule)};\n`,
					...themes,
				].join("\n"),
			);
		},
	};
};

export default reactNativeTheme;
