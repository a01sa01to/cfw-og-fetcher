import { Button, H2, Input, Label, toast } from "@a01sa01to/ui";
import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SubmitEvent } from "react";
import Card from "~/components/Card";
import { createNewData, getAllData, getAllData$$key } from "./-we.functions";

const QueryOptions = () =>
	queryOptions({
		queryKey: getAllData$$key(),
		queryFn: () => getAllData(),
	});

export const Route = createFileRoute("/admin/we/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const createDataFn = useServerFn(createNewData);
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: (variables: { url: string }) =>
			createDataFn({ data: variables }),
		onError: (error) => {
			console.error("Mutation failed:", error);
			toast.push({
				type: "error",
				title: "Error",
				description: error.message,
			});
		},
		onSuccess: ({ alreadyExists, url }) => {
			if (alreadyExists) {
				toast.push({
					type: "warning",
					title: "Already exists",
					description: `${url} is already in the database.`,
				});
			} else {
				toast.push({
					type: "success",
					title: "Added",
					description: `${url} has been added to the database.`,
				});
			}
			queryClient.invalidateQueries(QueryOptions());
			navigate({ to: "/admin/we" });
		},
	});

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const url = formData.get("url");
		if (typeof url === "string") mutation.mutate({ url });
	};

	return (
		<Card>
			<H2>Add New</H2>
			<form
				onSubmit={handleSubmit}
				style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
			>
				<Label>
					URL
					<Input name="url" type="url" required />
				</Label>
				<br />
				<Button
					type="submit"
					aria-disabled={mutation.isPending}
					size="medium"
					variant="outline"
				>
					{mutation.isPending ? "Loading..." : "Add"}
				</Button>
			</form>
		</Card>
	);
}
