export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
};

export type AuthSession = {
  user: AuthUser | null;
  expiresAt?: string;
};

export type AuthState = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthProviderValue = AuthState & {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};
