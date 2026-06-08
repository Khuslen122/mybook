import { getCover } from "@/lib/books";

// covers live in private Blob storage, so they're streamed through here
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cover = await getCover(id);
  if (!cover) return new Response("Not found", { status: 404 });

  return new Response(cover.stream, {
    headers: {
      "Content-Type": cover.contentType,
      "Cache-Control": "public, max-age=60",
    },
  });
}
