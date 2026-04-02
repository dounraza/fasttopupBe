import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { createObjectCsvStringifier } from 'csv-writer';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { 
      client_name, 
      client_email, 
      address, 
      phone, 
      uid_game, 
      pseudo_game, 
      payment_ref, 
      items, 
      total_amount 
    } = req.body;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        client_name, 
        client_email, 
        address, 
        phone, 
        uid_game, 
        pseudo_game, 
        payment_ref, 
        total_amount, 
        status: 'pending' 
      }])
      .select();

    if (orderError) throw orderError;
    const orderId = orderData[0].id;

    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name))');

    if (error) throw error;

    // Flatten product name into order_items
    const formattedData = data.map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        products: undefined
      }))
    }));

    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    // Distinct client emails/names from orders
    const { data, error } = await supabase
      .from('orders')
      .select('client_name, client_email')
      .order('client_name');

    if (error) throw error;

    // Deduplicate
    const clients = Array.from(new Set(data.map(c => c.client_email)))
      .map(email => data.find(c => c.client_email === email));

    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const exportOrdersCSV = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*');

    if (error) throw error;

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'Order ID' },
        { id: 'client_name', title: 'Client' },
        { id: 'client_email', title: 'Email' },
        { id: 'uid_game', title: 'Game UID' },
        { id: 'pseudo_game', title: 'Game Pseudo' },
        { id: 'payment_ref', title: 'Payment Ref' },
        { id: 'address', title: 'Address' },
        { id: 'phone', title: 'Phone' },
        { id: 'total_amount', title: 'Total' },
        { id: 'status', title: 'Status' },
        { id: 'created_at', title: 'Date' }
      ]
    });

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(header + body);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    // 1. Chiffre d'affaire total (seulement les commandes complétées)
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed');

    if (revenueError) throw revenueError;
    const totalRevenue = revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0);

    // 2. Nombre total de commandes
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) throw ordersError;

    // 3. Commandes en attente (pending)
    const { count: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // 4. Total des produits
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // 5. Ventes récentes (liste des commandes complétées, triées par date)
    const { data: recentSales, error: salesError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (salesError) throw salesError;

    res.json({
      total_revenue: totalRevenue,
      total_orders: totalOrders || 0,
      pending_orders: pendingOrders || 0,
      total_products: totalProducts || 0,
      recent_sales: recentSales
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
