import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiUrl } from "@/lib/http";
import type { SeaFlier } from "@/types/shipping";

/** The Sea Cargo flier, shown over the homepage. It can be an image or a PDF, and can be downloaded. */
export function SeaFlierModal({ open, onClose, flier }: { open: boolean; onClose: () => void; flier: SeaFlier | null }) {
  const isPdf = flier?.contentType === "application/pdf";
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Sea cargo">
      {flier ? (
        <div className="space-y-4">
          {isPdf ? (
            <object data={apiUrl(flier.url)} type="application/pdf" className="h-[60vh] w-full rounded-sm border border-line">
              <p className="p-4 text-sm text-muted">Your browser cannot show this PDF here. Use the download button.</p>
            </object>
          ) : (
            <img src={apiUrl(flier.url)} alt="Sea cargo flier" className="mx-auto max-h-[60vh] w-auto rounded-sm border border-line" />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" href={apiUrl(flier.downloadUrl)} download>
              Download
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-sm text-muted">
          <p>Our sea cargo flier is not available right now. Contact us and we will send you the current rates.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" href="/contact">
              Contact us
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
