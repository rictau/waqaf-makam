#!/usr/bin/env bash
#
# One-time setup for keyless GitHub Actions -> Firebase deploys.
#
# Creates a Workload Identity Federation (WIF) pool + provider so that GitHub
# Actions can impersonate a deploy service account using a short-lived OIDC
# token. No service account JSON key is ever created, downloaded, or stored.
#
# Run this ONCE, on your own machine, from an account with Owner (or enough
# IAM//Firebase admin) on the project:
#
#   gcloud auth login
#   ./scripts/setup-github-deploy.sh
#
# It prints the two values to paste into GitHub repository secrets at the end.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-waqaf-makam}"
GITHUB_REPO="${GITHUB_REPO:-rictau/waqaf-makam}"
SA_NAME="${SA_NAME:-github-deployer}"
POOL_ID="${POOL_ID:-github-pool}"
PROVIDER_ID="${PROVIDER_ID:-github-provider}"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Project:  ${PROJECT_ID}"
echo "==> Repo:     ${GITHUB_REPO}"
echo "==> Service account: ${SA_EMAIL}"
echo

# Fail early and legibly if there is no active account. Without this, the first
# real API call dies with a generic "you do not currently have an active
# account" several steps in, which reads like a script bug rather than a
# one-command fix. In Cloud Shell this usually means the session has not been
# authorized yet -- click "Authorize" when prompted, or run `gcloud auth login`.
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)"
if [ -z "${ACTIVE_ACCOUNT}" ]; then
  cat <<'EOF'
ERROR: no active gcloud account.

  Run:  gcloud auth login

  then re-run this script. In Cloud Shell you may instead see an "Authorize"
  button appear the first time a command needs credentials -- click it.
EOF
  exit 1
fi
echo "==> Authenticated as: ${ACTIVE_ACCOUNT}"
echo

gcloud config set project "${PROJECT_ID}"

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
echo "==> Project number: ${PROJECT_NUMBER}"

echo
echo "==> Enabling required APIs (idempotent, may take a minute)..."
gcloud services enable \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  firebase.googleapis.com \
  firebasehosting.googleapis.com \
  firebaserules.googleapis.com \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project "${PROJECT_ID}"

echo
echo "==> Creating deploy service account (ignore error if it already exists)..."
gcloud iam service-accounts create "${SA_NAME}" \
  --project "${PROJECT_ID}" \
  --display-name="GitHub Actions deployer" \
  || echo "    (already exists, continuing)"

echo
echo "==> Granting deploy roles..."
# firebase.admin covers Hosting, Firestore rules/indexes, and Storage rules.
# The Cloud Functions roles are needed because firebase.json declares functions.
# secretmanager.admin lets the deploy bind RESEND_API_KEY to the function and
# keep the runtime service account's accessor grant in place. If you prefer to
# narrow it, swap in secretmanager.viewer and grant the accessor binding by hand.
for ROLE in \
  roles/firebase.admin \
  roles/cloudfunctions.admin \
  roles/artifactregistry.admin \
  roles/cloudbuild.builds.builder \
  roles/secretmanager.admin \
  roles/serviceusage.serviceUsageConsumer \
  roles/iam.serviceAccountUser
do
  echo "    - ${ROLE}"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet > /dev/null
done

echo
echo "==> Creating Workload Identity pool (ignore error if it already exists)..."
gcloud iam workload-identity-pools create "${POOL_ID}" \
  --project "${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions pool" \
  || echo "    (already exists, continuing)"

echo
echo "==> Creating OIDC provider locked to ${GITHUB_REPO}..."
# SECURITY: the attribute-condition below is what stops ANY repository on
# GitHub from minting a token for this service account. Never remove it.
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
  --project "${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository == '${GITHUB_REPO}'" \
  || echo "    (already exists -- verify its attribute-condition matches ${GITHUB_REPO})"

echo
echo "==> Allowing ${GITHUB_REPO} to impersonate ${SA_NAME}..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project "${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet > /dev/null

PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

cat <<EOF

========================================================================
Done. Add these two GitHub repository SECRETS:
  Settings > Secrets and variables > Actions > Secrets > New repository secret

  GCP_WORKLOAD_IDENTITY_PROVIDER
    ${PROVIDER_RESOURCE}

  GCP_SERVICE_ACCOUNT
    ${SA_EMAIL}

And these six repository VARIABLES (same page, "Variables" tab).
These are the Firebase *web* config -- they are public by design and ship
inside the client bundle, so variables are the correct home for them:

  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN              waqaf-makam.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID               waqaf-makam
  VITE_FIREBASE_STORAGE_BUCKET           waqaf-makam.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID

Get the missing values from:
  Firebase console > Project settings > General > Your apps > SDK setup
========================================================================
EOF
