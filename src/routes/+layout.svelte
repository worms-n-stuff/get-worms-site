<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="fixed right-0 bottom-0">
	<div class="mr-2 flex flex-row gap-4 p-2 text-xs text-gray-400">
		<a href="/">Home</a><a href="/about">About</a><a href="policy">Policies</a>
	</div>
</nav>

{@render children?.()}
