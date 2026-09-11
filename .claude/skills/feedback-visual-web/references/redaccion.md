# Cómo se redacta un comentario

El documento lo lee alguien que no estuvo en la conversación donde se decidió el cambio, que
probablemente no habla español, y que va a ejecutar el cambio sin volver a preguntar si el
comentario alcanza. Todo lo de abajo sale de esa situación.

## La forma que funciona

```
Título        Qué cambiar, en cuatro o cinco palabras. Sustantivo, no frase.
Cuerpo        Dónde está y qué tiene que pasar. Una idea.
ok            Cómo se comprueba que quedó resuelto.
snippets      El código, cuando hay una forma concreta de hacerlo.
refs          Dónde verlo funcionando.
```

## Los cinco errores que más aparecen

### 1 · El comentario se contradice a sí mismo

Pasa cuando se describe un comportamiento con las palabras de la sensación, no del mecanismo.

> ✗ El header debe **quedarse arriba (oculto)** mientras el usuario hace scroll hacia abajo.

"Quedarse arriba" y "oculto" se leen como cosas opuestas: un dev entiende *sticky* cuando lo
que se pide es *hide on scroll down*. Se arregla nombrando la acción:

> ✓ El header debe **ocultarse** mientras el usuario hace scroll hacia abajo y **volver a
> aparecer** apenas hace scroll hacia arriba.

### 2 · No dice dónde mirar

> ✗ Alinear **esta sección** al 100% del ancho del container.

"Esta sección" funciona en una reunión con la pantalla compartida, no en un documento. La
captura ayuda, pero el texto tiene que sostenerse solo: se busca por Ctrl+F, se cita en un
ticket, se traduce. Nombra la sección como aparece en el sitio, entre comillas:

> ✓ La sección **«We protect your future.»** debe alinearse al 100% del ancho del container.

### 3 · No hay forma de saber cuándo está listo

Es el que más ida y vuelta genera. El comentario describe el problema y se calla justo antes de
lo único que cierra el tema.

> ✗ El FAQ debe tener transición al abrir y cerrar. Solo debe abrirse uno a la vez.
>
> ✓ …mismo texto… **Cómo se verifica:** abriendo las preguntas una tras otra, nunca quedan dos
> desplegadas al mismo tiempo y ninguna salta de golpe.

El criterio se escribe como lo que alguien *hace y ve*, no como una propiedad abstracta. "Los
números arrancan en 0 justo cuando el bloque entra en pantalla" es verificable; "el contador
está bien implementado" no.

### 4 · "Debería" cuando se quiere decir "debe"

En un documento de feedback, "debe" es requisito y "debería" es sugerencia. Cuando se mezclan
sin intención, el dev prioriza mal: deja para después algo que era obligatorio. Unifica en
"debe" y reserva "debería" para lo que de verdad es opcional.

Cuando algo **es** una sugerencia de verdad, no alcanza con escribirlo en condicional: se marca
con `kind: "suggestion"` y el documento lo agrupa aparte, al final de la página, con numeración
propia (S01) y encabezado de "Sugerencias". Es la diferencia entre que el equipo lea "otra cosa
que tengo que hacer" y "una propuesta que puedo tomar o no". Dos cuidados al redactarlas:

- **Decir explícitamente qué parte es el requisito**, si hay alguno debajo. "El requisito sigue
  siendo solo que el recorte exista" evita que la propuesta se lea como una imposición técnica.
- **El `ok` arranca con "Si se adopta:"**. Un criterio de aceptación redactado en seco convierte
  la sugerencia en requisito sin que nadie lo haya decidido.

### 5 · El pedido sin el porqué

Un pedido estético se discute; un pedido con mecanismo se ejecuta.

> ✗ Las imágenes deben tener el redondeo por CSS, no exportado.
>
> ✓ …exportar el redondeo obliga a la imagen a llevar **canal alfa** para que las esquinas
> queden transparentes, y eso la vuelve más pesada. Con CSS el archivo se exporta rectangular
> y liviano, y el radio se ajusta sin volver a exportar nada.

Cuando no hay un porqué técnico real, no lo inventes: un pedido de criterio visual declarado
como tal es más honesto y se discute mejor.

## El pedido que suena a reproche

Un comentario puede ser correcto y aun así llegar mal. Pasa sobre todo cuando el texto cuenta
lo fácil que es la tarea o lo que el otro se ahorraría haciéndola:

> ✗ De acá en adelante el equipo **debería poder extraerlos por su cuenta**: son tres clics y
> evita una ida y vuelta por cada ícono.

"Son tres clics" dice, sin decirlo, que no se hizo algo trivial. Lo mismo con "basta con", "es
simple", "solo hay que". El pedido sobrevive intacto si se saca el juicio y se deja la puerta
abierta:

> ✓ Dejamos el SVG listo para descargar, así no bloquea el avance. Para los próximos recursos,
> el panel de Export queda a mano **por si al equipo le resulta más cómodo** sacarlos
> directamente del Figma.

Vale también para el paso a paso: cuando hay una captura que lo muestra, explicarlo en seis
líneas suena a instructivo. Una línea y "ver la captura" alcanza.

## Referencias repetidas

Si el mismo sitio de referencia aparece en seis comentarios, seis etiquetas distintas
("Referencia del carrusel", "Referencia del contador"…) son ruido: el dev ya lo tiene abierto
en otra pestaña. Una sola etiqueta consistente — "Sitio de referencia" — y listo.

## Bilingüe

Las dos versiones se escriben juntas, no se traduce al final. Traducir después produce el
error clásico: el texto queda en inglés y **los comentarios dentro de los bloques de código
quedan en español**. Si un snippet lleva comentarios, su `code` es un par `T()`.

Los nombres propios de secciones del sitio no se traducen: «Stay Informed with the Latest
Updates» es lo que el dev ve en su editor, en cualquier idioma.

## Categorías

Cuatro, y alcanzan. Sirven para escanear el documento, no para clasificar con precisión:

| | |
|---|---|
| `interaccion` | Comportamiento: scroll, transiciones, autoplay, estados |
| `layout` | Espaciado, alineación, ancho del container |
| `performance` | Peso, formato, cantidad de descargas |
| `responsive` | Tablet y mobile |

Cuando un comentario cae en dos, gana el motivo por el que se pide. El redondeo por CSS es
`performance`, aunque hable de bordes, porque lo que se busca es que la imagen pese menos.

## Páginas todavía sin comentarios

Cada plantilla pendiente muestra un estado vacío con una lista de lo que se va a revisar. Sirve
para que el equipo sepa qué viene, pero ojo: **esa lista la redacta quien arma el documento, no
sale del feedback del cliente**. Confírmala antes de enviar el documento, o parecerá que se
comprometieron revisiones que nadie pidió.
