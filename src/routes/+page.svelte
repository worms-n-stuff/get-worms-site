<script lang="ts">
	import Profile, { type ProfileRow } from '$lib/models/profile';
	import type { User } from '@supabase/supabase-js';

	let username = $state('');
	let email = $state('');
	let password = $state('');

	let authError: string | undefined = $state();
	let loading = $state(false);
	let currentProfile: ProfileRow | null = $state(null);

	// Check if user is already signed in
	$effect(() => {
		Profile.getCurrentProfile()
			.then((profile) => {
				currentProfile = profile;
				if (profile) {
					location.href = '/dashboard';
				}
			})
			.catch(async (error) => {
				if (error?.message?.includes('permission denied') || error?.code === '42501') {
					try {
						await Profile.signOut();
					} catch (signOutError) {
						console.warn('Failed to sign out:', signOutError);
					}
				}
				console.warn('Error getting current profile:', error);
				currentProfile = null;
			});
	});

	// Computed property to check if we should show the password field
	let showPasswordField = $derived(username.trim().length > 0);

	// Auto-generate email from username
	let generatedEmail = $derived(`${username.trim()}.get-worms@finnrw.com`);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (loading) return;

		// Basic validation
		if (!username.trim() || !password.trim()) {
			authError = 'Username and password are required';
			return;
		}

		loading = true;
		authError = undefined;

		try {
			// First try to sign up
			try {
				const { user, profile } = await Profile.signUp(username.trim(), generatedEmail, password);
				console.log('New user signed up:', user, profile);
				location.href = '/dashboard';
				return;
			} catch (signupError: any) {
				// If signup fails because user already exists, try to sign in instead
				if (
					signupError?.message?.includes('User already registered') ||
					signupError?.message?.includes('already registered') ||
					signupError?.code === 'user_already_exists'
				) {
					// Try to sign in with existing credentials
					try {
						const { user, profile } = await Profile.signIn(generatedEmail, password);
						console.log('Existing user signed in:', user, profile);
						location.href = '/dashboard';
						return;
					} catch (signinError: any) {
						// If sign in fails, it's likely a wrong password
						authError = 'Incorrect password for existing account';
						return;
					}
				} else {
					// Some other signup error
					throw signupError;
				}
			}
		} catch (err: any) {
			authError = err?.message ?? 'Authentication failed';
		} finally {
			loading = false;
		}
	}
</script>

<title>get-worms</title>

<main class="flex w-full flex-col items-center">
	<!-- HERO -->
	<section
		class="flex h-screen flex-col items-center justify-center gap-16 md:flex-row md:justify-start md:gap-4"
	>
		<div class="flex w-full max-w-none flex-col gap-6">
			<h1 class="text-6xl md:text-8xl" style="font-family: 'Space Mono', monospace;">get-worms</h1>

			<h2 class=" md:max-w-md">
				Leave insightful and lead-brained <span
					class="underline decoration-[var(--primary)] decoration-wavy decoration-1">worms</span
				> all over the world-wide-web, for everyone to see.
			</h2>
		</div>
		<!-- penois -->
		<form
			class="flex w-full flex-col items-center justify-center rounded-full font-mono text-white shadow-lg md:w-md"
			onsubmit={handleSubmit}
		>
			<h3 class="mb-4 w-full font-mono text-2xl font-bold">Get Your Brain Worm. Now.</h3>

			{#if authError}
				<div class="mb-4 w-full rounded-md bg-red-600 p-3 text-sm text-white">
					{authError}
				</div>
			{/if}

			<input
				type="text"
				bind:value={username}
				placeholder="USERNAME"
				oninput={() => (username = username.toLowerCase())}
				required
				disabled={loading}
				class="mb-4 w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:ring-2 focus:ring-[var(--accent)] focus:outline-none disabled:opacity-50"
			/>

			<input
				type="password"
				bind:value={password}
				placeholder="PASSWORD"
				required
				disabled={loading}
				class="mb-4 w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:ring-2 focus:ring-[var(--accent)] focus:outline-none disabled:opacity-50"
			/>

			<button
				type="submit"
				disabled={loading}
				class="w-full cursor-pointer rounded-md bg-[var(--accent)] p-3 font-semibold text-white transition hover:bg-[var(--accent-focus)] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'JOINING...' : 'JOIN'}
			</button>

			<div class="pt-4 text-xs text-gray-400">
				By joining you agree to our <a href="/policy" class="underline">policies</a>.
			</div>
		</form>
	</section>
</main>

<style lang="postcss">
	@reference 'tailwindcss';

	section {
		@apply w-full px-10 md:max-w-5xl md:px-0;
	}
</style>
