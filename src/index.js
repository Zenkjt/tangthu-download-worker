export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/") {
      return new Response("Tàng Thư Download Worker OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Download endpoint:
    // /download/<Google Drive file ID>
    if (url.pathname.startsWith("/download/")) {
      const parts = url.pathname.split("/");
      const fileId = parts[2];

      if (!fileId) {
        return new Response("Missing file ID", {
          status: 400,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      // Fetch the EPUB from Google Drive instead of redirecting the reader.
      const target =
        "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=download&confirm=t";

      const upstream = await fetch(target, {
        redirect: "follow",
      });

      if (!upstream.ok) {
        return new Response("Upstream download failed", {
          status: 502,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      const headers = new Headers();

      // Match the HTTP contract used by Mayberry/Branch.
      headers.set("Content-Type", "application/epub+zip");

      // Preserve the exact upstream file size.
      const contentLength = upstream.headers.get("Content-Length");
      if (contentLength) {
        headers.set("Content-Length", contentLength);
      }

      // Safe deterministic filename.
      headers.set(
        "Content-Disposition",
        `attachment; filename="${fileId}.epub"`,
      );

      // Stream the EPUB directly.
      // Do NOT call arrayBuffer() — the whole file must not be buffered
      // in Worker memory.
      return new Response(upstream.body, {
        status: 200,
        headers,
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
