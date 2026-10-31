import { describe, it, expect } from "vitest";
import {
  agregarAlbum,
  destinoEnlace,
  enlaceAlbum,
  estaEnLista,
  leerAlbumes,
  nombreAlbum,
  parsearEnlace,
  quitarAlbum,
  serializarAlbumes,
} from "../src/lib/services/albumes";
import type { AlbumGuardado } from "../src/lib/tipos";

const base: AlbumGuardado = {
  drive: "fRaiz",
  inv: "fInv",
  users: "fUsers",
  fotos: "fFotos",
  album: "fAlbum",
  ocultas: "fOcultas",
  nombre: "Álbum de Ana",
  rol: "colaborador",
  unido: "2026-10-01T10:00:00.000Z",
};

const otro: AlbumGuardado = {
  ...base,
  drive: "fRaiz2",
  nombre: "Cumple de Luis",
  unido: "2026-10-02T10:00:00.000Z",
};

describe("leerAlbumes", () => {
  it("devuelve lista vacía si no hay nada guardado", () => {
    expect(leerAlbumes(null)).toEqual([]);
    expect(leerAlbumes("")).toEqual([]);
  });

  it("tolera JSON corrupto o con forma inesperada", () => {
    expect(leerAlbumes("{no es json")).toEqual([]);
    expect(leerAlbumes('{"drive":"x"}')).toEqual([]);
    expect(leerAlbumes("null")).toEqual([]);
  });

  it("descarta entradas a las que les falta un id", () => {
    const crudo = JSON.stringify([base, { ...base, fotos: "" }, { drive: "solo-drive" }]);
    const lista = leerAlbumes(crudo);
    expect(lista).toHaveLength(1);
    expect(lista[0]?.drive).toBe("fRaiz");
  });

  it("normaliza rol inválido y nombre vacío", () => {
    const crudo = JSON.stringify([{ ...base, rol: "superadmin", nombre: "   " }]);
    const [entrada] = leerAlbumes(crudo);
    expect(entrada?.rol).toBe("colaborador");
    expect(entrada?.nombre).toBe("Álbum compartido");
  });

  it("sobrevive a una ida y vuelta por serializarAlbumes", () => {
    const lista = [base, otro];
    expect(leerAlbumes(serializarAlbumes(lista))).toEqual(lista);
  });
});

describe("agregarAlbum", () => {
  it("añade el álbum al principio de la lista", () => {
    const lista = agregarAlbum([], base);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toEqual(base);
  });

  it("no duplica el mismo drive y actualiza nombre y rol", () => {
    const lista = agregarAlbum([base], {
      ...base,
      nombre: "Álbum renombrado",
      rol: "visitante",
      unido: "2026-11-01T00:00:00.000Z",
    });

    expect(lista).toHaveLength(1);
    expect(lista[0]?.nombre).toBe("Álbum renombrado");
    expect(lista[0]?.rol).toBe("visitante");
    // La fecha original de unión se conserva.
    expect(lista[0]?.unido).toBe(base.unido);
  });

  it("mantiene los demás álbumes al añadir uno nuevo", () => {
    const lista = agregarAlbum([base], otro);
    expect(lista.map((a) => a.drive)).toEqual(["fRaiz2", "fRaiz"]);
  });
});

describe("quitarAlbum y estaEnLista", () => {
  it("quita solo el álbum indicado", () => {
    const lista = quitarAlbum([base, otro], "fRaiz");
    expect(lista.map((a) => a.drive)).toEqual(["fRaiz2"]);
  });

  it("no falla si el álbum no estaba en la lista", () => {
    expect(quitarAlbum([base], "inexistente")).toHaveLength(1);
  });

  it("informa de la pertenencia por id de Drive", () => {
    expect(estaEnLista([base], "fRaiz")).toBe(true);
    expect(estaEnLista([base], "fRaiz2")).toBe(false);
  });
});

