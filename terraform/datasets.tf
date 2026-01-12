resource "google_bigquery_dataset" "platform-metadata" {
  dataset_id    = "platform_metadata"
  friendly_name = "Platform Metadata"
  description   = "Organization, team, and project mappings for multi-tenant platform"
  location      = var.region
  default_table_expiration_ms = 3600000
}