CREATE OR REPLACE FUNCTION platform.uuid_v7()
RETURNS uuid LANGUAGE sql VOLATILE AS $$
  SELECT gen_random_uuid()
$$;
CREATE OR REPLACE FUNCTION platform.set_updated_at_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION audit.forbid_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit records are immutable';
END;
$$;
