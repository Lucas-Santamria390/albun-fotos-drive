<script lang="ts">
  import { onMount } from "svelte";

  const CLAVE = "malbum-tema";

  let oscuro = $state(false);

  onMount(() => {
    oscuro = document.documentElement.getAttribute("data-tema") === "oscuro";
  });

  function alternar(): void {
    oscuro = !oscuro;
    const tema = oscuro ? "oscuro" : "claro";
    document.documentElement.setAttribute("data-tema", tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* modo privado: el tema solo dura la sesión */
    }
  }
</script>

<button
  type="button"
  class="relative inline-grid h-8 w-14 shrink-0 cursor-pointer place-items-center rounded-full border border-borde bg-superficie-2 p-0 transition-colors hover:border-primario"
  role="switch"
  aria-checked={oscuro}
  aria-label="Cambiar entre tema claro y oscuro"
  title="Cambiar tema"
  onclick={alternar}
>
  <span
    class="absolute left-1 grid h-6 w-6 place-items-center rounded-full bg-superficie text-suave shadow-sm transition-transform duration-200 ease-[var(--curva)]"
    class:translate-x-6={oscuro}
    aria-hidden="true"
  >
    {#if oscuro}
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-linejoin="round"></path>
      </svg>
    {:else}
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="4"></circle>
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          stroke-linecap="round"></path>
      </svg>
    {/if}
  </span>
</button>
