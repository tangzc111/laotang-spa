import { request } from "./client";

export interface User {
	id: string;
	email: string;
	name?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserPayload {
	email: string;
	name?: string;
}

export const getUsers = () => request<User[]>("/api/users");

export const createUser = (payload: CreateUserPayload) =>
	request<User>("/api/users", {
		method: "POST",
		body: payload,
	});

export const deleteUser = (id: string) =>
	request<void>(`/api/users/${id}`, {
		method: "DELETE",
	});
