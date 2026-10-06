import { H2 } from "@a01sa01to/ui";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Card from "~/components/Card";
import { getDataByHash, getDataByHash$$key } from "./-we.functions";

const QueryOptions = (hash: string) =>
	queryOptions({
		queryKey: getDataByHash$$key(hash),
		queryFn: () => getDataByHash({ data: hash }),
	});

export const Route = createFileRoute("/admin/we/$hash")({
	component: RouteComponent,
	loader: ({ context, params }) =>
		context.queryClient.query({
			...QueryOptions(params.hash),
			staleTime: "static",
		}),
});

function RouteComponent() {
	const { hash } = Route.useParams();
	const { data } = useSuspenseQuery(QueryOptions(hash));

	if (!data) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>Not found: {hash}</p>
			</Card>
		);
	}

	if (data.createdAt.valueOf() === data.updatedAt.valueOf()) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>URL: {data.url}</p>
				<p>Created At: {new Date(data.createdAt).toLocaleString()}</p>
				<p>Last Updated: {new Date(data.updatedAt).toLocaleString()}</p>
				<p>Hash: {data.hash}</p>
				<p>Note: not crawled yet.</p>
			</Card>
		);
	}

	return (
		<Card>
			<H2>Edit</H2>
			<p>URL: {data.url}</p>
			<p>Title: {data.title ?? "-"}</p>
			<p>Description: {data.description ?? "-"}</p>
			<p>Image: {data.image ?? "-"}</p>
			<p>Favicon: {data.favicon ?? "-"}</p>
			<p>Created At: {new Date(data.createdAt).toLocaleString()}</p>
			<p>Last Updated: {new Date(data.updatedAt).toLocaleString()}</p>
			<p>Hash: {data.hash}</p>
		</Card>
	);
}
