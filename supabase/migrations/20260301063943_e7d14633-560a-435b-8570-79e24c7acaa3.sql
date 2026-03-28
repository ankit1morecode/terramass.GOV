
CREATE POLICY "Admins can delete messages"
ON public.admin_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
