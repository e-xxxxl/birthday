import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiUrl, http } from "@/lib/http";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types/shipping";

/** The post body is plain text: a blank line starts a new paragraph and "## " at the start of a line makes a heading. */
export function PostBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i} className="pt-4 text-2xl font-bold text-ink">
            {b.slice(3)}
          </h2>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        ),
      )}
    </div>
  );
}

export function BlogPostPage() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useAsync(() => http.get<{ post: BlogPost }>(`/api/site/blog/${encodeURIComponent(slug)}`), [slug]);
  const post = data?.post;
  useDocumentTitle(post?.title ?? "Blog");

  return (
    <div className="container-page py-12 md:py-16">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-bold text-accent-dark hover:underline">
          ← All updates
        </Link>
        {loading && !data ? <LoadingBlock /> : null}
        {error && !data ? (
          <div className="mt-6 space-y-4">
            <Alert tone="danger">{error}</Alert>
            <Button href="/blog" variant="secondary">
              See all updates
            </Button>
          </div>
        ) : null}
        {post ? (
          <>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-3 text-sm text-muted">
              {formatDate(post.publishedAt)}
              {post.author ? ` · ${post.author}` : ""}
            </p>
            {post.coverUrl ? <img src={apiUrl(post.coverUrl)} alt="" className="mt-8 w-full rounded-3xl object-cover shadow-card" /> : null}
            <div className="mt-8">
              <PostBody text={post.body} />
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
