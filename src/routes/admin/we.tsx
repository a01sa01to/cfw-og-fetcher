import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/we")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/we"!</div>;
}
