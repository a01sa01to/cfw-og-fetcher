import { type ComponentPropsWithRef, useEffect, useState } from "react";

export default function Image(props: ComponentPropsWithRef<"img">) {
	const [iserr, setIserr] = useState(false);
	const [prevsrc, setPrevsrc] = useState(props.src);

	useEffect(() => {
		if (props.src !== prevsrc) {
			setPrevsrc(props.src);
			setIserr(false);
		}
	}, [props.src, prevsrc]);

	if (iserr) {
		return (
			<div
				{...props}
				className={props.className}
				style={{
					width: props.width,
					height: props.height,
					backgroundColor: "#eee",
				}}
			/>
		);
	}

	return (
		// biome-ignore lint/a11y/useAltText: props をそのまま使ってるので
		<img
			{...props}
			onError={() => {
				setIserr(true);
			}}
		/>
	);
}