describe("enlaceAlbum", () => {
  it("construye el enlace sin token", () => {
    const enlace = enlaceAlbum(base, "https://album.example");
    const url = new URL(enlace);

    expect(url.origin).toBe("https://album.example");
    expect(url.pathname).toBe("/album.html");
    expect(url.searchParams.get("drive")).toBe("fRaiz");
    expect(url.searchParams.get("fotos")).toBe("fFotos");
    expect(url.searchParams.get("album")).toBe("fAlbum");
    expect(url.searchParams.get("ocultas")).toBe("fOcultas");
    expect(url.searchParams.has("token")).toBe(false);
  });

  it("omite el parámetro album si el enlace es antiguo", () => {
    const enlace = enlaceAlbum({ ...base, album: undefined }, "https://album.example");
    expect(enlace).not.toContain("album=");
  });

  it("omite el parámetro ocultas si el enlace es antiguo", () => {
    const enlace = enlaceAlbum({ ...base, ocultas: undefined }, "https://album.example");
    expect(enlace).not.toContain("ocultas=");
  });

  it("rechaza un origen inválido en lugar de inventarlo", () => {
    expect(() => enlaceAlbum(base, "")).toThrow();
    expect(() => enlaceAlbum(base, "album.example")).toThrow();
  });
});

describe("parsearEnlace", () => {
  it("extrae los ids de una URL completa", () => {
    const enlace = enlaceAlbum(base, "https://album.example");
    expect(parsearEnlace(enlace)).toEqual({
      drive: "fRaiz",
      inv: "fInv",
      users: "fUsers",
      fotos: "fFotos",
      album: "fAlbum",
      ocultas: "fOcultas",
    });
  });

  it("acepta solo la query string", () => {
    expect(parsearEnlace("drive=a&inv=b&users=c&fotos=d")).toEqual({
      drive: "a",
      inv: "b",
      users: "c",
      fotos: "d",
    });
  });

  it("lee ocultas cuando el enlace lo incluye", () => {
    expect(parsearEnlace("drive=a&inv=b&users=c&fotos=d&ocultas=e")).toEqual({
      drive: "a",
      inv: "b",
      users: "c",
      fotos: "d",
      ocultas: "e",
    });
  });

  it("ignora el token: la lista nunca guarda credenciales", () => {
    const datos = parsearEnlace("https://album.example/album.html?drive=a&inv=b&users=c&fotos=d&token=secreto");
    expect(datos).not.toBeNull();
    expect(JSON.stringify(datos)).not.toContain("secreto");
  });

  it("rechaza enlaces incompletos, vacíos o con otro protocolo", () => {
    expect(parsearEnlace("https://album.example/album.html?drive=a")).toBeNull();
    expect(parsearEnlace("   ")).toBeNull();
    expect(parsearEnlace("ftp://album.example/album.html?drive=a&inv=b&users=c&fotos=d")).toBeNull();
    expect(parsearEnlace("texto sin parámetros")).toBeNull();
  });
});

describe("destinoEnlace", () => {
  it("conserva el token al navegar con un enlace completo", () => {
    const destino = destinoEnlace(
      "https://album.example/album.html?drive=a&inv=b&users=c&fotos=d&token=secreto",
      "https://album.example",
    );
    expect(destino).toBe(
      "https://album.example/album.html?drive=a&inv=b&users=c&fotos=d&token=secreto",
    );
  });

  it("reconstruye el enlace cuando solo se pega la query string", () => {
    const destino = destinoEnlace("drive=a&inv=b&users=c&fotos=d&token=t", "https://album.example");
    expect(destino).toBe("https://album.example/album.html?drive=a&inv=b&users=c&fotos=d&token=t");
  });

  it("devuelve null si el enlace no sirve", () => {
    expect(destinoEnlace("hola", "https://album.example")).toBeNull();
    expect(destinoEnlace("drive=a", "https://album.example")).toBeNull();
  });
});

describe("nombreAlbum", () => {
  it("recorta y colapsa espacios", () => {
    expect(nombreAlbum({ nombre: "  Álbum   de   Ana  " })).toBe("Álbum de Ana");
  });

  it("cae al respaldo si no hay nombre", () => {
    expect(nombreAlbum(null)).toBe("Álbum compartido");
    expect(nombreAlbum({ nombre: "   " }, "Sin nombre")).toBe("Sin nombre");
  });

  it("limita el largo del nombre", () => {
    expect(nombreAlbum({ nombre: "x".repeat(120) }).length).toBe(60);
  });
});
