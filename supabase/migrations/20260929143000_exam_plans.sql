insert into public.subscription_plans (id, name, description, price, currency, duration_days, features, is_active) values
  (
    'c0000000-0000-4000-8000-000000000001',
    'STET Music Premium',
    'One year of premium mock tests and practice for students preparing only for STET Music.',
    499,
    'INR',
    365,
    '["All STET Music mock tests","Topic practice","Detailed analytics","Weak topic recommendations","Personalized practice","Test history"]'::jsonb,
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'BPSC Music Premium',
    'One year of premium mock tests and practice for students preparing only for BPSC Music.',
    699,
    'INR',
    365,
    '["All BPSC Music mock tests","Topic practice","Detailed analytics","Weak topic recommendations","Personalized practice","Test history"]'::jsonb,
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'STET & BPSC Premium',
    'One year of premium mock tests and practice for students preparing for both STET Music and BPSC Music.',
    999,
    'INR',
    365,
    '["All STET and BPSC Music mock tests","Topic practice","Detailed analytics","Weak topic recommendations","Personalized practice","Test history"]'::jsonb,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  features = excluded.features,
  is_active = excluded.is_active;
