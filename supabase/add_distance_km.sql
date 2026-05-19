-- Ajoute la colonne distance_km pour calculer le kilométrage par course
-- via Google Routes API. Utilisé pour le total mensuel/annuel défiscalisation.

alter table courses add column if not exists distance_km numeric;

-- Index optionnel pour accélérer les agrégations par mois
create index if not exists idx_courses_month_distance on courses (profile, month_key) where distance_km is not null;
