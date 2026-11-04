import { view } from "./storybook.requires";

/**
 * The on-device Storybook UI. Selection isn't persisted, so the app needs no
 * storage module of its own.
 */
const StorybookUIRoot: ReturnType<
	typeof view.getStorybookUI
> = view.getStorybookUI({
	shouldPersistSelection: false,
	theme: {},
});

export default StorybookUIRoot;
