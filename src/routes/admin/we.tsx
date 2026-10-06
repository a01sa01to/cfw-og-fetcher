import { ButtonLink, H1, Table, UtilLink } from "@a01sa01to/ui";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { getAllData, getAllData$$key } from "./-we.functions";

const QueryOptions = () =>
	queryOptions({
		queryKey: getAllData$$key(),
		queryFn: () => getAllData(),
	});

export const Route = createFileRoute("/admin/we")({
	component: RouteComponent,
	loader: ({ context }) =>
		context.queryClient.query({
			...QueryOptions(),
			staleTime: "static",
		}),
});

function RouteComponent() {
	const { data } = useSuspenseQuery(QueryOptions());

	return (
		<>
			<div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
							<th>Created At</th>
							<th>Last Updated</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr key={item.hash}>
								<td>{item.url}</td>
								<td>{item.title ?? "-"}</td>
								<td>{new Date(item.createdAt).toLocaleString()}</td>
								<td>{new Date(item.updatedAt).toLocaleString()}</td>
								<td>
									<UtilLink href={item.url}>View</UtilLink>
									{" / "}
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
