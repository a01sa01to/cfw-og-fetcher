import {  Header as HeaderUi, UtilLink } from "@a01sa01to/ui"
import styles from "./header.module.css"

export default function Header() {
  return (
    <HeaderUi>
      <p className={styles.title}>OG Fetcher</p>
      <nav className={styles.nav}>
        <UtilLink href="/">Websites</UtilLink>
        <UtilLink href="/">Tweets</UtilLink>
      </nav>
      </HeaderUi>
  )
}
