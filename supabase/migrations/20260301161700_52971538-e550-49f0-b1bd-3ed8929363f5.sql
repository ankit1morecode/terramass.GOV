-- Allow users to delete their own role (needed for Google sign-in rejection cleanup)
CREATE POLICY "Users can delete own role"
  ON public.user_roles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own profile (needed for Google sign-in rejection cleanup)
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);