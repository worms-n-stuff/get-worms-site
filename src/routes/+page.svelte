<script lang="ts">
	let username = $state('');
	let pw = $state('');

	let signupError: string | undefined = $state();

	async function signup(e: SubmitEvent) {
		e.preventDefault();
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
					class="underline decoration-[var(--primary)] decoration-wavy">worms</span
				> (comments) all over the world-wide-web, for everyone to see.
			</h2>
		</div>
		<!-- penois -->
		<form
			class="flex w-full flex-col items-center justify-center rounded-full font-mono text-white shadow-lg md:w-md"
			onsubmit={signup}
		>
			<h3 class="mb-4 w-full font-mono text-2xl font-bold">Get Your Brain Worm. Now.</h3>
			<input
				type="text"
				bind:value={username}
				placeholder="USERNAME"
				required
				class="mb-4 w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
			/>
			<input
				type="password"
				bind:value={pw}
				placeholder="PASSWORD"
				required
				class="mb-4 w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
			/>
			<button
				type="submit"
				class="w-full cursor-pointer rounded-md bg-[var(--accent)] p-3 font-semibold text-white transition hover:bg-[var(--accent-focus)]"
			>
				JOIN
			</button>
		</form>
	</section>
</main>

<style lang="postcss">
	@reference 'tailwindcss';

	section {
		@apply w-full px-10 md:max-w-5xl md:px-0;
	}
</style>
