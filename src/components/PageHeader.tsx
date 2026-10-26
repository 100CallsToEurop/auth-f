interface PageHeaderProps {
  title: string;
  description?: string;
}

/** Заголовок раздела внутри личного кабинета. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-heading">
      <h1>{title}</h1>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
