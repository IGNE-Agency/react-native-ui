const { readFileSync, realpathSync } = require("node:fs");
const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const {
	withStorybook,
} = require("@storybook/react-native/metro/withStorybook");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath =
	require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts =
	config.resolver.assetExts.filter(ext => ext !== "svg");
config.resolver.sourceExts = [
	...config.resolver.sourceExts,
	"svg",
];

/**
 * The kit, linked from the checkout this app sits in (`bun link`).
 *
 * Metro follows the link to the kit's real folder, the parent of this one,
 * which is outside this project, so that folder is watched for the kit's
 * source to resolve. The kit's checkout carries its own `node_modules`, with
 * dev copies of react, react-native, unistyles and every other peer. A kit file
 * would resolve those copies first, and two Reacts (or two Unistyles
 * registries) break at runtime with nothing pointing at the cause. So every
 * import of a kit peer made from inside the kit, its own dependencies and the
 * stories included, is resolved as if this app had made it, which always lands
 * in this app's `node_modules`. The kit's own non-peer dependencies still
 * resolve from its checkout. This app's own files sit inside the kit's folder
 * too, and resolve as usual.
 */
const KIT = "@igne-agency/react-native-ui";

const APP_MODULES = path.join(__dirname, "node_modules");

const kitRoot = realpathSync(path.join(APP_MODULES, KIT));

/**
 * @param {string} dir
 * @param {string} file
 */
const inside = (dir, file) => {
	const relative = path.relative(dir, file);
	return (
		relative !== "" &&
		!relative.startsWith("..") &&
		!path.isAbsolute(relative)
	);
};

/** @type {readonly string[]} */
const peers = Object.keys(
	JSON.parse(
		readFileSync(
			path.join(kitRoot, "package.json"),
			"utf8",
		),
	).peerDependencies ?? {},
);

/** @param {string} name */
const isPeer = name =>
	peers.some(
		peer => name === peer || name.startsWith(`${peer}/`),
	);

const appOrigin = path.join(__dirname, "package.json");

config.watchFolders = [...config.watchFolders, kitRoot];

const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (
	context,
	moduleName,
	platform,
) => {
	const resolve = upstream ?? context.resolveRequest;
	const pinned =
		isPeer(moduleName) &&
		inside(kitRoot, context.originModulePath) &&
		!inside(__dirname, context.originModulePath);

	return pinned
		? resolve(
				{ ...context, originModulePath: appOrigin },
				moduleName,
				platform,
			)
		: resolve(context, moduleName, platform);
};

module.exports = withStorybook(config, {
	configPath: path.join(__dirname, ".rnstorybook"),
});
