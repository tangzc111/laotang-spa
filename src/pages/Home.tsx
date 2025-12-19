import type { GithubProfile } from '@/apis/ghApi';
import { fetchGithubProfile } from '@/apis/ghApi';
import type { User } from '@apis/User';
import { createUser, deleteUser, getUsers } from '@apis/User';
import { getBaseUrl, setBaseUrl } from '@apis/client';
import type { FormEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

type SourceKey = 'serverless' | 'ec2';

const DATA_SOURCES: Record<SourceKey, { label: string; url: string; note: string }> = {
	serverless: {
		label: 'Serverless',
		url: 'https://82wz58w5xa.execute-api.us-west-2.amazonaws.com/dev',
		note: 'API Gateway (serverless)',
	},
	ec2: {
		label: 'EC2',
		url: 'https://www.tzcgws.xyz',
		note: 'EC2 host',
	},
};

const getErrorMessage = (error: unknown) => {
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'Unexpected error, please try again.';
};

const Home = () => {
	const initialSource =
		(Object.entries(DATA_SOURCES).find(([, value]) => value.url === getBaseUrl())?.[0] as SourceKey | undefined) ??
		'ec2';
	const [apiSource, setApiSource] = useState<SourceKey>(initialSource);
	const [users, setUsers] = useState<User[]>([]);
	const [usersError, setUsersError] = useState<string | null>(null);
	const [usersLoading, setUsersLoading] = useState(false);
	const [creatingUser, setCreatingUser] = useState(false);
	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

	const [form, setForm] = useState({ email: '', name: '' });

	const [githubToken, setGithubToken] = useState('');
	const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
	const [githubError, setGithubError] = useState<string | null>(null);
	const [githubLoading, setGithubLoading] = useState(false);

	useEffect(() => {
		setBaseUrl(DATA_SOURCES[apiSource].url);
	}, [apiSource]);

	const loadUsers = useCallback(async () => {
		setUsersLoading(true);
		setUsersError(null);
		try {
			const data = await getUsers();
			setUsers(data);
		} catch (error) {
			setUsersError(getErrorMessage(error));
		} finally {
			setUsersLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadUsers();
	}, [loadUsers]);

	const handleSwitchSource = (source: SourceKey) => {
		if (source === apiSource) return;
		const nextUrl = DATA_SOURCES[source].url;
		setBaseUrl(nextUrl);
		setApiSource(source);
		setUsersError(null);
		setGithubError(null);
		void loadUsers();
	};

	const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setUsersError(null);

		if (!form.email.trim()) {
			setUsersError('Email is required.');
			return;
		}

		setCreatingUser(true);
		try {
			const newUser = await createUser({
				email: form.email.trim(),
				name: form.name.trim() || undefined,
			});
			setUsers((prev) => [newUser, ...prev]);
			setForm({ email: '', name: '' });
		} catch (error) {
			setUsersError(getErrorMessage(error));
		} finally {
			setCreatingUser(false);
		}
	};

	const handleDeleteUser = async (id: string) => {
		setUsersError(null);
		setDeletingUserId(id);
		try {
			await deleteUser(id);
			setUsers((prev) => prev.filter((user) => user.id !== id));
		} catch (error) {
			setUsersError(getErrorMessage(error));
		} finally {
			setDeletingUserId(null);
		}
	};

	const handleFetchGithub = async () => {
		setGithubError(null);
		setGithubProfile(null);
		const token = githubToken.trim();
		if (!token) {
			setGithubError('Please provide a GitHub token.');
			return;
		}
		setGithubLoading(true);
		try {
			const profile = await fetchGithubProfile(token);
			setGithubProfile(profile);
		} catch (error) {
			setGithubError(getErrorMessage(error));
		} finally {
			setGithubLoading(false);
		}
	};

	const sortedUsers = useMemo(
		() => [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
		[users]
	);

	return (
		<div className='relative overflow-hidden py-12 min-h-screen'>
			<div className='absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' />
			<div className='absolute inset-0 opacity-50 blur-3xl bg-[radial-gradient(circle_at_20%_20%,#22d3ee_0,transparent_25%),radial-gradient(circle_at_80%_10%,#a855f7_0,transparent_22%),radial-gradient(circle_at_50%_80%,#22c55e_0,transparent_20%)]' />
			<div className='relative mx-auto max-w-6xl space-y-10 px-4'>
				<header className='flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur'>
					<p className='inline-flex max-w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200 ring-1 ring-cyan-400/40'>
						Realtime Console
					</p>
					<div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
						<div className='space-y-2'>
							<h1 className='text-3xl font-bold text-white md:text-4xl'>User & GitHub Control Center</h1>
						</div>
						<button
							type='button'
							onClick={() => void loadUsers()}
							className='group inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/40 transition hover:-translate-y-0.5 hover:bg-cyan-400 disabled:translate-y-0 disabled:bg-cyan-700/60'
							disabled={usersLoading}
						>
							<span className='h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]' />
							{usersLoading ? 'Refreshing...' : 'Refresh Data'}
						</button>
					</div>
				</header>

				<div className='rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur'>
					<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
						<div className='space-y-1'>
							<p className='text-sm font-semibold text-white'>数据源切换</p>
							<p className='text-xs text-slate-300'>选择后会更新 Base URL 并重新加载数据。</p>
						</div>
						<div className='flex flex-wrap gap-3'>
							{(Object.entries(DATA_SOURCES) as [SourceKey, { label: string; url: string; note: string }][]).map(
								([key, value]) => {
									const active = apiSource === key;
									return (
										<button
											key={key}
											type='button'
											onClick={() => handleSwitchSource(key)}
											className={`min-w-[200px] rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
												active
													? 'border-cyan-400/60 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/30'
													: 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/40 hover:bg-white/10'
											}`}
										>
											<div className='flex items-center justify-between'>
												<span className='text-sm font-semibold'>{value.label}</span>
												{active ? (
													<span className='h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]' />
												) : null}
											</div>
											<p className='text-xs text-slate-300'>{value.note}</p>
											<p className='mt-1 text-[11px] text-slate-400'>{value.url}</p>
										</button>
									);
								}
							)}
						</div>
					</div>
					<p className='mt-3 text-xs text-slate-300'>
						当前 Base URL：<span className='text-cyan-200'>{DATA_SOURCES[apiSource].url}</span>
					</p>
				</div>

				<section className='grid gap-6 md:grid-cols-5'>
					<div className='md:col-span-3 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur'>
						<div className='flex items-center justify-between'>
							<div>
								<h2 className='text-xl font-semibold text-white'>Users</h2>
								<p className='text-sm text-slate-300'>智能化用户列表 + 快速增删。</p>
							</div>
						</div>

						<form className='grid grid-cols-1 gap-4 md:grid-cols-12' onSubmit={handleCreateUser}>
							<label className='md:col-span-4 space-y-2 text-sm text-slate-200'>
								<span className='text-xs uppercase tracking-[0.08em] text-cyan-200'>Email</span>
								<input
									id='email'
									type='email'
									className='w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
									placeholder='user@example.com'
									value={form.email}
									onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
									required
								/>
							</label>
							<label className='md:col-span-4 space-y-2 text-sm text-slate-200'>
								<span className='text-xs uppercase tracking-[0.08em] text-cyan-200'>Name</span>
								<input
									id='name'
									type='text'
									className='w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
									placeholder='Optional'
									value={form.name}
									onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
								/>
							</label>
							<div className='md:col-span-4 flex items-end'>
								<button
									type='submit'
									className='w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/40 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:from-cyan-800 disabled:to-emerald-700'
									disabled={creatingUser}
								>
									{creatingUser ? 'Adding...' : 'Add User'}
								</button>
							</div>
						</form>

						{usersError ? <p className='text-sm text-rose-200'>{usersError}</p> : null}

						<div className='overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-inner'>
							<div className='grid grid-cols-4 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200'>
								<span>Name</span>
								<span>Email</span>
								<span>Created</span>
								<span className='text-right'>Actions</span>
							</div>
							{usersLoading ? (
								<div className='px-4 py-3 text-sm text-slate-300'>Loading users...</div>
							) : sortedUsers.length ? (
								sortedUsers.map((user) => (
									<div
										key={user.id}
										className='grid grid-cols-4 items-center border-t border-white/5 px-4 py-3 text-sm text-white'
									>
										<span className='truncate text-slate-100'>{user.name || '—'}</span>
										<span className='truncate text-slate-200'>{user.email}</span>
										<span className='text-slate-400'>
											{new Date(user.createdAt).toLocaleString(undefined, {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</span>
										<div className='flex justify-end'>
											<button
												type='button'
												onClick={() => void handleDeleteUser(user.id)}
												className='rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow shadow-rose-500/40 transition hover:-translate-y-0.5 hover:bg-rose-400 disabled:translate-y-0 disabled:bg-rose-700/70'
												disabled={deletingUserId === user.id}
											>
												{deletingUserId === user.id ? 'Deleting...' : 'Delete'}
											</button>
										</div>
									</div>
								))
							) : (
								<div className='px-4 py-3 text-sm text-slate-300'>No users found.</div>
							)}
						</div>
					</div>

					<div className='md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-xl backdrop-blur'>
						<div className='flex items-center justify-between'>
							<div>
								<h2 className='text-xl font-semibold text-white'>GitHub Profile</h2>
								<p className='text-sm text-slate-300'>使用 Token 安全获取你的 GitHub 档案。</p>
							</div>
						</div>
						<div className='grid grid-cols-1 gap-4'>
							<input
								type='password'
								className='rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'
								placeholder='GitHub personal access token'
								value={githubToken}
								onChange={(event) => setGithubToken(event.target.value)}
							/>
							<button
								type='button'
								onClick={() => void handleFetchGithub()}
								className='w-full rounded-lg bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:from-indigo-800 disabled:via-cyan-800 disabled:to-emerald-800'
								disabled={githubLoading}
							>
								{githubLoading ? 'Loading...' : 'Fetch Profile'}
							</button>
						</div>
						{githubError ? <p className='text-sm text-rose-200'>{githubError}</p> : null}

						{githubProfile ? (
							<div className='flex gap-4 items-center rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner'>
								<img
									src={githubProfile.avatar_url}
									alt={githubProfile.login}
									className='h-16 w-16 rounded-full border border-white/20 object-cover shadow-lg shadow-indigo-500/30'
								/>
								<div className='space-y-1'>
									<div className='flex items-center gap-2'>
										<span className='text-lg font-semibold text-white'>{githubProfile.name || githubProfile.login}</span>
										<a
											className='text-sm text-cyan-200 hover:text-cyan-100 hover:underline'
											href={githubProfile.html_url}
											target='_blank'
											rel='noreferrer'
										>
											@{githubProfile.login}
										</a>
									</div>
									{githubProfile.bio ? <p className='text-sm text-slate-200'>{githubProfile.bio}</p> : null}
									<div className='text-xs text-slate-300 flex gap-3'>
										<span>Repos: {githubProfile.public_repos ?? '—'}</span>
										<span>Followers: {githubProfile.followers ?? '—'}</span>
										<span>Following: {githubProfile.following ?? '—'}</span>
									</div>
								</div>
							</div>
						) : githubLoading ? (
							<p className='text-sm text-slate-300'>Fetching profile...</p>
						) : (
							<p className='text-sm text-slate-400'>Token 仅用于当前请求。</p>
						)}
					</div>
				</section>
			</div>
		</div>
	);
};

export default memo(Home);
