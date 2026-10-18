import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
	loader: () => {
		throw Route.redirect({ to: "/admin/we" });
	},
});
