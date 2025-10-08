<script lang="ts">
	let { selection, content }: { selection: string; content: string } = $props();
</script>

<span class="underline decoration-[var(--primary)] decoration-wavy">{selection}</span>
