import { ButtonLink, H1, Table, UtilLink } from "@a01sa01to/ui";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { getAllData, getAllData$$key } from "./-we.functions";
import styles from "./we.module.css";

const QueryOptions = () =>
	queryOptions({
		queryKey: getAllData$$key(),
		queryFn: () => getAllData(),
		refetchInterval: 1000 * 60, // 1 minute
	});

export const Route = createFileRoute("/admin/we")({
	component: RouteComponent,
	loader: ({ context }) => context.queryClient.query(QueryOptions()),
});

function RouteComponent() {
	const { data } = useSuspenseQuery(QueryOptions());
	const location = useLocation();
	const isTop =
		location.pathname === "/admin/we" || location.pathname === "/admin/we/";

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
				<H1>Websites</H1>
				<ButtonLink
					href="/admin/we/new"
					size="large"
					variant="solid-fill"
					style={{ display: "flex", gap: "0.25rem", alignContent: "center" }}
				>
					<Plus /> Add New
				</ButtonLink>
				<Table>
					<thead>
						<tr>
							<th>URL</th>
							<th>Title</th>
							<th>Created</th>
							<th>Last Fetched</th>
							<th>Last Reference</th>
							<th>Last Crawl Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr key={item.hash}>
								<td className={styles.cell}>
									<UtilLink href={item.url} className={styles.link}>
										{item.url}
									</UtilLink>
								</td>
								<td className={styles.cell}>{item.title ?? "-"}</td>
								<td className={styles.cell}>
									{new Date(item.createdAt).toLocaleString()}
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
								<td className={styles.cell}>{item.lastCrawlStatus ?? "-"}</td>
								<td>
									<UtilLink href={`/admin/we/${item.hash}`}>Edit</UtilLink>
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
