-- Corrigir RLS da tabela profile (evitar recursão infinita)
-- Remove as policies antigas que causam recursão

DROP POLICY IF EXISTS "profile_view_own" ON profile;
DROP POLICY IF EXISTS "profile_view_all_admin" ON profile;
DROP POLICY IF EXISTS "profile_update_own" ON profile;

-- Policy mais simples: qualquer usuário autenticado vê todos os profiles
CREATE POLICY "profile_select_all" ON profile
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: qualquer usuário autenticado pode atualizar qualquer profile
-- (apenas 2 usuários, sem segredos entre eles)
CREATE POLICY "profile_update_all" ON profile
  FOR UPDATE USING (auth.role() = 'authenticated');
