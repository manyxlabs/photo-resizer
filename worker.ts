// A service binding calls a Worker's fetch handler, so the assets are served from here,
// where the html_handling and not_found_handling settings are documented to apply.
export default {
  fetch: (request: Request, env: { ASSETS: { fetch(request: Request): Promise<Response> } }) => env.ASSETS.fetch(request),
};
