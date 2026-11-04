import {
	createContext,
	Fragment,
	useContext,
	useLayoutEffect,
	useState,
	useSyncExternalStore,
	type ReactNode,
} from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { TimeZoneContext } from "../../lib/dates/time-zone";
import {
	fieldContext,
	formContext,
} from "../../lib/forms/context";

/** How far a sheet in the stack covers what is under it, and where its top edge is. */
export type SheetMotion = Readonly<{
	/** From 0 while closed to 1 at its first stop; always 0 for a sheet that is not modal. */
	pull: SharedValue<number>;
	/** The y of its top edge in the host. */
	edge: SharedValue<number>;
}>;

type Member = Readonly<{
	token: object;
	key: number;
	motion: SheetMotion;
}>;

type Stack = Readonly<{
	subscribe: (listener: () => void) => () => void;
	members: () => readonly Member[];
	bodies: () => ReadonlyMap<object, ReactNode>;
	join: (token: object, motion: SheetMotion) => void;
	leave: (token: object) => void;
	show: (token: object, body: ReactNode) => void;
}>;

const createStack = (): Stack => {
	let members: readonly Member[] = [];
	let bodies: ReadonlyMap<object, ReactNode> = new Map();
	let joined = 0;
	const listeners = new Set<() => void>();
	const publish = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	return {
		subscribe: listener => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		members: () => members,
		bodies: () => bodies,
		join: (token, motion) => {
			joined += 1;
			members = [
				...members,
				{ token, key: joined, motion },
			];
			publish();
		},
		leave: token => {
			members = members.filter(
				member => member.token !== token,
			);
			bodies = new Map(
				[...bodies].filter(([owner]) => owner !== token),
			);
			publish();
		},
		show: (token, body) => {
			if (bodies.get(token) === body) {
				return;
			}
			bodies = new Map(bodies).set(token, body);
			publish();
		},
	};
};

const StackContext = createContext<Stack | undefined>(
	undefined,
);

const useStack = (): Stack => {
	const stack = useContext(StackContext);
	if (stack === undefined) {
		throw new Error(
			"Sheet.Root must be rendered inside a SheetHost",
		);
	}
	return stack;
};

/**
 * The motion of every sheet the nearest `SheetHost` draws above the one `token`
 * stands for, lowest first.
 *
 * @example
 *   const above = useSheetsAbove(token);
 */
export const useSheetsAbove = (
	token: object,
): readonly SheetMotion[] => {
	const stack = useStack();
	const members = useSyncExternalStore(
		stack.subscribe,
		stack.members,
	);
	const at = members.findIndex(
		member => member.token === token,
	);
	return at === -1
		? []
		: members.slice(at + 1).map(member => member.motion);
};

/**
 * Draws `body` in the nearest `SheetHost`, above everything mounted before it,
 * for as long as the calling component is mounted. The time zone and the form
 * and field contexts where it is called reach `body` there.
 *
 * @example
 *   const [token] = useState<object>(() => ({}));
 *   useSheetLayer(token, { pull, edge }, <BottomSheet>{children}</BottomSheet>);
 */
export const useSheetLayer = (
	token: object,
	motion: SheetMotion,
	body: ReactNode,
): void => {
	const stack = useStack();
	const zone = useContext(TimeZoneContext);
	const form = useContext(formContext);
	const field = useContext(fieldContext);
	const { pull, edge } = motion;
	const carried = (
		<TimeZoneContext.Provider value={zone}>
			<formContext.Provider value={form}>
				<fieldContext.Provider value={field}>
					{body}
				</fieldContext.Provider>
			</formContext.Provider>
		</TimeZoneContext.Provider>
	);

	useLayoutEffect(() => {
		stack.join(token, { pull, edge });
		return () => stack.leave(token);
	}, [stack, token, pull, edge]);

	useLayoutEffect(() => {
		stack.show(token, carried);
	});
};

const Layers = ({
	stack,
}: Readonly<{ stack: Stack }>): ReactNode => {
	const members = useSyncExternalStore(
		stack.subscribe,
		stack.members,
	);
	const bodies = useSyncExternalStore(
		stack.subscribe,
		stack.bodies,
	);

	return members.map(member => (
		<Fragment key={member.key}>
			{bodies.get(member.token)}
		</Fragment>
	));
};

type SheetHostProps = Readonly<{
	children: ReactNode;
}>;

/**
 * Where every kit sheet is drawn: mounted once around the app, under its
 * gesture, safe-area, keyboard and app-wide providers, it lays each open sheet
 * over the app and over the sheets opened before it, wherever the sheet was
 * declared.
 *
 * @example
 *   <SheetHost>
 *   	<RootNavigator />
 *   </SheetHost>
 */
export const SheetHost = ({
	children,
}: SheetHostProps): ReactNode => {
	const [stack] = useState(createStack);

	return (
		<StackContext.Provider value={stack}>
			<View style={styles.host}>
				{children}
				<Layers stack={stack} />
			</View>
		</StackContext.Provider>
	);
};

const styles = StyleSheet.create({
	host: { flex: 1 },
});
