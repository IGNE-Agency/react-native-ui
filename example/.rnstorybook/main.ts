import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
	// The kit's own source, one level above the example app.
	stories: ["../../src/**/*.stories.tsx"],
	deviceAddons: ["@storybook/addon-ondevice-controls"],
};

export default main;
