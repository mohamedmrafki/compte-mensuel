-- Courses (toutes les courses de transport)
create table if not exists courses (
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
  profile text default 'oumar',
  created_at timestamptz default now()
);

-- Frais (dépenses du mois)
create table if not exists frais (
  id text primary key,
  date date not null,
  category text,
  amount numeric,
  notes text,
  is_recurring boolean default false,
  recurring_id text,
  month_key text not null,
  profile text default 'oumar',
  created_at timestamptz default now()
);

-- Sociétés mémorisées
create table if not exists companies (
  id text primary key,
  name text not null,
  prices jsonb default '{}',
  profile text default 'oumar',
  created_at timestamptz default now()
);

-- Chauffeurs mémorisés
create table if not exists chauffeurs (
  id text primary key,
  name text not null,
  is_default boolean default false,
  profile text default 'oumar',
  created_at timestamptz default now()
);

-- Frais récurrents (modèles)
create table if not exists recurring_frais (
  id text primary key,
  category text,
  amount numeric,
  notes text,
  active boolean default true,
  day integer default 1,
  profile text default 'oumar',
  created_at timestamptz default now()
);

-- Statuts des factures
create table if not exists invoice_statuses (
  id text primary key,  -- format: "2026-03:CompanyName"
  status text default 'a_envoyer',
  profile text default 'oumar',
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
do $$ begin
  if not exists (select 1 from pg_policies where tablename='courses' and policyname='allow all') then
    create policy "allow all" on courses for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='frais' and policyname='allow all') then
    create policy "allow all" on frais for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='companies' and policyname='allow all') then
    create policy "allow all" on companies for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='chauffeurs' and policyname='allow all') then
    create policy "allow all" on chauffeurs for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='recurring_frais' and policyname='allow all') then
    create policy "allow all" on recurring_frais for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='invoice_statuses' and policyname='allow all') then
    create policy "allow all" on invoice_statuses for all using (true) with check (true);
  end if;
end $$;
