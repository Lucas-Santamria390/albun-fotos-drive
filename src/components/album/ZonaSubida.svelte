<script lang="ts">
  import { album } from "../../lib/stores/album.svelte";
  import { toastError, toastOk } from "../../lib/stores/toast.svelte";

  let arrastrando = $state(false);
  let input = $state<HTMLInputElement | null>(null);

  async function procesar(archivos: FileList | null): Promise<void> {
    if (!archivos || !archivos.length) return;
    try {
      const { ok, fallos } = await album.subir(archivos);
      if (ok === 1) toastOk("Foto subida.");
      if (ok > 1) toastOk(`${ok} fotos subidas.`);
      if (fallos.length) {
        toastError(
          fallos.length === 1
            ? `No se pudo subir una foto. ${fallos[0]}`
            : `No se pudieron subir ${fallos.length} fotos.`,
        );
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "No se pudieron subir las fotos.");
    } finally {
      if (input) input.value = "";
    }
  }

  function alSoltar(e: DragEvent): void {
    e.preventDefault();
    arrastrando = false;
    void procesar(e.dataTransfer?.files ?? null);
  }
</script>

{#if album.puedeSubir}
  <section class="mb-6" aria-label="Subir fotos">
    <div
      class="relative overflow-hidden rounded-lg border-2 border-dashed border-borde bg-superficie/60 p-6 text-center transition-colors hover:border-primario sm:p-8"
      class:border-primario={arrastrando}
      class:bg-primario-suave={arrastrando}
      role="button"
      tabindex="0"
      aria-label="Subir fotos: haz clic o arrastra archivos"
      onclick={() => input?.click()}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input?.click();
        }
      }}
      ondragover={(e) => {
        e.preventDefault();
        arrastrando = true;
      }}
      ondragleave={() => (arrastrando = false)}
      ondrop={alSoltar}
    >
      <div class="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primario-suave text-primario">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
        </svg>
      </div>
      <p class="text-sm font-semibold">
        {arrastrando ? "Suelta las fotos aquí" : "Haz clic o arrastra tus fotos aquí"}
      </p>
      <p class="mt-1 text-xs text-suave">JPG · PNG · GIF · WEBP · HEIC — puedes soltar varias a la vez</p>

      <input
        bind:this={input}
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        tabindex="-1"
        aria-hidden="true"
        onchange={(e) => procesar(e.currentTarget.files)}
      />
    </div>

    {#if album.subiendo.length}
      <ul class="mt-3 space-y-2" aria-live="polite">
        {#each album.subiendo as item (item.id)}
          <li
            class="rounded-md border px-3 py-2 text-xs"
            class:border-borde={item.estado !== "error"}
            class:border-peligro={item.estado === "error"}
          >
            <div class="flex items-center justify-between gap-3">
              <span class="truncate font-semibold">{item.nombre}</span>
              <span
                class:text-peligro={item.estado === "error"}
                class:text-exito={item.estado === "ok"}
                class:text-suave={item.estado === "subiendo"}
              >
                {item.estado === "ok" ? "Subida" : item.estado === "error" ? "Error" : item.pct + "%"}
              </span>
            </div>
            <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-superficie-2">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primario to-primario-2 transition-[width] duration-200"
                class:bg-peligro={item.estado === "error"}
                style="width: {item.pct}%"
              ></div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}
