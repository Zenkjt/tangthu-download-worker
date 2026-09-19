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

      // Google Drive direct-download endpoint
      const target =
        "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=download&confirm=t";

      return Response.redirect(target, 302);
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
