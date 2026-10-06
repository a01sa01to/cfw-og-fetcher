import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/we/$hash")({
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useMatch();

	return <div>{params.hash}</div>;
}
