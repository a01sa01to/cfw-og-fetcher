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
import {
	createNewTweet,
	getAllTweets,
	getAllTweets$$key,
} from "./-tw.functions";

const QueryOptions = () =>
	queryOptions({
		queryKey: getAllTweets$$key(),
		queryFn: () => getAllTweets(),
		refetchInterval: 1000 * 60, // 1 minute
	});

export const Route = createFileRoute("/admin/tw/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const createDataFn = useServerFn(createNewTweet);
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: (id: string) => createDataFn({ data: id }),
		onError: (error) => {
			console.error("Mutation failed:", error);
			toast.push({
				type: "error",
				title: "Error",
				description: error.message,
			});
		},
		onSuccess: ({ alreadyExists, id }) => {
			if (alreadyExists) {
				toast.push({
					type: "warning",
					title: "Already exists",
					description: `${id} is already in the database.`,
				});
			} else {
				toast.push({
					type: "success",
					title: "Added",
					description: `${id} has been added to the database.`,
				});
			}
			queryClient.invalidateQueries(QueryOptions());
			navigate({ to: "/admin/tw" });
		},
	});

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (mutation.isPending) return;
		const formData = new FormData(e.currentTarget);
		const id = formData.get("id");
		if (typeof id === "string") mutation.mutate(id);
	};

	return (
		<Card>
			<H2>Add New</H2>
			<form
				onSubmit={handleSubmit}
				style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
			>
				<Label>
					ID
					<Input name="id" type="id" required />
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
