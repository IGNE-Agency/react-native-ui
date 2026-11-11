#!/usr/bin/env bun
import { pathToFileURL } from "node:url";

import {
	buildCmd,
	cwd,
	resolveConfig,
} from "@terrazzo/cli";
import {
	type Config,
	defineConfig,
	Logger,
} from "@terrazzo/parser";

type ConfigModule = Readonly<{ default: Config }>;

const configPath = resolveConfig();

if (configPath === undefined) {
	throw new Error(
		"No terrazzo.config found in the working directory.",
	);
}

const configModule: ConfigModule = await import(
	pathToFileURL(configPath).href
);

const logger = new Logger();

await buildCmd({
	config: defineConfig(configModule.default, {
		cwd,
		logger,
	}),
	configPath,
	flags: {},
	logger,
});
