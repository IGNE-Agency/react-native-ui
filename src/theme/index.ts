import { StyleSheet } from "react-native-unistyles";

import type { SysTheme, SysThemes } from "./sys";

export type {
	CubicBezier,
	FontRole,
	IdentityRole,
	StatusName,
	StatusRole,
	SysTheme,
	SysThemes,
	UnitStep,
} from "./sys";

declare module "react-native-unistyles" {
	// oxlint-disable-next-line typescript/consistent-type-definitions
	export interface UnistylesThemes {
		light: SysTheme;
		dark: SysTheme;
	}
}

/**
 * Hands Unistyles the app's light and dark themes and lets it follow the
 * system's appearance. Call it once, before the first render, with the themes
 * `tz build` generated through the kit's Terrazzo plugin.
 *
 * @example
 *   import { registerTheme } from "@igne-agency/react-native-ui/theme";
 *   import { dark, light } from "./theme.gen";
 *
 *   registerTheme({ light, dark });
 */
export const registerTheme = (themes: SysThemes): void => {
	StyleSheet.configure({
		themes,
		settings: { adaptiveThemes: true },
	});
};
