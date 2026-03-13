# About Microreact

## What is Microreact?

Microreact allows you to upload, visualise and explore any combination of clustering (trees, networks), geographic (map) and temporal (timeline) data. Other metadata variables are displayed in a table. You can specify colours and/or shapes to display on the map, tree and/or timeline. A permanent URL is produced for you to share your Microreact or a `.microreact` file can be downloaded for sharing with collaborators

The code is provided under the MIT licence. It is provided as is and we do not have the resource to provide assistance for installation or enhancing features using the source code.

## Citing Microreact

If you cite Microreact in a publication please use the reference [Microreact: visualizing and sharing data for genomic epidemiology and phylogeography](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5320705/pdf/mgen-02-93.pdf)

## Forking Microreact

You are not granted rights or licenses to the trademarks of the CGPS or any party, including without limitation the Microreact name or logo.
If you fork the project and publish it please use another name.

## Cron endpoints

### Sync LDAP groups

`POST /api/cron/sync-ldap-groups`

- Requires header `x-cron-secret` matching `cronSecret` in configuration.
- Optional `dryRun` query parameter (e.g. `/api/cron/sync-ldap-groups?dryRun=true`) runs the sync without MongoDB writes.
- Requires `auth.ldap.syncGroups` to be configured with LDAP group DNs.
- For each configured LDAP group:
	- Creates/uses a MongoDB team with the same group CN as team name.
	- Syncs team members from LDAP group members.
	- Ensures each member exists as a MongoDB user account.
- User lookups are done by `auth.ldap.emailAttribute`.
- Group sync errors are isolated and reported per group, so one failing group does not stop others.
