const apiURL = "http://localhost:3000";

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}


export const authService = {
    async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${apiURL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${apiURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}