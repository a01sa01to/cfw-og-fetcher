import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/tw")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/tw"!</div>;
}
