<script lang="ts">
  import { fly } from "svelte/transition";
  import { toasts, cerrarToast } from "../../lib/stores/toast.svelte";

  const colores: Record<string, string> = {
    ok: "border-exito/40 bg-exito-suave text-exito",
    error: "border-peligro/40 bg-peligro-suave text-peligro",
    info: "border-borde bg-superficie text-texto",
  };
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
  aria-live="polite"
  aria-atomic="false"
>
  {#each toasts as t (t.id)}
    <div
      class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium shadow-lg {colores[
        t.tipo
      ]}"
      transition:fly={{ y: 12, duration: 180 }}
      role={t.tipo === "error" ? "alert" : "status"}
    >
      <span class="mt-0.5 shrink-0" aria-hidden="true">
        {#if t.tipo === "ok"}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        {:else if t.tipo === "error"}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v5M12 16h.01" stroke-linecap="round"></path>
          </svg>
        {:else}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 11v5M12 8h.01" stroke-linecap="round"></path>
          </svg>
        {/if}
      </span>

      <p class="flex-1 leading-snug">{t.mensaje}</p>

      <button
        type="button"
        class="shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Cerrar notificación"
        onclick={() => cerrarToast(t.id)}
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"></path>
        </svg>
      </button>
    </div>
  {/each}
</div>
