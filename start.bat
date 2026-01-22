@echo off
title Servidor DevolucionesApp
echo.
echo =================================_________=================================
echo   INICIANDO SERVIDOR LOCAL PARA APP DEVOLUCIONES
echo =================================_________=================================
echo.
echo NOTA: No cierres esta ventana mientras uses la aplicacion.
echo.
node server.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Hubo un problema al iniciar el servidor.
    echo Asegurate de estar en la carpeta AppDevoluciones.
    echo.
    pause
)
pause
