<script lang="ts">
	import Profile, { type ProfileRow } from '$lib/models/profile';
	import { Worms, type Worm } from '$lib/models/worms';
	import {
		Friends,
		type FriendEdge,
		type PublicProfileCard,
		type FriendWithUsername
	} from '$lib/models/friends';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { Copy, RefreshCw, Plus, Check } from 'lucide-svelte';

	let currentProfile: ProfileRow | null = $state(null);
	let activeTab: 'activity' | 'friends' | 'account' = $state('activity');

	// Activity tab
	let userWorms: Worm[] = $state([]);
	let expandedWorms: Set<number> = $state(new Set());

	// Friends tab
	let friendsEdges: FriendWithUsername[] = $state([]);
	let searchResults: PublicProfileCard[] = $state([]);
	let searchQuery = $state('');
	let inviteCode = $state('');
	let redeemCode = $state('');

	let loading = $state(false);
	let inviteLoading = $state(false);
	let redeemLoading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let copiedRecently = $state(false);

	onMount(async () => {
		try {
			currentProfile = await Profile.getCurrentProfile();
			if (!currentProfile) {
				location.href = '/';
				return;
			}
			await loadUserWorms();
			await loadFriends();
		} catch (err: any) {
			error = err.message;
		}
	});

	async function loadUserWorms() {
		if (!currentProfile) return;
		userWorms = await Worms.byAuthorProfileId(currentProfile.id);
	}

	async function loadFriends() {
		friendsEdges = await Friends.listAcceptedWithUsernames();
	}

	async function deleteWorm(id: number) {
		if (!confirm('Are you sure you want to delete this worm?')) return;
		try {
			loading = true;
			await Worms.delete(id);
			await loadUserWorms();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function updateWormStatus(id: number, status: 'private' | 'friends' | 'public') {
		try {
			loading = true;
			await Worms.updateStatus(id, status);
			await loadUserWorms();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function toggleWormExpansion(id: number) {
		if (expandedWorms.has(id)) {
			expandedWorms.delete(id);
		} else {
			expandedWorms.add(id);
		}
		expandedWorms = new Set(expandedWorms);
	}

	async function searchFriends() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		try {
			loading = true;
			searchResults = await Friends.searchByUsername(searchQuery);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function createInvite() {
		try {
			inviteLoading = true;
			const invite = await Friends.createInvite();
			inviteCode = invite.code;
		} catch (err: any) {
			error = err.message;
		} finally {
			inviteLoading = false;
		}
	}

	async function redeemInvite() {
		if (!redeemCode.trim()) return;
		try {
			redeemLoading = true;
			await Friends.redeemInvite(redeemCode);
			redeemCode = '';
			await loadFriends();
			successMessage = 'Friend invite redeemed successfully!';
		} catch (err: any) {
			error = err.message;
		} finally {
			redeemLoading = false;
		}
	}

	async function addFriend(profileId: number) {
		try {
			loading = true;
			const { data, error } = await supabase
				.from('profiles')
				.select('auth_id')
				.eq('id', profileId)
				.single();

			if (error) throw error;
			if (!data?.auth_id) throw new Error('Profile not found');

			await Friends.request(data.auth_id);
			successMessage = 'Friend request sent!';
			searchResults = searchResults.filter((result) => result.profile_id !== profileId);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function removeFriend(authId: string) {
		if (!confirm('Are you sure you want to remove this friend?')) return;
		try {
			loading = true;
			await Friends.remove(authId);
			await loadFriends();
			successMessage = 'Friend removed successfully!';
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function deleteAccount() {
		if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
		try {
			loading = true;
			await Profile.deleteAccount();
			location.href = '/';
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function updateAllWormsStatus(status: 'private' | 'friends') {
		if (!confirm(`Make all your worms ${status}?`)) return;
		try {
			loading = true;
			await Profile.updateAllWormsStatus(status);
			await loadUserWorms();
			successMessage = `All worms set to ${status}!`;
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function clearMessages() {
		error = '';
		successMessage = '';
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedRecently = true;
			setTimeout(() => {
				copiedRecently = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copiedRecently = true;
			setTimeout(() => {
				copiedRecently = false;
			}, 2000);
		}
	}

	$effect(() => {
		if (searchQuery) {
			const debounceTimer = setTimeout(searchFriends, 300);
			return () => clearTimeout(debounceTimer);
		} else {
			searchResults = [];
		}
	});

	$effect(() => {
		if (successMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<title>dashboard ~ get-worms</title>

<main class="min-h-screen bg-black text-white">
	<div class="container mx-auto max-w-3xl px-4 py-6 pt-6 md:pt-16">
		<!-- Header -->
		<div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h1
					class="mb-1 text-2xl font-bold sm:text-3xl"
					style="font-family: 'Space Mono', monospace;"
				>
					Dashboard
				</h1>
				{#if currentProfile}
					<p class="text-sm text-gray-400">
						Welcome back, <span
							class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
							>@{currentProfile.username || 'Anonymous'}</span
						>
					</p>
				{/if}
			</div>
			<button
				onclick={async () => {
					loading = true;
					try {
						await Profile.signOut();
						location.href = '/';
					} catch (err: any) {
						error = err.message;
					} finally {
						loading = false;
					}
				}}
				disabled={loading}
				class="cursor-pointer rounded px-4 py-2 font-mono text-sm text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
				style="background-color: var(--accent);"
			>
				{loading ? 'SIGNING OUT...' : 'SIGN OUT'}
			</button>
		</div>

		{#if error}
			<div class="mb-6 flex items-center justify-between rounded bg-red-600 p-3 text-sm text-white">
				<span class="font-mono">{error}</span>
				<button onclick={() => (error = '')} class="cursor-pointer text-red-200 hover:text-white"
					>×</button
				>
			</div>
		{/if}

		{#if successMessage}
			<div
				class="mb-6 flex items-center justify-between rounded bg-green-600 p-3 text-sm text-white"
			>
				<span class="font-mono">{successMessage}</span>
				<button
					onclick={() => (successMessage = '')}
					class="cursor-pointer text-green-200 hover:text-white">×</button
				>
			</div>
		{/if}

		<!-- Tab Navigation -->
		<div class="mb-8 flex w-fit flex-wrap gap-1 rounded bg-gray-800 p-1">
			<button
				onclick={() => (activeTab = 'activity')}
				class="cursor-pointer rounded px-4 py-2 font-mono text-sm transition-colors hover:opacity-90 {activeTab ===
				'activity'
					? 'text-white'
					: 'text-gray-400 hover:text-white'}"
				style="background-color: {activeTab === 'activity' ? 'var(--accent)' : 'transparent'};"
			>
				ACTIVITY
			</button>
			<button
				onclick={() => (activeTab = 'friends')}
				class="cursor-pointer rounded px-4 py-2 font-mono text-sm transition-colors hover:opacity-90 {activeTab ===
				'friends'
					? 'text-white'
					: 'text-gray-400 hover:text-white'}"
				style="background-color: {activeTab === 'friends' ? 'var(--accent)' : 'transparent'};"
			>
				FRIENDS
			</button>
			<button
				onclick={() => (activeTab = 'account')}
				class="cursor-pointer rounded px-4 py-2 font-mono text-sm transition-colors hover:opacity-90 {activeTab ===
				'account'
					? 'text-white'
					: 'text-gray-400 hover:text-white'}"
				style="background-color: {activeTab === 'account' ? 'var(--accent)' : 'transparent'};"
			>
				ACCOUNT
			</button>
		</div>

		<!-- Tab Content -->
		<div class="tab-content">
			{#if activeTab === 'activity'}
				<!-- Recent Activity Tab -->
				<div class="space-y-6">
					<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
						<h2 class="font-mono text-lg font-bold">
							Your Recent <span
								class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
								>Worms</span
							>
						</h2>
						<span class="font-mono text-sm text-gray-400">{userWorms.length} total</span>
					</div>

					{#if userWorms.length === 0}
						<div class="py-12 text-center">
							<p class="mb-2 font-mono text-lg text-gray-300">No worms yet</p>
							<p class="text-sm text-gray-400">
								Get the <a class="underline" href="/extension">extension</a> to start worming now.
							</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each userWorms as worm (worm.id)}
								<div class="rounded border border-gray-700 bg-gray-900 p-4">
									<div class="mb-4 flex items-start justify-between">
										<div class="flex-1">
											<div class="mb-2 flex flex-wrap items-center gap-2">
												<span
													class="rounded px-2 py-1 font-mono text-xs {worm.status === 'public'
														? 'bg-green-600 text-green-100'
														: worm.status === 'friends'
															? 'text-white'
															: 'bg-gray-600 text-gray-100'}"
													style={worm.status === 'friends'
														? 'background-color: var(--accent);'
														: ''}
												>
													{worm.status}
												</span>
												<span class="font-mono text-xs text-gray-400"
													>{formatDate(worm.created_at)}</span
												>
											</div>
											<p class="font-mono text-xs text-gray-300">
												<span class="text-gray-500">on</span>
												<a
													href={worm.host_url}
													target="_blank"
													class="underline decoration-[var(--accent)] decoration-wavy decoration-1 transition-colors hover:text-white"
												>
													{new URL(worm.host_url).hostname}
												</a>
											</p>
										</div>
									</div>

									<!-- Worm Content -->
									<div class="mb-4 rounded border border-gray-800 bg-black p-3">
										{#if expandedWorms.has(worm.id)}
											<p class="text-sm leading-relaxed text-white">{worm.content}</p>
										{:else}
											<p class="text-sm leading-relaxed text-white">
												{worm.content.length > 150
													? worm.content.slice(0, 150) + '...'
													: worm.content}
											</p>
										{/if}
										{#if worm.content.length > 150}
											<button
												onclick={() => toggleWormExpansion(worm.id)}
												class="mt-2 cursor-pointer font-mono text-xs underline decoration-[var(--accent)] decoration-wavy decoration-1 transition-colors hover:text-white"
												style="color: var(--accent);"
											>
												{expandedWorms.has(worm.id) ? 'show less' : 'show more'}
											</button>
										{/if}
									</div>

									<!-- Actions -->
									<div class="flex flex-wrap items-center gap-2">
										<select
											onchange={(e) => {
												const target = e.target as HTMLSelectElement;
												if (target) {
													updateWormStatus(
														worm.id,
														target.value as 'private' | 'friends' | 'public'
													);
												}
											}}
											value={worm.status}
											disabled={loading}
											class="cursor-pointer rounded border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-xs text-white disabled:cursor-wait disabled:opacity-50"
										>
											<option value="private">private</option>
											<option value="friends">friends</option>
											<option value="public">public</option>
										</select>
										<button
											onclick={() => deleteWorm(worm.id)}
											disabled={loading}
											class="cursor-pointer rounded bg-red-600 px-3 py-1 font-mono text-xs text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
										>
											{loading ? 'deleting...' : 'delete'}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === 'friends'}
				<!-- Friends Tab -->
				<div class="space-y-6">
					<!-- Add Friend Section -->
					<div class="rounded border border-gray-700 bg-gray-900 p-4">
						<h3 class="mb-4 font-mono text-lg font-bold">
							Add <span class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
								>Friends</span
							>
						</h3>

						<div class="grid gap-4 sm:grid-cols-2">
							<!-- Create Invite -->
							<div>
								<h4 class="mb-2 font-mono text-sm text-gray-300">share invite code</h4>
								<div class="flex gap-2">
									{#if !inviteCode}
										<button
											onclick={createInvite}
											disabled={inviteLoading}
											class="flex cursor-pointer items-center gap-2 rounded px-3 py-2 font-mono text-xs text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
											style="background-color: var(--accent);"
										>
											{#if inviteLoading}
												<RefreshCw class="h-3 w-3 animate-spin" />
												generating...
											{:else}
												<Plus class="h-3 w-3" />
												generate
											{/if}
										</button>
									{:else}
										<div
											class="flex h-[38px] w-full items-center gap-2 rounded border border-gray-700 bg-black px-2 py-2"
										>
											<span class="flex-1 pl-2 font-mono text-xs text-white">{inviteCode}</span>
											<button
												onclick={() => copyToClipboard(inviteCode)}
												class="flex cursor-pointer items-center gap-1 rounded px-2 py-1 font-mono text-xs text-gray-300 transition-colors hover:text-white"
												title="Copy to clipboard"
											>
												{#if copiedRecently}
													<Check class="h-3 w-3 text-green-400" />
													<span class="text-green-400">copied</span>
												{:else}
													<Copy class="h-3 w-3" />
													copy
												{/if}
											</button>
											<button
												onclick={createInvite}
												disabled={inviteLoading}
												class="flex cursor-pointer items-center gap-1 rounded px-2 py-1 font-mono text-xs text-gray-300 transition-colors hover:text-white disabled:cursor-wait disabled:opacity-50"
												title="Generate new code"
											>
												{#if inviteLoading}
													<RefreshCw class="h-3 w-3 animate-spin" />
												{:else}
													<RefreshCw class="h-3 w-3" />
												{/if}
											</button>
										</div>
									{/if}
								</div>
							</div>

							<!-- Redeem Invite -->
							<div>
								<h4 class="mb-2 font-mono text-sm text-gray-300">use invite code</h4>
								<div class="flex gap-2">
									<input
										bind:value={redeemCode}
										placeholder="enter code"
										disabled={redeemLoading}
										class="h-[38px] flex-1 rounded border border-gray-700 bg-black px-2 py-2 font-mono text-xs text-white disabled:opacity-50"
									/>
									<button
										onclick={redeemInvite}
										disabled={!redeemCode.trim() || redeemLoading}
										class="h-[38px] cursor-pointer rounded px-3 py-2 font-mono text-xs text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
										style="background-color: var(--accent);"
									>
										{redeemLoading ? 'redeeming...' : 'redeem'}
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Search Friends -->
					<!-- <div class="rounded border border-gray-700 bg-gray-900 p-4">
						<h3 class="mb-4 font-mono text-lg font-bold">
							Find <span class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
								>Friends</span
							>
						</h3>
						<input
							bind:value={searchQuery}
							placeholder="search by username"
							class="mb-4 w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white"
						/>

						{#if searchResults.length > 0}
							<div class="space-y-2">
								{#each searchResults as result}
									<div
										class="flex items-center justify-between rounded border border-gray-800 bg-black p-3"
									>
										<div class="flex items-center gap-2">
											<span class="font-mono text-sm">@{result.username || 'Anonymous'}</span>
											{#if result.badge_slug}
												<span class="rounded bg-gray-700 px-2 py-1 font-mono text-xs text-gray-300"
													>{result.badge_slug}</span
												>
											{/if}
										</div>
										<button
											onclick={() => addFriend(result.profile_id)}
											disabled={loading}
											class="cursor-pointer rounded px-3 py-1 font-mono text-xs text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
											style="background-color: var(--accent);"
										>
											{loading ? 'adding...' : 'add'}
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div> -->

					<!-- Current Friends -->
					<div>
						<h3 class="mb-4 font-mono text-lg font-bold">
							Your <span class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
								>Friends</span
							>
							({friendsEdges.length})
						</h3>
						{#if friendsEdges.length === 0}
							<div class="py-8 text-center">
								<p class="font-mono text-sm text-gray-300">no friends yet</p>
								<p class="mt-1 text-xs text-gray-400">use invite system above</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each friendsEdges as friend}
									<div
										class="flex items-center justify-between rounded border border-gray-700 bg-gray-900 p-3"
									>
										<div>
											<p class="font-mono text-sm">
												{friend.username || 'unknown user'}
											</p>
											<p class="font-mono text-xs text-gray-400">
												since {formatDate(friend.created_at)}
											</p>
										</div>
										<button
											onclick={() => removeFriend(friend.auth_id)}
											class="cursor-pointer rounded bg-red-600 px-3 py-1 font-mono text-xs text-white transition-colors hover:bg-red-700"
										>
											remove
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{:else if activeTab === 'account'}
				<!-- Account Tab -->
				<div class="space-y-6">
					<div class="rounded border border-gray-700 bg-gray-900 p-4">
						<h3 class="mb-4 font-mono text-lg font-bold">
							Bulk <span class="underline decoration-[var(--accent)] decoration-wavy decoration-1"
								>Actions</span
							>
						</h3>
						<div class="space-y-4">
							<div>
								<p class="mb-2 font-mono text-sm text-gray-300">make all worms friends only:</p>
								<button
									onclick={() => updateAllWormsStatus('friends')}
									disabled={loading}
									class="cursor-pointer rounded px-4 py-2 font-mono text-xs text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
									style="background-color: var(--accent);"
								>
									{loading ? 'updating...' : 'set all worms to friends-only'}
								</button>
							</div>
							<div>
								<p class="mb-2 font-mono text-sm text-gray-300">make all worms private:</p>
								<button
									onclick={() => updateAllWormsStatus('private')}
									disabled={loading}
									class="cursor-pointer rounded bg-gray-700 px-4 py-2 font-mono text-xs text-white transition-colors hover:bg-gray-600 disabled:cursor-wait disabled:opacity-50"
								>
									{loading ? 'updating...' : 'set all worms to private'}
								</button>
							</div>
						</div>
					</div>

					<div class="rounded border border-red-800 bg-red-900/20 p-4">
						<h3 class="mb-4 font-mono text-lg font-bold text-red-400">
							<span class="underline decoration-red-400 decoration-wavy decoration-1"
								>danger zone</span
							>
						</h3>
						<div>
							<p class="mb-4 font-mono text-sm leading-relaxed text-gray-300">
								permanently delete account and all data. cannot be undone.
							</p>
							<button
								onclick={deleteAccount}
								disabled={loading}
								class="cursor-pointer rounded bg-red-600 px-4 py-2 font-mono text-xs text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
							>
								{loading ? 'deleting...' : 'delete account'}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style lang="postcss">
	@reference 'tailwindcss';
</style>
