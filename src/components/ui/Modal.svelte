<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    abierto?: boolean;
    titulo: string;
    descripcion?: string;
    cerrable?: boolean;
    onCerrar?: () => void;
    children?: Snippet;
    acciones?: Snippet;
  }

  const {
    abierto = false,
    titulo,
    descripcion,
    cerrable = true,
    onCerrar = undefined,
    children = undefined,
    acciones = undefined,
  }: Props = $props();

  let panel = $state<HTMLDivElement | null>(null);

  function cerrar(): void {
    if (cerrable) onCerrar?.();
  }

  function alPulsarTecla(e: KeyboardEvent): void {
    if (!abierto) return;
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
      return;
    }
    if (e.key !== "Tab" || !panel) return;

    const enfocables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!enfocables.length) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero?.focus();
    }
  }

  // Bloquea el scroll del fondo y mueve el foco al abrir.
  $effect(() => {
    if (!abierto) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const enfocable = panel?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      enfocable?.focus();
    }, 20);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = overflowPrevio;
    };
  });
</script>

<svelte:window onkeydown={alPulsarTecla} />

{#if abierto}
  <div class="fixed inset-0 z-50 grid place-items-center p-4">
    <button
      type="button"
      class="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
      aria-label="Cerrar diálogo"
      tabindex="-1"
      onclick={cerrar}
    ></button>

    <div
      bind:this={panel}
      class="anim-zoom relative w-full max-w-md rounded-lg border border-borde bg-superficie p-6 shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      aria-describedby={descripcion ? "modal-descripcion" : undefined}
    >
      <h2 id="modal-titulo" class="text-lg font-bold tracking-tight">{titulo}</h2>
      {#if descripcion}
        <p id="modal-descripcion" class="mt-1.5 text-sm text-suave">{descripcion}</p>
      {/if}

      <div class="mt-4 empty:hidden">
        {@render children?.()}
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2 empty:hidden">
        {@render acciones?.()}
      </div>
    </div>
  </div>
{/if}
