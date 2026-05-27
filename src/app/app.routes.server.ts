import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Dynamic routes with :id params cannot be prerendered (the server doesn't
  // know which IDs exist at build time). Render them on the client instead.
  { path: 'employees/:id',      renderMode: RenderMode.Client },
  { path: 'employees/:id/edit', renderMode: RenderMode.Client },

  // Everything else can be prerendered
  { path: '**', renderMode: RenderMode.Prerender }
];
