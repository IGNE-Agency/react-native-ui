import { defineConfig } from "@terrazzo/cli";

import reactNativeTheme from "./src/terrazzo";

/**
 * Builds the kit's default themes from its own token files. Apps run the
 * published plugin (`@maanlamp/react-native-ui/terrazzo`) against their own
 * resolver instead; this config imports the plugin's source so `bun run tokens`
 * needs no build first.
 */
export default defineConfig({
	tokens: ["./tokens/kit.resolver.json"],
	outDir: "./src/theme/",
	plugins: [
		reactNativeTheme({
			filename: "default.gen.ts",
			themeModule: "./sys",
		}),
	],
});
