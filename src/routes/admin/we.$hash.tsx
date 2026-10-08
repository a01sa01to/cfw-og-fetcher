import { Button, H2, Link, toast, Ul } from "@a01sa01to/ui";
import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import Card from "~/components/Card";
import Image from "~/components/Image";
import {
	deleteDataByHash,
	fetchDataByHash,
	getAllData$$key,
	getDataByHash,
	getDataByHash$$key,
} from "./-we.functions";
import styles from "./we.module.css";

const QueryOptions = (hash: string) =>
	queryOptions({
		queryKey: getDataByHash$$key(hash),
		queryFn: () => getDataByHash({ data: hash }),
		refetchInterval: 1000 * 60, // 1 minute
	});

export const Route = createFileRoute("/admin/we/$hash")({
	component: RouteComponent,
	loader: ({ context, params }) =>
		context.queryClient.query(QueryOptions(params.hash)),
});

function RouteComponent() {
	const { hash } = Route.useParams();
	const { data } = useSuspenseQuery(QueryOptions(hash));
	const queryClient = useQueryClient();
	const deleteDataFn = useServerFn(deleteDataByHash);
	const fetchDataFn = useServerFn(fetchDataByHash);
	const navigate = useNavigate();

	const deleteMutation = useMutation({
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

	const crawlMutation = useMutation({
		mutationFn: (hash: string) => fetchDataFn({ data: hash }),
		onError: (error) => {
			console.error("Enqueue failed:", error);
			toast.push({
				type: "error",
				title: "Error",
				description: error.message,
			});
		},
		onSuccess: () => {
			toast.push({
				type: "success",
				title: "Enqueued for crawling",
			});
		},
	});

	const handleDelete = () => {
		if (confirm("Are you sure?")) deleteMutation.mutate(hash);
	};

	const handleCrawl = () => {
		if (crawlMutation.isPending) return;
		crawlMutation.mutate(hash);
	};

	if (!data) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>
					<code className={styles.edithash}>{hash}</code>
				</p>
				<p>Not found</p>
				<Button onClick={handleDelete} variant="outline" size="large">
					Delete
				</Button>
			</Card>
		);
	}

	return (
		<Card>
			<H2>Edit</H2>
			<p>
				<code className={styles.edithash}>{data.hash}</code>
			</p>
			<div className={styles.faviconContainer}>
				<Image
					src={`/api/we/${data.hash}/fav?t=${data.fetchedAt?.getTime() ?? 0}`}
					alt="Favicon Preview"
					className={styles.faviconImage}
				/>
				<Link href={data.url} className={styles.favlink}>
					{data.url}
				</Link>
			</div>
			<div className={styles.linkcard}>
				<Image
					src={`/api/we/${data.hash}/img?t=${data.fetchedAt?.getTime() ?? 0}`}
					alt="Preview"
					className={styles.previewImage}
				/>
				<p className={styles.title}>{data.title ?? "-"}</p>
				<p className={styles.description}>{data.description ?? "-"}</p>
			</div>
			<Ul spacing="4" className={styles.details}>
				<li>
					<strong>Created At:</strong>{" "}
					<time dateTime={data.createdAt.toISOString()}>
						{new Date(data.createdAt).toLocaleString()}
					</time>
				</li>
				<li>
					<strong>Fetched At:</strong>{" "}
					{data.fetchedAt ? (
						<time dateTime={data.fetchedAt.toISOString()}>
							{new Date(data.fetchedAt).toLocaleString()}
						</time>
					) : (
						"-"
					)}
				</li>
				<li>
					<strong>Last Reference:</strong>{" "}
					{data.lastReference ? (
						<time dateTime={data.lastReference.toISOString()}>
							{new Date(data.lastReference).toLocaleString()}
						</time>
					) : (
						"-"
					)}
				</li>
				<li>
					<strong>Last Crawl Status:</strong> {data.lastCrawlStatus ?? "-"}
				</li>
			</Ul>
			<div className={styles.actions}>
				<Button
					onClick={handleCrawl}
					variant="solid-fill"
					size="large"
					aria-disabled={crawlMutation.isPending}
				>
					{crawlMutation.isPending ? "Enqueuing..." : "Crawl Enqueue"}
				</Button>
				<Button onClick={handleDelete} variant="outline" size="large">
					Delete
				</Button>
			</div>
		</Card>
	);
}
