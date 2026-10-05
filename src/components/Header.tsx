import { Header as HeaderUi, UtilLink } from "@a01sa01to/ui";
import styles from "./header.module.css";

export default function Header() {
	return (
		<HeaderUi>
			<p className={styles.title}>OG Fetcher</p>
			<nav className={styles.nav}>
				<UtilLink href="/admin/we">Websites</UtilLink>
				<UtilLink href="/admin/tw">Tweets</UtilLink>
			</nav>
		</HeaderUi>
	);
}
