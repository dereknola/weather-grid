<script lang="ts">
  import { Cloud, CloudFog, CloudRain, CloudSnow, CloudSun, Sun } from '@lucide/svelte';
  import { describeWeather } from './weatherCodes';
  import type { WeatherKind } from './weatherCodes';

  let { code, size = 18, strokeWidth = 1.7 }: { code: number; size?: number; strokeWidth?: number } = $props();
  let kind: WeatherKind = $derived(describeWeather(code).kind);
</script>

{#if kind === 'clear'}<Sun {size} {strokeWidth} />{:else if kind === 'cloud'}<Cloud {size} {strokeWidth} />{:else if kind === 'fog'}<CloudFog {size} {strokeWidth} />{:else if kind === 'rain' || kind === 'storm'}<CloudRain {size} {strokeWidth} />{:else if kind === 'snow'}<CloudSnow {size} {strokeWidth} />{:else}<CloudSun {size} {strokeWidth} />{/if}
