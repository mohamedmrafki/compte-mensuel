-- Ajout de la colonne profile à toutes les tables
alter table courses add column if not exists profile text not null default 'oumar';
alter table frais add column if not exists profile text not null default 'oumar';
alter table companies add column if not exists profile text not null default 'oumar';
alter table chauffeurs add column if not exists profile text not null default 'oumar';
alter table recurring_frais add column if not exists profile text not null default 'oumar';
alter table invoice_statuses add column if not exists profile text not null default 'oumar';
