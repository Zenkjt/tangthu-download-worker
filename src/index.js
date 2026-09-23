export default {
  async fetch(request) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers":
        "Content-Type, Content-Length, Content-Disposition",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check
    if (url.pathname === "/") {
      return new Response("Tàng Thư Download Worker OK", {
        status: 200,
        headers: {
          ...corsHeaders,
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
            ...corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      const target =
        "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=download&confirm=t";

      let upstream;

      try {
        upstream = await fetch(target, {
          redirect: "follow",
        });
      } catch (error) {
        return new Response("Upstream fetch failed: " + error.message, {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (!upstream.ok) {
        return new Response(
          `Upstream download failed: HTTP ${upstream.status}`,
          {
            status: 502,
            headers: {
              ...corsHeaders,
              "Content-Type": "text/plain; charset=utf-8",
            },
          },
        );
      }

      const headers = new Headers(corsHeaders);

      // IMPORTANT:
      // Preserve the real file MIME type from Google Drive.
      const contentType =
        upstream.headers.get("Content-Type") ||
        "application/octet-stream";

      headers.set("Content-Type", contentType);

      const contentLength = upstream.headers.get("Content-Length");
      if (contentLength) {
        headers.set("Content-Length", contentLength);
      }

      const contentDisposition =
        upstream.headers.get("Content-Disposition");

      if (contentDisposition) {
        headers.set("Content-Disposition", contentDisposition);
      } else {
        headers.set(
          "Content-Disposition",
          `inline; filename="${fileId}"`,
        );
      }

      // Stream directly from Google Drive.
      return new Response(upstream.body, {
        status: 200,
        headers,
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
