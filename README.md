# Casa Villa Carolina

App en React para llevar los gastos, el reparto entre socios y la proyección de ganancia del flip en Solar #3, Manzana 202, Urb. Villa Carolina.

Los datos viven en el navegador. Se pueden respaldar en JSON, exportar a CSV y sincronizar en ambas direcciones con el Excel de proyección.

## Requisitos

- [Node.js](https://nodejs.org/) 20 o más reciente

## Uso local

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite (normalmente http://localhost:5173).

Para generar la versión que se publica:

```bash
npm run build
npm run preview
```

## Documentos y fotos

Pon los PDF, recibos y fotos en la carpeta `public/`, con el mismo nombre de archivo que ya usa la app. Vite los sirve desde la raíz, así que los enlaces de Documentos y Fotos funcionan igual que en el HTML original.

Si el repositorio va a ser público, no subas contratos, cheques, el NDA ni otros documentos privados.

## Subir a GitHub

En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Convierte Casa Villa Carolina a una app React"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/casa-villa-carolina.git
git push -u origin main
```

Crea el repositorio vacío en GitHub antes del `git remote`. `node_modules` y `dist` no se suben.

## Sincronizar con Excel

En Chrome o Edge, pulsa **Sincronizar Excel** y elige el archivo `.xlsx`. La hoja `Proyeccion` es la de gastos. La app añade las columnas Categoría e ID App, y escribe los supuestos en `Resumen (App)`. La compra y el cierre se manejan en la app.

En otros navegadores, al sincronizar se descarga el Excel actualizado para reemplazar el de la carpeta.
