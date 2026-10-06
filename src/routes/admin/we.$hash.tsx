import { Button, H2, toast } from "@a01sa01to/ui";
import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import Card from "~/components/Card";
import {
	deleteDataByHash,
	getAllData$$key,
	getDataByHash,
	getDataByHash$$key,
} from "./-we.functions";

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
	const queryClient = useQueryClient();
	const deleteDataFn = useServerFn(deleteDataByHash);
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: (hash: string) => deleteDataFn({ data: hash }),
		onError: (error) => {
			console.error("Delete failed:", error);
			toast.push({
				type: "error",
				title: "Error",
				description: error.message,
			});
		},
		onSuccess: ({ hash }) => {
			toast.push({
				type: "success",
				title: "Deleted",
			});
			queryClient.invalidateQueries(QueryOptions(hash));
			queryClient.invalidateQueries({ queryKey: getAllData$$key() });
			navigate({ to: "/admin/we" });
		},
	});

	const handleDelete = () => {
		if (confirm("Are you sure?")) mutation.mutate(hash);
	};

	if (!data) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>Not found: {hash}</p>
				<Button onClick={handleDelete} variant="outline" size="large">
					Delete
				</Button>
			</Card>
		);
	}

	if (data.fetchedAt === null) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>Hash: {data.hash}</p>
				<p>URL: {data.url}</p>
				<p>Created At: {new Date(data.createdAt).toLocaleString()}</p>
				<p>Note: not crawled yet.</p>
				<Button onClick={handleDelete} variant="outline" size="large">
					Delete
				</Button>
			</Card>
		);
	}

	return (
		<Card>
			<H2>Edit</H2>
			<p>Hash: {data.hash}</p>
			<p>URL: {data.url}</p>
			<p>Title: {data.title ?? "-"}</p>
			<p>Description: {data.description ?? "-"}</p>
			<p>Image: {data.image ?? "-"}</p>
			<p>Favicon: {data.favicon ?? "-"}</p>
			<p>Created At: {new Date(data.createdAt).toLocaleString()}</p>
			<p>Fetched At: {new Date(data.fetchedAt).toLocaleString()}</p>
			<p>
				Last Reference:{" "}
				{data.lastReference
					? new Date(data.lastReference).toLocaleString()
					: "-"}
			</p>
			<p>Last Crawl Status: {data.lastCrawlStatus ?? "-"}</p>
			<Button onClick={handleDelete} variant="outline" size="large">
				Delete
			</Button>
		</Card>
	);
}
