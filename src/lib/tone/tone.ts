import type { StatusName, SysTheme } from "../../theme";

/** A tone a component takes: the brand, or one of the status groups. */
export type ToneName = "brand" | StatusName;

/** What a tone paints: its container with the ink on it, and the solid fill with the ink on that. */
export type TonePaint = Readonly<{
	bg: string;
	fg: string;
	solid: string;
	onSolid: string;
}>;

/** Every tone, in the order a component lists its variants. */
export const TONES: readonly ToneName[] = [
	"brand",
	"success",
	"info",
	"warning",
	"error",
	"neutral",
];

/**
 * The paint a tone names: the brand's container and fill, or a status group's
 * container, whose solid form swaps its fill and ink.
 *
 * @example
 *   backgroundColor: tonePaint(theme.color, "error").solid;
 */
export const tonePaint = (
	color: SysTheme["color"],
	tone: ToneName,
): TonePaint =>
	tone === "brand"
		? {
				bg: color.primaryContainer,
				fg: color.onPrimaryContainer,
				solid: color.primary,
				onSolid: color.onPrimary,
			}
		: {
				bg: color[tone].bg,
				fg: color[tone].fg,
				solid: color[tone].fg,
				onSolid: color[tone].bg,
			};
