import { UtilLink } from "@a01sa01to/ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./card.module.css";

export default function Card({ children }: { children: ReactNode }) {
	return (
		<div className={styles.card}>
			<UtilLink href=".." className={styles.close}>
				Close
				<X />
			</UtilLink>
			{children}
		</div>
	);
}
