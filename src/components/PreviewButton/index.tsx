import Link from 'next/link';
interface PreviewButtonProps {
  preview: boolean;
}

import styles from "./styles.module.scss"

export function PreviewButton({ preview }: PreviewButtonProps) {
  return preview ? (
    <button className={styles.buttonContainer}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </button>
  ) : (
    <button className={styles.buttonContainer}>
      <Link href="/api/preview">
        <a>Entrar do modo Preview</a>
      </Link>
    </button>
  );
}
