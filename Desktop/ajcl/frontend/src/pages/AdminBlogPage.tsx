import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiUrl, http, HttpError } from "@/lib/http";
import { photoToJpegDataUrl } from "@/lib/image";
import { formatDate } from "@/lib/utils";
import type { AdminBlogPost } from "@/types/shipping";

type Form = { title: string; excerpt: string; body: string; published: boolean };
const EMPTY: Form = { title: "", excerpt: "", body: "", published: true };

export function AdminBlogPage() {
  useDocumentTitle("Blog");
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => http.get<{ posts: AdminBlogPost[] }>("/api/admin/site/posts"), []);
  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminBlogPost | null>(null);

  function reset() {
    setEditing(null);
    setForm(EMPTY);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setRemoveImage(false);
  }

  function edit(p: AdminBlogPost) {
    setEditing(p);
    setForm({ title: p.title, excerpt: p.excerpt, body: p.body, published: p.published });
    setFile(null);
    setPreview(null);
    setRemoveImage(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setBusy("save");
    try {
      const body: Record<string, unknown> = { ...form };
      if (file) {
        body.imageDataUrl = await photoToJpegDataUrl(file, { steps: [{ edge: 1600, quality: 0.8 }, { edge: 1280, quality: 0.7 }], targetBytes: 1_200_000 });
        body.imageFilename = file.name;
      }
      if (editing && removeImage && !file) body.removeImage = true;
      if (editing) await http.patch(`/api/admin/site/posts/${editing.id}`, body);
      else await http.post("/api/admin/site/posts", body);
      toast.success(editing ? "Update saved" : form.published ? "Update published" : "Draft saved");
      reset();
      reload();
    } catch (err) {
      toast.error("Could not save", err instanceof HttpError ? err.message : err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (err) {
      toast.error("That did not work", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const shownImage = preview ?? (!removeImage && editing?.coverUrl ? apiUrl(editing.coverUrl) : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Blog</h1>
        <p className="text-sm text-muted">Post news and updates for customers. A picture is optional. Published updates appear on the Blog page.</p>
      </div>

      <Card>
        <CardHeader title={editing ? "Edit update" : "New update"} description={'Blank lines start a new paragraph. Start a line with "## " to make a heading.'} />
        <CardBody className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
          <Textarea label="Short summary (optional)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} maxLength={300} className="min-h-20" hint="Shown on the Blog page under the title" />
          <Textarea label="Update" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={20000} className="min-h-56" />

          <div className="flex flex-wrap items-center gap-4">
            {shownImage ? <img src={shownImage} alt="" className="h-24 w-40 rounded-2xl border border-line object-cover" /> : <span className="text-sm text-muted">No picture</span>}
            <label className="cursor-pointer rounded-xl border-[1.5px] border-line-strong px-4 py-2 text-sm font-bold hover:border-ink">
              {shownImage ? "Change picture" : "Add a picture"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (preview) URL.revokeObjectURL(preview);
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                  setRemoveImage(false);
                }}
              />
            </label>
            {shownImage ? (
              <button
                type="button"
                className="text-sm font-semibold text-[var(--color-danger)] hover:underline"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setFile(null);
                  setPreview(null);
                  setRemoveImage(true);
                }}
              >
                Remove picture
              </button>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-4" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published (visible on the website)
          </label>

          <div className="flex flex-wrap gap-3">
            <Button onClick={save} loading={busy === "save"} disabled={form.title.trim().length < 3 || form.body.trim().length < 10}>
              {editing ? "Save changes" : form.published ? "Publish update" : "Save draft"}
            </Button>
            {editing ? (
              <Button variant="secondary" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? <Alert tone="danger">{error}</Alert> : null}
      {data && data.posts.length === 0 ? <p className="text-sm text-muted">No updates yet.</p> : null}

      {data && data.posts.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
          {data.posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              {p.coverUrl ? <img src={apiUrl(p.coverUrl)} alt="" className="h-16 w-24 shrink-0 rounded-xl border border-line object-cover" /> : <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-surface text-xs text-muted">No picture</span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{p.title}</span>
                  <Badge tone={p.published ? "success" : "neutral"}>{p.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(p.publishedAt)} · /blog/{p.slug}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <button type="button" className="underline" onClick={() => edit(p)}>
                  Edit
                </button>
                <button type="button" className="underline" onClick={() => run(`pub-${p.id}`, () => http.patch(`/api/admin/site/posts/${p.id}`, { published: !p.published }), p.published ? "Moved to drafts" : "Published")}>
                  {p.published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" className="text-[var(--color-danger)] hover:underline" onClick={() => setToDelete(p)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const id = toDelete.id;
          setToDelete(null);
          await run(`del-${id}`, () => http.del(`/api/admin/site/posts/${id}`), "Update deleted");
        }}
        title="Delete this update?"
        message="It will be removed from the website for good."
        confirmLabel="Delete"
      />
    </div>
  );
}
