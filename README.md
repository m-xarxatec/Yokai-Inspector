Este es un "README" inicial, ira mutando durante el desarrollo del proyecto

***Yokai Inspector***

este proyecto es el entregable nro3 de *Xarxatec Activa* en el cual desarrollamos un juego web simple y original, nos hemos inspirado en el mitico juego *paper please* pero esta vez nos convertimos en un agente de la aduana espiritual, el cual podra impedir que los maliciosos Yōkai(妖怪), entren a nuestro mundo! o permitir su entrada y desatar el apocalipsis en la tierra.

------------------

*Tecnologias*

Aqui viene la parte divertida y desafiante, ya que solo se nos permite usar los conceptos vistos en clase (Vanilla JS), sin dependencias y con almacenamiento en el localStorage


*Ejecución*

Descarga el ejecutable de tu sistema operativo y ábrelo. El juego se abrirá en el navegador de ese equipo. La ventana del ejecutable mostrará también las direcciones para entrar desde un móvil u otro ordenador conectado a la misma red local. Mantén esa ventana abierta mientras jueguen otros dispositivos y ciérrala con Ctrl+C.

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

*Estado actual*

*en construcción* :D

att: Iralys y Mike
