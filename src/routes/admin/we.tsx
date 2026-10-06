import { H1, Link } from "@a01sa01to/ui";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getAllData, getAllData$$key } from "./-we.functions";

const weQueryOptions = () =>
	queryOptions({
		queryKey: getAllData$$key(),
		queryFn: () => getAllData(),
	});

export const Route = createFileRoute("/admin/we")({
	component: RouteComponent,
	loader: ({ context }) =>
		context.queryClient.query({
			...weQueryOptions(),
			staleTime: "static",
		}),
});

function RouteComponent() {
	const { data } = useSuspenseQuery(weQueryOptions());

	return (
		<>
			<div>
				<H1>Websites</H1>
				<pre>{JSON.stringify(data, null, 2)}</pre>
				<Link href="/admin/we/new">Add New</Link>
			</div>
			<Outlet />
		</>
	);
}
