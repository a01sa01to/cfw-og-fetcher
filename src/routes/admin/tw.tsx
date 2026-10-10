import { ButtonLink, H1, Table, UtilLink } from "@a01sa01to/ui";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { getTweetTime } from "~/utils/get-tweet-time";
import { getAllTweets, getAllTweets$$key } from "./-tw.functions";
import styles from "./tw.module.css";

const QueryOptions = () =>
	queryOptions({
		queryKey: getAllTweets$$key(),
		queryFn: () => getAllTweets(),
		refetchInterval: 1000 * 60, // 1 minute
	});

export const Route = createFileRoute("/admin/tw")({
	component: RouteComponent,
	loader: ({ context }) => context.queryClient.query(QueryOptions()),
});

function RouteComponent() {
	const { data } = useSuspenseQuery(QueryOptions());
	const location = useLocation();
	const isTop =
		location.pathname === "/admin/tw" || location.pathname === "/admin/tw/";

	return (
		<>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "2rem",
					gridArea: isTop ? "1 / 1 / 1 / 3" : "1 / 1 / 1 / 2",
				}}
			>
				<H1>Tweets</H1>
				<ButtonLink
					href="/admin/tw/new"
					size="large"
					variant="solid-fill"
					style={{ display: "flex", gap: "0.25rem", alignContent: "center" }}
				>
					<Plus /> Add New
				</ButtonLink>
				<Table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Author</th>
							<th>Body</th>
							<th>Tweeted At</th>
							<th>Last Fetched</th>
							<th>Last Reference</th>
							<th>Deleted</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr key={item.idStr}>
								<td className={styles.cell}>{item.idStr}</td>
								<td className={styles.cell}>
									{item.authorName && item.authorScreenName
										? `${item.authorName} (@${item.authorScreenName})`
										: "-"}
								</td>
								<td className={styles.cell}>{item.text ?? "-"}</td>
								<td className={styles.cell}>
									{item.idStr ? getTweetTime(item.idStr).toLocaleString() : "-"}
								</td>
								<td className={styles.cell}>
									{item.fetchedAt
										? new Date(item.fetchedAt).toLocaleString()
										: "-"}
								</td>
								<td className={styles.cell}>
									{item.lastReference
										? new Date(item.lastReference).toLocaleString()
										: "-"}
								</td>
								<td>{item.tweetDeleted ? "○" : ""}</td>
								<td>
									<UtilLink href={`/admin/tw/${item.idStr}`}>Edit</UtilLink>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			</div>
			<Outlet />
		</>
	);
}
