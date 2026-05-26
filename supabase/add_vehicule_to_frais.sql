-- Ajoute la colonne vehicule à la table frais
-- Permet d'attribuer un véhicule (Classe E / V / S) aux frais essence / entretien / péage
-- → calcul du coût par véhicule + ratio €/km par gamme dans le dashboard

alter table frais add column if not exists vehicule text;

-- Index optionnel pour accélérer les agrégations par véhicule
create index if not exists idx_frais_profile_vehicule on frais (profile, month_key, vehicule) where vehicule is not null;
