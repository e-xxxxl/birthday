import { AppLink as Link } from "@/components/ui/AppLink";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiUrl, http } from "@/lib/http";
import { formatDate } from "@/lib/utils";
import type { BlogCard } from "@/types/shipping";

export function BlogPage() {
  useDocumentTitle("Blog");
  const { data, loading, error } = useAsync(() => http.get<{ posts: BlogCard[] }>("/api/site/blog"), []);
  const posts = data?.posts ?? [];

  return (
    <>
      <PageBanner title="News and updates" crumb="Blog" image="workers" intro="What is new at AJ Courier & Logistics: service updates, notices and announcements." />
      <div className="container-page py-20 lg:py-28">
        {loading && !data ? <LoadingBlock /> : null}
        {error && !data ? <Alert tone="danger">{error}</Alert> : null}
        {data && posts.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl bg-surface p-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-sky-soft text-info">
              <Icon name="box" className="size-8" />
            </span>
            <p className="mt-5 text-lg font-bold">Nothing posted yet</p>
            <p className="mt-2 text-sm text-muted">Check back soon for news from our team.</p>
          </div>
        ) : null}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}>
              <Link href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-3xl border border-line bg-paper shadow-card transition-shadow hover:shadow-pop">
                {p.coverUrl ? (
                  <div className="aspect-[16/10] overflow-hidden bg-surface">
                    <img src={apiUrl(p.coverUrl)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="grid aspect-[16/10] place-items-center bg-sky-soft text-info">
                    <Icon name="box" className="size-12" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs font-semibold text-muted">{formatDate(p.publishedAt)}</p>
                  <h2 className="mt-2 text-xl font-bold leading-snug group-hover:text-accent-dark">{p.title}</h2>
                  {p.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.excerpt}</p> : null}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent-dark">
                    Read more <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
