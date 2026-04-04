import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from '../config/database';

export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export class UserModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO Users (email, password, firstName, lastName, phone, address, city, state, zipCode, country, isAdmin, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, GETDATE(), GETDATE())
    `;

    const result = await this.db.executeQuery(query, [
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.phone || null,
      userData.address || null,
      userData.city || null,
      userData.state || null,
      userData.zipCode || null,
      userData.country || null,
      false
    ]);

    return result.recordset[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM Users WHERE email = @param0';
    const result = await this.db.executeQuery(query, [email]);
    return result.recordset[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM Users WHERE id = @param0';
    const result = await this.db.executeQuery(query, [id]);
    return result.recordset[0] || null;
  }

  async updateUser(id: number, updateData: Partial<CreateUserData>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof CreateUserData] !== undefined) {
        fields.push(`${key} = @param${paramIndex}`);
        values.push(updateData[key as keyof CreateUserData]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    fields.push('updatedAt = GETDATE()');
    values.push(id);

    const query = `
      UPDATE Users 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @param${paramIndex}
    `;

    const result = await this.db.executeQuery(query, values);
    return result.recordset[0] || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const query = 'DELETE FROM Users WHERE id = @param0';
    const result = await this.db.executeQuery(query, [id]);
    return result.rowsAffected[0] > 0;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        isAdmin: user.isAdmin 
      },
      secret,
      { expiresIn: expiresIn as any }
    );
  }

  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  }
}
