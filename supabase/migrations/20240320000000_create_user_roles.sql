-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role
CREATE POLICY "Users can read their own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to read all roles (needed for admin checks)
CREATE POLICY "Authenticated users can read all roles"
    ON user_roles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only allow admins to update roles
CREATE POLICY "Only admins can update roles"
    ON user_roles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND is_admin = true
    ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE
    ON user_roles
    FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 