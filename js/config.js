/* =====================================================================
   CONFIG.JS · AQUÍ CAMBIAS TODO EL CONTENIDO SIN TOCAR EL RESTO DEL CÓDIGO
   Reglas: texto entre comillas "así" · no borres las comas del final de línea
   · para cambiar una imagen pon la ruta de tu archivo (ej: "assets/img/mi-foto.jpg").
   ===================================================================== */
window.RE = {

  /* ── 1. DATOS GENERALES ── */
  nombre: "Real State",
  // 👉 WhatsApp: código de país + número, SIN "+" ni espacios (EE. UU.: 13055551234)
  whatsapp: "584267932485",
  // 👉 Google Maps: busca tu oficina → Compartir → Copiar vínculo
  mapaUrl: "https://maps.app.goo.gl/3bEsjXgjokxbYiKP6",
  // 👉 Nombre del lugar de la oficina (banner grande de abajo)
  oficina: "Mar A Lago",
  // 👉 Texto legal del final
  legal: "Real State · Aviso de privacidad / Todos los derechos reservados · Empresa registrada y con presencia internacional.",
  // 👉 Redes (barras con foto pequeña). img = foto cuadrada de la barra · icono (si no hay img): "instagram", "linkedin", "link"
  redes: [
    { nombre: "Asesoramiento", url: "https://wa.me/584267932485", icono: "link",      img: "assets/img/agente3.jpg" },
    { nombre: "Instagram",     url: "https://www.instagram.com/disenadorgrafico.pr/?hl=es", icono: "instagram", img: "assets/img/casa2.jpg" },
    { nombre: "Linkedin",      url: "https://www.linkedin.com/in/daniela-mijares-037746214/",  icono: "linkedin",  img: "assets/img/casa4.jpg" }
  ],

  /* ── 2. MENSAJES PREDETERMINADOS DE WHATSAPP ── */
  mensajes: {
    cita: "Hola Real State 👋 Quisiera agendar una consulta.",
    catalogo: "Hola Real State 👋 Me gustaría ver más propiedades. Estoy buscando: (tipo de propiedad, ciudad, presupuesto, habitaciones…)",
    asesor: "Hola Real State 👋 Quisiera solicitar asesoría privada.",
    conPropiedades: "Hola Real State 👋 Quiero consultar disponibilidad y detalles de estas propiedades:",
    propiedad: "Hola Real State 👋 Quisiera información sobre {propiedad}."   // {propiedad} se reemplaza solo
  },

  /* ── 3. HEADER (SOLO VIDEO) ── */
  hero: {
    // 👉 VIDEO horizontal (PC). Mp4 de 8–15 s, sin sonido, menos de 6 MB. "" = solo se ve la imagen.
    video: "assets/video/videoheader.mp4",
    // 👉 VIDEO vertical para celular (opcional). Si lo dejas "" en el celular se usa el horizontal recortado al centro.
    videoMovil: "assets/video/videomovil.mp4",
    poster: "assets/img/hero-poster.jpg",     // imagen mientras carga (o si no hay video)
    // 👉 Qué parte del video se ve al recortarse en pantallas distintas: "center", "left", "right" o "30% 50%" (izq-der arriba-abajo)
    posicionVideo: "center",
    etiqueta: "Mansión moderna"               // texto de la pastillita azul de abajo a la derecha ("" = se oculta)
  },

  /* ── 4. PROPIEDADES (mini e-commerce) ──────────────────────────────────
     • imagen = foto de la tarjeta (4:3).
     • escenas = las 3 fotos del recorrido 360° (foto 360 completa 2:1, o panorámica del celular con angulo: 180).
       Los botones flotantes entre escenas se crean SOLOS. Si quieres ubicarlos tú: agrega puntos: [ { a: "Cocina", texto: "Cocina", yaw: 60, pitch: -3 } ]
       (para sacar yaw y pitch abre la página con ?editar al final, entra a la propiedad y toca donde quieres el botón).
     • palabrasClave = lo que la persona escribiría en el buscador (ciudad, tipo, características…). */
  propiedades: [
    { nombre: "Casa Bonita - Costa Azul", ubicacion: "Miami, California", imagen: "assets/img/casa1.jpg", disponible: true,
      descripcion: "Residencia frente al mar con piscina y terraza.", palabrasClave: "casa, miami, california, piscina, mar, costa azul",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Mansión moderna", ubicacion: "Miami, California", imagen: "assets/img/casa2.jpg", disponible: true,
      descripcion: "Mansión de diseño contemporáneo con jardín.", palabrasClave: "mansion, moderna, miami, california, jardin",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Mansión Vizu", ubicacion: "Washington", imagen: "assets/img/casa3.jpg", disponible: true,
      descripcion: "Vivienda familiar con campo de golf, tenis y piscina.", palabrasClave: "mansion, vizu, washington, golf, tenis, familiar, piscina",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Casa Japonesa", ubicacion: "Tokio, Japón", imagen: "assets/img/casa 8.jpg", disponible: true,
      descripcion: "Estadía vacacional con sauna, piscina y amplio jardín.", palabrasClave: "casa, japonesa, tokio, japon, sauna, vacacional, internacional",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Casa Bonita - Costa Azul (RD)", ubicacion: "República Dominicana", imagen: "assets/img/casa6.jpg", disponible: true,
      descripcion: "Casa tropical entre palmeras, a minutos de la playa.", palabrasClave: "casa, republica dominicana, playa, palmeras, tropical, internacional",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Casa Bonita - Costa Azul (Waterfront)", ubicacion: "Miami, California", imagen: "assets/img/casa7.jpg", disponible: true,
      descripcion: "Propiedad waterfront con muelle privado.", palabrasClave: "casa, waterfront, miami, muelle, mar, vista al mar",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Casa Familiar - Costa Azul", ubicacion: "Miami, California", imagen: "assets/img/casa5.jpg", disponible: true,
      descripcion: "Casa familiar de 4 habitaciones con garaje doble.", palabrasClave: "casa, familiar, miami, habitaciones, garaje",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] },
    { nombre: "Casa Bonita - Costa Azul (Jardín)", ubicacion: "Miami, California", imagen: "assets/img/casa4.jpg", disponible: false,
      descripcion: "Residencia contemporánea con jardín paisajista.", palabrasClave: "casa, jardin, miami, paisajista",
      escenas: [ { nombre: "Comedor", imagen: "assets/360/comedor.jpg" }, { nombre: "Cocina", imagen: "assets/360/cocina.jpg" }, { nombre: "Baño", imagen: "assets/360/bano.jpg" } ] }
  ],

  /* ── 5. CHAT / BUSCADOR (NO es IA) ──
     Pega aquí los links CSV publicados de tu Google Sheets (paso a paso en LEEME.md). "" = se usa la lista local. */
  sheetPropiedades: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBotojt1EEP4AncL5Ll7LL9WP1v2-q-uu5CeMPOHHgsJcwfR9sud_jAoim7F3E8zIH8jjsfOyO_Wc6/pub?gid=0&single=true&output=csv",   // pestaña "propiedades"
  sheetPreguntas:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBotojt1EEP4AncL5Ll7LL9WP1v2-q-uu5CeMPOHHgsJcwfR9sud_jAoim7F3E8zIH8jjsfOyO_Wc6/pub?gid=186364985&single=true&output=csv",   // pestaña "preguntas"
  sheetBusqueda:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBotojt1EEP4AncL5Ll7LL9WP1v2-q-uu5CeMPOHHgsJcwfR9sud_jAoim7F3E8zIH8jjsfOyO_Wc6/pub?gid=812243110&single=true&output=csv",   // pestaña "busqueda"
  sugerencias: ["Clientes internacionales", "Asesor", "Horarios", "Ubicación"],
  sinResultado: "Disculpa, no encontré eso. Cuéntanos más con el botón de asesoría privada o mira el catálogo completo.",
  preguntasLocal: [
    { pregunta: "Clientes internacionales", palabrasClave: "internacional, internacionales, extranjero, extranjeros, exterior, visa, comprar desde fuera",
      respuesta: "Sí, trabajamos con clientes internacionales. Te acompañamos en todo el proceso de compra a distancia. Solicita tu asesoría privada para ver las opciones." },
    { pregunta: "Asesor", palabrasClave: "asesor, asesora, agente, hablar, contactar, llamar",
      respuesta: "Con gusto: un asesor privado te acompaña sin costo. Toca \"Solicitar asesoría privada\" y te respondemos por WhatsApp." },
    { pregunta: "Horarios", palabrasClave: "horario, horarios, hora, abierto, abren, cierran, visita, visitas",
      respuesta: "Atendemos de lunes a sábado de 9:00 a 18:00 (hora del Este). Las visitas a propiedades se agendan con tu asesor." },
    { pregunta: "Ubicación", palabrasClave: "ubicacion, direccion, donde, oficina, oficinas, mapa, llegar",
      respuesta: "Nuestras oficinas están en Mar A Lago. Abre el botón \"Ubicación (Google Maps)\" de más abajo para ver cómo llegar." }
  ],

  /* ── 6. TU EQUIPO DE CONFIANZA (3 videos) ──
     👉 youtube: pega el link normal de YouTube (watch?v=…, youtu.be/…, shorts/…) y se convierte solo.
     👉 poster: la foto que se ve antes de reproducir. También acepta mp4: pon src: "assets/video/mi-video.mp4" en lugar de youtube. */
  equipo: [
    { titulo: "Asesora principal", youtube: "https://youtube.com/shorts/n8RmLhV1zIc?si=3XJSpXHBQ1AWEtsW", src: "", poster: "assets/img/agente3.jpg" },
    { titulo: "Director comercial", youtube: "https://youtube.com/shorts/1HLyhkD0c10?si=yc7phhO8reCUThL8", src: "", poster: "assets/img/agente1.jpg" },
    { titulo: "Asesora internacional", youtube: "https://youtube.com/shorts/4C39jKJxyf8?si=Svp5Uazj6uKgZfJh", src: "", poster: "assets/img/agente2.jpg" }
  ],

  /* ── 7. BUSCADOR DE PROPIEDAD IDEAL (como la "rutina") ──
     modoDemo: true  → siempre muestra el primer resultado (para la demo).
     modoDemo: false → elige el resultado que más coincida con lo que marcó la persona. */
  modoDemo: true,
  intereses: ["Residencias", "Penthouses", "Mansiones", "Casas", "Waterfront", "Vista al Mar", "Apartamentos", "Campo de Golf", "Fincas & Haciendas"],
  busqueda: [
    { intereses: "residencias, mansiones, casas, campo de golf, waterfront",
      resultados: [
        { propiedad: "Mansión Vizu", titulo: "Vivienda familiar", descripcion: "Incluye campo de Golf, Tenis y Piscina" },
        { propiedad: "Casa Japonesa", titulo: "Estadía vacacional", descripcion: "Incluye sauna, piscina y amplio jardín" }
      ] }
  ]
};
