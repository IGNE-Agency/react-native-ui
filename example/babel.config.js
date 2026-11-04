const { realpathSync } = require("node:fs");
const path = require("node:path");

const KIT = "@maanlamp/react-native-ui";

/** Compares paths with forward slashes, whichever separator Babel hands over. */
const slashed = file => file.replaceAll("\\", "/");

/**
 * The kit's source, wherever Metro finds it: under `node_modules` when it is
 * installed, or at the linked checkout's real path (the parent of this app),
 * since Metro follows `bun link`'s symlink.
 */
const kitSource = path.join(
	realpathSync(path.join(__dirname, "node_modules", KIT)),
	"src",
);

const appSource = `${slashed(path.join(__dirname, "src"))}/`;

const kitPaths = [`/${KIT}/`, `${slashed(kitSource)}/`];

/**
 * Whether the React Compiler compiles a file: this app's source and the kit's.
 *
 * @param {string} filename
 */
const compiled = filename => {
	const file = slashed(filename);
	return (
		file.startsWith(appSource) ||
		kitPaths.some(kit => file.includes(kit))
	);
};

module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			["babel-preset-expo", { reactCompiler: false }],
		],
		plugins: [
			[
				"react-native-unistyles/plugin",
				{
					root: "src",
					// The plugin matches each path as a substring of the file's
					// name, after converting it to the platform's separator.
					autoProcessPaths: [
						KIT,
						`${kitSource}${path.sep}`,
					],
				},
			],
			[
				"babel-plugin-react-compiler",
				{ target: "19", sources: compiled },
			],
		],
	};
};
