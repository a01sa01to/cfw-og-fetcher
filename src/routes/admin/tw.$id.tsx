import { Button, H2, toast, Ul } from "@a01sa01to/ui";
import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import Card from "~/components/Card";
import { getTweetTime } from "~/utils/get-tweet-time";
import {
	deleteTweetById,
	fetchTweetById,
	getAllTweets$$key,
	getTweetById,
	getTweetById$$key,
} from "./-tw.functions";
import styles from "./tw.module.css";

const QueryOptions = (id: string) =>
	queryOptions({
		queryKey: getTweetById$$key(id),
		queryFn: () => getTweetById({ data: id }),
		refetchInterval: 1000 * 60, // 1 minute
	});

export const Route = createFileRoute("/admin/tw/$id")({
	component: RouteComponent,
	loader: ({ context, params }) =>
		context.queryClient.query(QueryOptions(params.id)),
});

function RouteComponent() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(QueryOptions(id));
	const queryClient = useQueryClient();
	const deleteDataFn = useServerFn(deleteTweetById);
	const fetchDataFn = useServerFn(fetchTweetById);
	const navigate = useNavigate();

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteDataFn({ data: id }),
		onError: (error) => {
			console.error("Delete failed:", error);
			toast.push({
				type: "error",
				title: "Error",
				description: error.message,
			});
		},
		onSuccess: async ({ id }) => {
			toast.push({
				type: "success",
				title: "Deleted",
			});
			await queryClient.invalidateQueries({ queryKey: getAllTweets$$key() });
			await navigate({ to: "/admin/tw" });
			queryClient.removeQueries({ queryKey: getTweetById$$key(id) });
		},
	});

	const crawlMutation = useMutation({
		mutationFn: (id: string) => fetchDataFn({ data: id }),
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
		if (confirm("Are you sure?")) deleteMutation.mutate(id);
	};

	const handleCrawl = () => {
		if (crawlMutation.isPending) return;
		crawlMutation.mutate(id);
	};

	if (!data) {
		return (
			<Card>
				<H2>Edit</H2>
				<p>
					<code className={styles.twid}>{id}</code>
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
				<code className={styles.twid}>{data.idStr}</code>
			</p>
			<Ul spacing="4" className={styles.details}>
				<li>
					<strong>Author:</strong>{" "}
					{data.authorName && data.authorScreenName
						? `${data.authorName} (@${data.authorScreenName})`
						: "-"}
				</li>
				<li>
					<strong>Text:</strong>{" "}
					{data.text ? (
						<span className={styles.text}>
							{data.text.split("\n").map((line, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: 行は static なので
								<span key={index}>
									{line}
									<br />
								</span>
							))}
						</span>
					) : (
						"-"
					)}
				</li>
				<li>
					<strong>Tweeted At:</strong>{" "}
					{data.idStr ? (
						<time dateTime={getTweetTime(data.idStr).toISOString()}>
							{getTweetTime(data.idStr).toLocaleString()}
						</time>
					) : (
						"-"
					)}
				</li>
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
					<strong>Deleted:</strong> {data.tweetDeleted ? "Yes" : "No"}
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
