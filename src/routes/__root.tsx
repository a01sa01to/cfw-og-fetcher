import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext()({
	shellComponent: RootComponent,
});

function RootComponent() {
	return <Outlet />;
}
