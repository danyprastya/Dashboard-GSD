'use client';

import React, { useState } from 'react';
import { Building } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// User type with role
export type UserRole = 'admin' | 'superadmin';

export interface User {
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

// Dummy users data with roles
const DUMMY_USERS: User[] = [
  { 
    username: 'admin', 
    password: 'admin123', 
    name: 'Admin User',
    role: 'admin'
  },
  { 
    username: 'superadmin', 
    password: 'super123', 
    name: 'Super Admin',
    role: 'superadmin'
  },
  { 
    username: 'admin2', 
    password: 'admin123', 
    name: 'Admin Jakarta',
    role: 'admin'
  }
];

interface LoginPageProps {
  onLoginSuccess?: (user: Omit<User, 'password'>) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const foundUser = DUMMY_USERS.find(
        u => u.username === username && u.password === password
      );

      if (foundUser) {
        const userData = { 
          username: foundUser.username, 
          name: foundUser.name,
          role: foundUser.role
        };
        
        // Store in session
        if (typeof window !== 'undefined') {
          const sessions = JSON.parse(sessionStorage.getItem('activeSessions') || '[]');
          sessions.push({
            ...userData,
            loginTime: Date.now(),
            sessionId: Math.random().toString(36).substr(2, 9)
          });
          sessionStorage.setItem('activeSessions', JSON.stringify(sessions));
          sessionStorage.setItem('currentUser', JSON.stringify(userData));
        }

        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } else {
        setError('Username atau password salah');
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username && password) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">DiGI SLAM</CardTitle>
          <CardDescription className="text-center">
            Sistem Pemantauan dan Manajemen Kondisi Properti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Memverifikasi...
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Super Admin:</span>
                <span className="font-mono text-gray-800">superadmin / super123</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Admin:</span>
                <span className="font-mono text-gray-800">admin / admin123</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Admin Jakarta:</span>
                <span className="font-mono text-gray-800">admin2 / admin123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}