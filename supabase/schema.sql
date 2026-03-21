-- Courses (toutes les courses de transport)
create table courses (
  id text primary key,
  date date not null,
  heure text,
  client text,
  chauffeur text,
  vehicule text,
  prestation text default 'transfert',
  prise text,
  depose text,
  prix_ttc numeric,
  taux_horaire numeric,
  nb_heures numeric,
  supplements jsonb default '[]',
  total numeric,
  tips numeric default 0,
  chauffeur_flat_rate numeric,
  chauffeur_hourly_rate numeric,
  chauffeur_cost numeric default 0,
  is_private boolean default false,
  company text,
  notes text,
  month_key text not null,
  created_at timestamptz default now()
);

-- Frais (dépenses du mois)
create table frais (
  id text primary key,
  date date not null,
  category text,
  amount numeric,
  notes text,
  is_recurring boolean default false,
  recurring_id text,
  month_key text not null,
  created_at timestamptz default now()
);

-- Sociétés mémorisées
create table companies (
  id text primary key,
  name text not null,
  adresse text,
  email text,
  tva text,
  siren text,
  created_at timestamptz default now()
);

-- Chauffeurs mémorisés
create table chauffeurs (
  id text primary key,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Frais récurrents (modèles)
create table recurring_frais (
  id text primary key,
  category text,
  amount numeric,
  notes text,
  active boolean default true,
  day integer default 1,
  created_at timestamptz default now()
);

-- Statuts des factures
create table invoice_statuses (
  id text primary key,  -- format: "2026-03:CompanyName"
  status text default 'a_envoyer',
  updated_at timestamptz default now()
);

-- Activer RLS (Row Level Security) mais permettre tout pour commencer
alter table courses enable row level security;
alter table frais enable row level security;
alter table companies enable row level security;
alter table chauffeurs enable row level security;
alter table recurring_frais enable row level security;
alter table invoice_statuses enable row level security;

-- Policies permissives (pour usage personnel sans auth)
create policy "allow all" on courses for all using (true) with check (true);
create policy "allow all" on frais for all using (true) with check (true);
create policy "allow all" on companies for all using (true) with check (true);
create policy "allow all" on chauffeurs for all using (true) with check (true);
create policy "allow all" on recurring_frais for all using (true) with check (true);
create policy "allow all" on invoice_statuses for all using (true) with check (true);
