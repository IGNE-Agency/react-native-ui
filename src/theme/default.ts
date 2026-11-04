import { dark, light } from "./default.gen";
import { registerTheme } from "./index";

/**
 * Registers the kit's own default themes. Importing this module is all a
 * project needs to render kit components with no token files of its own.
 *
 * @example
 *   import "@maanlamp/react-native-ui/theme/default";
 */
registerTheme({ light, dark });

export { dark, light };
