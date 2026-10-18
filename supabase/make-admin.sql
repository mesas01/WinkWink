-- Gives the Finance admin role to an existing user (run after that person signs in once).
-- Replace the email and run it in Supabase → SQL Editor.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'tu-correo@gmail.com'
ON CONFLICT DO NOTHING;
