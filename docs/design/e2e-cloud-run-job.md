# E2E Cloud Run Job (Independent Runner)

## Goal
Run full Playwright E2E suite independently from deploy pipeline.

## Target
- Dev URL: `https://payrix-api-tester-dev-903828198190.us-central1.run.app`
- IAP: disabled

## Artifacts
- `Dockerfile.e2e` — Playwright runner image
- `cloudbuild-e2e.yaml` — builds/pushes `payrix-e2e-runner` image

## Build E2E image
```bash
gcloud builds submit \
  --config cloudbuild-e2e.yaml \
  --project 903828198190
```

## Create/Update Cloud Run Job
```bash
# Create (first time)
gcloud run jobs create payrix-e2e-runner \
  --image us-central1-docker.pkg.dev/903828198190/cloud-run-source-deploy/payrix-e2e-runner:latest \
  --region us-central1 \
  --cpu 2 \
  --memory 2Gi \
  --max-retries 0 \
  --task-timeout 600s \
  --set-env-vars E2E_BASE_URL=https://payrix-api-tester-dev-903828198190.us-central1.run.app,CI=true

# Update (subsequent releases)
gcloud run jobs update payrix-e2e-runner \
  --image us-central1-docker.pkg.dev/903828198190/cloud-run-source-deploy/payrix-e2e-runner:latest \
  --region us-central1 \
  --cpu 2 \
  --memory 2Gi \
  --max-retries 0 \
  --task-timeout 600s \
  --set-env-vars E2E_BASE_URL=https://payrix-api-tester-dev-903828198190.us-central1.run.app,CI=true
```

## Execute manually
```bash
gcloud run jobs execute payrix-e2e-runner --region us-central1 --wait
```

## CI split
- PR CI: `.github/workflows/e2e.yml` runs smoke tests on localhost.
- Full suite: `payrix-e2e-runner` Cloud Run Job against dev URL.
