-- Keycloak's own database, created on the first start of an empty volume.
--
-- A separate database rather than a separate schema or a shared one: Keycloak
-- runs its own migrations on every upgrade and owns its tables completely. A
-- shared database would put those alongside Flyway's, where the two version
-- histories could be confused for each other, and where `db-reset-dev.sh`-style
-- mistakes destroy authentication as well as content.
--
-- Same credentials as the application, deliberately. A second role is one more
-- password in .env for a boundary that does not exist on a single instance
-- where both services already run as the same trust domain.
--
-- Only ever runs when the data directory is empty, so it cannot disturb an
-- existing deployment.
select 'create database keycloak'
where not exists (select from pg_database where datname = 'keycloak')\gexec
