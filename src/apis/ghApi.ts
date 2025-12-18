import { request } from "./client";

export interface GithubProfile {
	login: string;
	name: string | null;
	avatar_url: string;
	html_url: string;
	bio?: string | null;
	company?: string | null;
	location?: string | null;
	public_repos?: number;
	followers?: number;
	following?: number;
}

export const fetchGithubProfile = (token: string) =>
	request<GithubProfile>(`/api/github/profile?token=${encodeURIComponent(token)}`);
