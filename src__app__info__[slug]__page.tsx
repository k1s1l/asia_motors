import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorePage } from "@/lib/store";
import { InfoNav } from "@/components/InfoNav";
import { infoHref } from "@/lib/routes";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getStorePage((await params).slug);
  return page ? { title: page.title, description: page.body[0]?.slice(0, 160), alternates: { canonical: infoHref(page.slug) } } : { title: "Сторінку не знайдено" };
}

export default async function InfoPage({ params }: Props) {
  const page = getStorePage((await params).slug);
  if (!page) notFound();
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="page__title">{page.title}</h1>
      <div className="info-layout">
        <InfoNav current={page.slug} />
        <article className="info-body panel prose">
          {page.body.map((para, i) => <p key={i}>{para}</p>)}
        </article>
      </div>
    </div>
  );
}
