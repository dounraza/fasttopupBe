import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: 'User created successfully', user: data.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Login with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) return res.status(401).json({ error: authError.message });

    // Fetch user profile to check role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
        // If profile doesn't exist, assume 'client' role for safety
        const token = jwt.sign({ id: authData.user.id, email: authData.user.email, role: 'client' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { id: authData.user.id, email: authData.user.email, role: 'client' } });
    }

    const token = jwt.sign({ id: authData.user.id, email: authData.user.email, role: profileData.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: authData.user.id, email: authData.user.email, role: profileData.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { new_password } = req.body;
    const { error } = await supabase.auth.updateUser({ password: new_password });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

