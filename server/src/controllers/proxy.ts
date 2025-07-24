import { Request, Response } from 'express';
import fetch from 'node-fetch';

export class ProxyController {
  private railwayApiUrl: string;

  constructor() {
    this.railwayApiUrl = process.env.RAILWAY_API_URL || 'https://internet-banking-production-1364.up.railway.app';
  }

  async proxyRequest(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;
      const url = `${this.railwayApiUrl}/${path}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Forward authorization header if present
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy request error:', error);
      res.status(500).json({ error: 'Proxy request failed' });
    }
  }

  async proxyAdminRequest(req: Request, res: Response): Promise<void> {
    try {
      // Remove /admin from the path since it's already included in the route
      const adminPath = req.path.replace(/^\/admin/, '');
      const url = `${this.railwayApiUrl}/api/admin${adminPath}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Forward authorization header if present
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      // Add query parameters
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;

      console.log(`[PROXY] ${req.method} ${finalUrl}`);

      const response = await fetch(finalUrl, fetchOptions);
      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy admin request error:', error);
      res.status(500).json({ error: 'Proxy admin request failed' });
    }
  }

  async proxyUserRequest(req: Request, res: Response): Promise<void> {
    try {
      // Remove /user from the path since it's already included in the route
      const userPath = req.path.replace(/^\/user/, '');
      const url = `${this.railwayApiUrl}/api/user${userPath}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Forward authorization header if present
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      // Add query parameters
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;

      console.log(`[PROXY] ${req.method} ${finalUrl}`);

      const response = await fetch(finalUrl, fetchOptions);
      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy user request error:', error);
      res.status(500).json({ error: 'Proxy user request failed' });
    }
  }
}

export default ProxyController;