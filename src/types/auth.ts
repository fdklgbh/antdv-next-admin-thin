// User data types

export interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  avatar: string;
  phone: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  bio?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type LocalizedText = Record<string, string>;
