HR66 - cPanel Deployment README

This package is prepared to deploy the HR66 app to cPanel (public_html + Node app).
It contains the built `dist/` (server bundle + client assets) and a sample `.htaccess`
proxy rule so Apache can forward API calls to the local Node process.

Files included in the zip:
- dist/                (server bundle and built client)
- .htaccess            (proxy snippet for forwarding /hrms/api to Node)
- README-cpanel-deploy.md (this file)

Quick deploy options

Option A — Node serves both client + API (recommended)
1. Upload the zip and extract it into a folder that will be used as the Node app root.
2. In cPanel Application Manager, set the app's entry/startup script to `dist/index.js`.
3. Add environment variables in App Manager:
   - APP_BASE_PATH=/hrms
   - PORT=5000   (or the port assigned by the App Manager)
   - HOST=127.0.0.1
   - SESSION_SECRET=<a long random string>
   - (Optional) SENDGRID_API_KEY and FROM_EMAIL if you use email features
4. Start the app in App Manager (or restart if already running).
5. Open https://yourdomain.tld/hrms and test login.

Option B — Apache serves static client, Node serves only API
1. Extract the `dist` contents into `public_html/hrms` (so your client is at /hrms).
2. Put `dist/index.js` (and server files) into a Node app folder and configure App Manager to run it.
3. Place the provided `.htaccess` in `public_html/` (or `public_html/hrms`) so Apache proxies `/hrms/api/*` to the Node port:
   - If Node listens on 5000 and is reachable at 127.0.0.1:5000, the provided `.htaccess` will forward requests.
   - If your host uses a different port, update `.htaccess` accordingly.
4. Start the Node app and test in the browser.

Important notes & troubleshooting
- Always restart the Node app after uploading new files; cPanel's Node process keeps the old code in memory until restart.
- If you receive 404 for `/hrms/api/*`:
  - Verify Node is running and `dist/index.js` is the active startup script.
  - Check the Node log in App Manager — it should show the server serving on 127.0.0.1:PORT.
  - If internal curl to Node succeeds but browser still gets 404, Apache is intercepting requests; confirm `.htaccess` proxy worked or ask hosting to enable mod_proxy.
- If `.htaccess` proxying is disabled by host, ask hosting support to configure a reverse proxy for `/hrms/api/` to the Node port.

Security
- Set a strong `SESSION_SECRET` as an environment variable.
- Do not commit or publish `SESSION_SECRET` or `SENDGRID_API_KEY` in repo.

If you want, I can also:
- Rebuild with a forced HOST=127.0.0.1 default and re-create the zip.
- Create a one-click script to upload via SFTP (if you provide host & creds — avoid sharing credentials here).

Good luck — extract `hr66-cpanel-deploy.zip` and follow Option A or B depending on how you prefer to host the client.
