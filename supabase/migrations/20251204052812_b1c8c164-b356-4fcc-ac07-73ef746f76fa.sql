-- Fix: Admin User Enumeration via Public Roles Table
-- Restrict the user_roles SELECT policy to only allow users to view their own roles

DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);