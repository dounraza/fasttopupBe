import { Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, image_url, category } = req.body;
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description, price, stock, image_url, category }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
