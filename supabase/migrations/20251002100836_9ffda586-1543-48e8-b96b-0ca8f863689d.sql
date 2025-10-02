-- Update the handle_new_user function to not assign any default roles
-- Only the specific admin email gets a role automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile for the user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Only auto-assign admin role to the specific admin email
  IF NEW.email = 'abel.birara@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  -- All other users will have NO role and need admin approval
  
  RETURN NEW;
END;
$function$;