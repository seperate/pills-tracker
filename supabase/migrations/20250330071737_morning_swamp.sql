/*
  # Create medications and logs tables

  1. New Tables
    - `medications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `dosage` (text)
      - `frequency` (integer)
      - `time_slots` (text array)
      - `notes` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    - `medication_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `medication_id` (uuid, references medications)
      - `timestamp` (timestamp)
      - `taken` (boolean)
      - `user_email` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency integer NOT NULL,
  time_slots text[] NOT NULL,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  medication_id uuid REFERENCES medications NOT NULL,
  timestamp timestamptz NOT NULL,
  taken boolean NOT NULL,
  user_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies for medications
CREATE POLICY "Users can view their own medications"
  ON medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON medications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON medications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for medication_logs
CREATE POLICY "Users can view their own logs and admins can view all logs"
  ON medication_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own logs"
  ON medication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
  ON medication_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON medication_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);