import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import   "@a01sa01to/ui/layer.css"
import   "@a01sa01to/ui/reset.css"
import   "@a01sa01to/ui/style.css"
import Header from "~/components/Header";
import { MainContainer } from "@a01sa01to/ui";

import { configureAdapter } from "@a01sa01to/ui";
import { Link } from "@tanstack/react-router";

configureAdapter("link", ({href, ...props}) => <Link {...props}  to={href}/>);

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "OG Fetcher",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
        <Header />
        <MainContainer>
				{children}
        </MainContainer>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
				<Scripts />
			</body>
		</html>
	);
}
