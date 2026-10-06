import { Link } from "@a01sa01to/ui";
import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SubmitEvent } from "react";
import { createNewData, getAllData, getAllData$$key } from "./-we.functions";

const weQueryOptions = () =>
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
			alert(`エラー: ${error.message}`);
		},
		onSuccess: ({ alreadyExists }) => {
			if (alreadyExists) {
				alert("このURLは既に存在します。");
			}
			console.log("Success");
			queryClient.invalidateQueries(weQueryOptions());
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
		<div>
			<form onSubmit={handleSubmit}>
				<input name="url" type="text" placeholder="Enter URL" required />
				<button type="submit" disabled={mutation.isPending}>
					{mutation.isPending ? "Submitting..." : "Submit"}
				</button>
			</form>
			<Link href="/admin/we">Close</Link>
		</div>
	);
}
