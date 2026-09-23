Este es un "README" inicial, ira mutando durante el desarrollo del proyecto

***Yokai Inspector***

este proyecto es el entregable nro3 de *Xarxatec Activa* en el cual desarrollamos un juego web simple y original, nos hemos inspirado en el mitico juego *paper please* pero esta vez nos convertimos en un agente de la aduana espiritual, el cual podra impedir que los maliciosos Yōkai(妖怪), entren a nuestro mundo! o permitir su entrada y desatar el apocalipsis en la tierra.

------------------

*Tecnologias*

Aqui viene la parte divertida y desafiante, ya que solo se nos permite usar los conceptos vistos en clase (Vanilla JS), sin dependencias y con almacenamiento en el localStorage


*Ejecución*

Descarga el ejecutable de tu sistema operativo y ábrelo. El juego se abrirá en el navegador de ese equipo. La ventana del ejecutable mostrará también las direcciones para entrar desde un móvil u otro ordenador conectado a la misma red local. Mantén el ejecutable en marcha mientras jueguen otros dispositivos.

Para detener el servidor, pulsa `Ctrl+C` en la terminal donde se ejecuta. En Windows, si lo abriste con doble clic, también puedes cerrar la ventana de consola. En Linux, si lo abriste con doble clic y no aparece ninguna terminal, localiza el proceso con `pgrep -af YokaiInspector-linux-amd64` y detenlo con `kill PID`, sustituyendo `PID` por el número que muestre el comando. Si en Windows no aparece la consola, puedes finalizar `YokaiInspector-windows-amd64.exe` desde el Administrador de tareas. Cerrar la pestaña del navegador **no** detiene el servidor; por ahora no hay un botón para apagarlo desde el juego.

Los ejecutables incluyen todos los recursos del juego y no requieren instalar Node.js ni Go. Cada navegador guarda su partida por separado mediante `localStorage`.

Opciones de inicio:

```text
--local       Solo permite jugar en el equipo que ejecuta el programa.
--port 8080   Elige un puerto concreto; por defecto usa 4173 y busca hasta 4182 si está ocupado.
--no-open     No abre el navegador automáticamente.
```

Para crear ambos ejecutables desde Linux se necesita Node.js para compilar TypeScript y Go 1.22 o posterior para generar los binarios. Después:

```bash
npm ci
npm run package:executables
```

Los archivos resultantes aparecen en `release/YokaiInspector-linux-amd64` y `release/YokaiInspector-windows-amd64.exe`. En Linux quizá debas habilitar su ejecución con `chmod +x release/YokaiInspector-linux-amd64`. Si otro dispositivo no puede conectarse, permite el puerto mostrado por el programa en el firewall de la red privada.

Las imágenes de `public/img/` ya están optimizadas. Para procesar imágenes nuevas o modificadas se puede ejecutar `npm run optimize:images` con FFmpeg y ffprobe instalados; el script conserva el original cuando la versión nueva no ahorra al menos un 10 %.

*Estado actual*

*en construcción* :D

att: Iralys y Mike
