resource "google_bigquery_table" "organizations" {
  dataset_id = google_bigquery_dataset.platform-metadata.dataset_id
  table_id   = "organizations"

  schema = jsonencode([
    {
      name        = "id"
      type        = "STRING"
      description = "Organization ID"
    },
    {
      name        = "name"
      type        = "STRING"
      description = "Organization Name"
    },
    {
      name        = "slug"
      type        = "STRING"
      description = "Organization Slug"
    }
  ])
}


resource "google_bigquery_table" "teams" {
  dataset_id = google_bigquery_dataset.platform-metadata.dataset_id
  table_id   = "teams"

  schema = jsonencode([
    {
      name        = "id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Team ID"
    },
    {
      name        = "name"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Team name"
    },
    {
      name        = "slug"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Team slug"
    },
    {
      name        = "gcp_project_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Associated GCP project ID"
    },
    {
      name        = "organization_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Parent organization ID"
    }
  ])
}