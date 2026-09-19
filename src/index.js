export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("TangThu Download Worker OK", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname.startsWith("/download/")) {
      const id = url.pathname.split("/")[2];

      if (!id) {
        return new Response("Missing book ID", { status: 400 });
      }

      return Response.redirect(
        `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`,
        302
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
