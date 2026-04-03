@echo off
echo ========================================================
echo  Lokaler Webserver fuer Smartphone und Laptop
echo ========================================================
echo.
echo Deine aktuellen IP-Adressen im Netzwerk:
ipconfig | findstr /i "IPv4"
echo.
echo --------------------------------------------------------
echo !! WICHTIG: Oeffne auf deinem Handy den Browser und 
echo !! tippe eine der IP-Adressen gefolgt von :8080 ein.
echo !!
echo !! Beispiel: http://192.168.188.49:8080
echo --------------------------------------------------------
echo.
echo Server laeuft! Beende ihn, indem du dieses Fenster schliesst
echo oder STRG+C drueckst.
echo.
python -m http.server 8080 --bind 0.0.0.0
pause
