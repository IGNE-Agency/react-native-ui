import {
	createContext,
	useContext,
	type Context,
	type ReactNode,
} from "react";

type TimeZoneProviderProps = Readonly<{
	/** The IANA zone the app's users live in, such as "Europe/Amsterdam". */
	zone: string;
	children: ReactNode;
}>;

/** The zone `TimeZoneProvider` hands down, read raw where it has to be handed on. */
export const TimeZoneContext: Context<string | undefined> =
	createContext<string | undefined>(undefined);

/**
 * The time zone every "today" and every instant the kit shows or takes is read in.
 *
 * @example
 *   <TimeZoneProvider zone="Europe/Amsterdam">{app}</TimeZoneProvider>
 */
export const TimeZoneProvider = ({
	zone,
	children,
}: TimeZoneProviderProps): ReactNode => (
	<TimeZoneContext.Provider value={zone}>
		{children}
	</TimeZoneContext.Provider>
);

/**
 * The IANA zone of the nearest `TimeZoneProvider`; it throws where there is none.
 *
 * @example
 *   const zone = useTimeZone(); // "Europe/Amsterdam"
 */
export const useTimeZone = (): string => {
	const zone = useContext(TimeZoneContext);
	if (zone === undefined) {
		throw new Error(
			"useTimeZone must be used inside a TimeZoneProvider",
		);
	}
	return zone;
};
