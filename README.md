# BUYE AI HUB – Commercial Frontend

Public frontend for the BUYE AI HUB commercial platform.

## Production website

https://aihub.buye.online

## Repository structure

- `site/` – Static website files published through GitHub Pages.
- `.github/workflows/pages.yml` – Automated GitHub Pages deployment workflow.

## Deployment

1. Push the `main` branch to GitHub.
2. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source.
3. The workflow publishes the contents of `site/`.
4. Configure the custom domain as `aihub.buye.online`.

## Configuration

The browser-side configuration is maintained in `site/config.js`.

Do not put private API credentials, service-account keys, payment secrets, or Apps Script source code in this public repository.

## Ownership

BUYE-Online
