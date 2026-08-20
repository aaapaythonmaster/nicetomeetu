insert into public.resume_profiles (slug)
values ('product-manager'), ('product-operations')
on conflict (slug) do nothing;

insert into public.appearance_settings (status, settings, published_at)
select
  'published',
  '{
    "primaryColor":"#06b6d4",
    "derivedColorOverride":false,
    "colorBends":{
      "rotation":60,
      "autoRotate":0,
      "speed":0.2,
      "scale":1,
      "frequency":1,
      "warpStrength":1,
      "mouseInfluence":1,
      "parallax":0.5,
      "noise":0.15,
      "iterations":1,
      "intensity":1.3,
      "bandWidth":1,
      "transparent":true
    },
    "dotField":{
      "dotRadius":1.5,
      "dotSpacing":14,
      "cursorRadius":500,
      "cursorForce":0.1,
      "bulgeOnly":true,
      "bulgeStrength":67,
      "glowRadius":160,
      "sparkle":false,
      "waveAmplitude":0,
      "glowColor":"#120f17"
    },
    "optionWheel":{
      "fontSize":3,
      "spacing":1.4,
      "curve":1,
      "tilt":6,
      "blur":2,
      "fade":0.25,
      "minOpacity":0.05,
      "smoothing":200,
      "inset":80,
      "loop":false,
      "draggable":true
    }
  }'::jsonb,
  now()
where not exists (
  select 1 from public.appearance_settings where status = 'published'
);

-- Bootstrap the single administrator after creating the Auth user:
-- insert into public.admin_users (user_id) values ('AUTH_USER_UUID');
